const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');

// Shiv — functions 15-18
// POST   /api/providers/spots                  → addSpot()
// PATCH  /api/providers/spots/:id/availability → updateAvailability()
// DELETE /api/providers/spots/:id              → deleteSpot()
// GET    /api/providers/:id/history            → getProviderHistory()

// Get all spots belonging to the logged-in provider
router.get('/providers/spots', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('provider_id', req.user.sub);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, data });
});

// Add a new parking spot
router.post('/providers/spots', verifyToken, async (req, res) => {
    const provider_id = req.user.sub; // taken from verified JWT, not request body
    const { address, zip_code, hourly_rate, spot_type, description, latitude, longitude, image } = req.body;

    if (!address || !zip_code || !hourly_rate || !spot_type || !image) {
        return res.status(400).json({
            success: false,
            error: 'image, address, zip_code, hourly_rate, and spot_type are required',
        });
    }

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .insert([{ address, zip_code, hourly_rate, spot_type, description, provider_id, latitude, longitude, available: true, image: image}])
        .select();

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, data: data[0] });
});

// Delete a parking spot
router.delete('/providers/spots/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    const supabase = req.app.get('supabase');

    const { error } = await supabase
        .from('parking_spots')
        .delete()
        .eq('spot_id', id);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Spot deleted' });
});

module.exports = router;
