const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const { getConflictingSpotIds, updateAvailability } = require('../utils/spotHelpers');

// GET /api/spots/allSpots?start_time=...&end_time=...
// Returns all available spots. If start_time + end_time are provided, also filters out
// spots that have a conflicting active/pending booking in that window.
router.get('/allSpots', async (req, res) => {
    const supabase = req.app.get('supabase');
    const { start_time, end_time } = req.query;

    let excludedIds = [];
    if (start_time && end_time) {
        const start = new Date(start_time);
        const end   = new Date(end_time);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({ success: false, error: 'Invalid start_time or end_time' });
        }
        excludedIds = await getConflictingSpotIds(supabase, start_time, end_time);
    }

    let query = supabase.from('parking_spots').select('*').eq('available', true);
    if (excludedIds.length > 0) {
        query = query.not('spot_id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    res.json({ success: true, count: data.length, data });
});

// GET /api/spots/spotByZip?zip_code=...&start_time=...&end_time=...
// Same time-window filtering as allSpots, scoped to a zip code.
router.get('/spotByZip', async (req, res) => {
    const { zip_code, start_time, end_time } = req.query;

    if (!zip_code) {
        return res.status(400).json({ success: false, error: 'zip_code is required' });
    }

    const supabase = req.app.get('supabase');

    let excludedIds = [];
    if (start_time && end_time) {
        const start = new Date(start_time);
        const end   = new Date(end_time);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({ success: false, error: 'Invalid start_time or end_time' });
        }
        excludedIds = await getConflictingSpotIds(supabase, start_time, end_time);
    }

    let query = supabase.from('parking_spots').select('*').eq('zip_code', zip_code).eq('available', true);
    if (excludedIds.length > 0) {
        query = query.not('spot_id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    res.json({ success: true, count: data.length, data });
});

// GET /api/spots/spot/:id — single spot details
router.get('/spot/:id', async (req, res) => {
    const { id } = req.params;
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('spot_id', id)
        .single();

    if (error) return res.status(404).json({ success: false, error: error.message });

    res.json({ success: true, data });
});

// GET /api/spots/spot/:id/booked-slots
// Returns all active/pending_provider booking windows for a spot so the frontend
// can show which times are already taken.
router.get('/spot/:id/booked-slots', async (req, res) => {
    const spotId = parseInt(req.params.id);
    if (isNaN(spotId)) return res.status(400).json({ success: false, error: 'Invalid spot ID' });

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('bookings')
        .select('booking_id, start_time, end_time, status')
        .eq('spot_id', spotId)
        .in('status', ['active', 'pending_provider'])
        .order('start_time', { ascending: true });

    if (error) return res.status(500).json({ success: false, error: error.message });

    res.json({ success: true, count: data.length, data });
});

// PATCH /api/spots/:id/availability — provider toggles available on/off
// Body: { available: true | false }
router.patch('/:id/availability', verifyToken, async (req, res) => {
    const spotId    = parseInt(req.params.id);
    const providerId = req.user.sub;
    const { available } = req.body;

    if (isNaN(spotId)) return res.status(400).json({ success: false, error: 'Invalid spot ID' });
    if (typeof available !== 'boolean') {
        return res.status(400).json({ success: false, error: 'available must be a boolean' });
    }

    const supabase = req.app.get('supabase');
    const result = await updateAvailability(supabase, spotId, providerId, available);

    if (!result.success) {
        const code = result.error === 'Unauthorized' ? 403 : result.error === 'Spot not found' ? 404 : 500;
        return res.status(code).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.data });
});

// GET /api/spots/autocomplete?text=... — Geoapify address autocomplete
router.get('/autocomplete', async (req, res) => {
    const { text } = req.query;
    if (!text) return res.status(400).json({ success: false, error: 'text is required' });

    try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:us&format=json&apiKey=${process.env.GEOAPIFY_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('Geoapify status:', response.status, 'results:', data.results?.length ?? 0);
        res.json({ success: true, results: data.results ?? [] });
    } catch (err) {
        console.error('Autocomplete error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
