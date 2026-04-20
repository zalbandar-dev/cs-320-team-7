const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');

// Search all available parking spots
router.get('/allSpots', async (req, res) => {
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .select('*');

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// Search available parking spots by zip code
router.get('/spotByZip', async (req, res) => {
    const { zip_code } = req.query;

    if (!zip_code) {
        return res.status(400).json({ success: false, error: 'zip_code is required' });
    }

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('zip_code', zip_code)
        .eq('available', true);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// Get a single parking spot by ID
router.get('/spot/:id', async (req, res) => {
    const { id } = req.params;
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('spot_id', id)
        .single();

    if (error) {
        return res.status(404).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
});

// Address autocomplete via Geoapify
router.get('/autocomplete', async (req, res) => {
    const { text } = req.query;

    if (!text) {
        return res.status(400).json({ success: false, error: 'text is required' });
    }

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