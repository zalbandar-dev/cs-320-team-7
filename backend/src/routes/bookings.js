const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');

// POST /api/bookings — create a booking
router.post('/bookings', verifyToken, async (req, res) => {
    const user_id = req.user.sub; // numeric user_id from JWT
    const { spot_id, start_time, end_time, vehicle_make, vehicle_model, license_plate } = req.body;

    if (!spot_id || !start_time || !end_time || !vehicle_make || !vehicle_model || !license_plate) {
        return res.status(400).json({
            success: false,
            error: 'spot_id, start_time, end_time, vehicle_make, vehicle_model, and license_plate are required',
        });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    if (end <= start) {
        return res.status(400).json({ success: false, error: 'end_time must be after start_time' });
    }

    const supabase = req.app.get('supabase');

    // Fetch spot to verify it exists and is available
    const { data: spot, error: spotError } = await supabase
        .from('parking_spots')
        .select('hourly_rate, available, provider_id')
        .eq('spot_id', spot_id)
        .single();

    if (spotError || !spot) {
        return res.status(404).json({ success: false, error: 'Spot not found' });
    }
    if (!spot.available) {
        return res.status(409).json({ success: false, error: 'Spot is not available' });
    }

    // Prevent provider from booking their own spot
    if (spot.provider_id === user_id) {
        return res.status(400).json({ success: false, error: 'You cannot book your own spot' });
    }

    // Check for overlapping active bookings
    const { data: overlapping, error: overlapError } = await supabase
        .from('bookings')
        .select('booking_id')
        .eq('spot_id', spot_id)
        .neq('status', 'cancelled')
        .lt('start_time', end_time)
        .gt('end_time', start_time);

    if (overlapError) {
        return res.status(500).json({ success: false, error: overlapError.message });
    }
    if (overlapping && overlapping.length > 0) {
        return res.status(409).json({ success: false, error: 'Spot is already booked for this time range' });
    }

    // Calculate total price from hourly rate
    const hours = (end - start) / (1000 * 60 * 60);
    const total_price = parseFloat((spot.hourly_rate * hours).toFixed(2));

    const { data, error } = await supabase
        .from('bookings')
        .insert([{
            user_id,
            spot_id,
            start_time,
            end_time,
            total_price,
            vehicle_make,
            vehicle_model,
            license_plate,
            status: 'active',
        }])
        .select();

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, data: data[0] });
});

// GET /api/bookings — get the logged-in user's bookings
router.get('/bookings', verifyToken, async (req, res) => {
    const user_id = req.user.sub;
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('bookings')
        .select('*, parking_spots(address, spot_type, hourly_rate, zip_code)')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
});

// PATCH /api/bookings/:id/cancel — cancel a booking
router.patch('/bookings/:id/cancel', verifyToken, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.sub;
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('booking_id', id)
        .eq('user_id', user_id) // ensure users can only cancel their own bookings
        .select();

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
    if (!data || data.length === 0) {
        return res.status(403).json({ success: false, error: 'Booking not found or not yours' });
    }

    res.json({ success: true, data: data[0] });
});

module.exports = router;
