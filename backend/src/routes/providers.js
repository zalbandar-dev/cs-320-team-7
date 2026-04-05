const express = require('express');
const router = express.Router();

// Shiv — functions 15-18
// POST   /api/providers/spots                  → addSpot()
// PATCH  /api/providers/spots/:id/availability → updateAvailability()
// DELETE /api/providers/spots/:id              → deleteSpot()
// GET    /api/providers/:id/history            → getProviderHistory()

// Add a new parking spot
router.post('/providers/spots', async (req, res) => {
    const { address, zip_code, hourly_rate, spot_type, description, provider_id, latitude, longitude } = req.body;

    if (!address || !zip_code || !hourly_rate || !spot_type || !provider_id) {
        return res.status(400).json({
            success: false,
            error: 'address, zip_code, hourly_rate, spot_type, and provider_id are required',
        });
    }

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .insert([{ address, zip_code, hourly_rate, spot_type, description, provider_id, latitude, longitude, available: true }])
        .select();

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, data: data[0] });
});

// Delete a parking spot
router.delete('/providers/spots/:id', async (req, res) => {
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
