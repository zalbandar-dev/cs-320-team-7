const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');

// POST /api/bookings — create a booking
router.post('/bookings', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;

    const { spot_id, start_time, end_time, vehicle_make, vehicle_model, license_plate } = req.body;

    if (!spot_id || !start_time || !end_time || !vehicle_make || !vehicle_model || !license_plate) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    if (start >= end) {
        return res.status(400).json({ success: false, error: 'End time must be after start time' });
    }

    if (start < new Date()) {
        return res.status(400).json({ success: false, error: 'Start time must be in the future' });
    }

    const durationHours = (end - start) / (1000 * 60 * 60);

    if (durationHours < 0.5) {
        return res.status(400).json({ success: false, error: 'Minimum booking duration is 30 minutes' });
    }

    if (durationHours > 30 * 24) {
        return res.status(400).json({ success: false, error: 'Maximum booking duration is 30 days' });
    }

    // Fetch spot
    const { data: spot, error: spotError } = await supabase
        .from('parking_spots')
        .select('spot_id, hourly_rate, available')
        .eq('spot_id', spot_id)
        .single();

    if (spotError || !spot) {
        return res.status(404).json({ success: false, error: 'Spot not found' });
    }

    if (!spot.available) {
        return res.status(409).json({ success: false, error: 'Spot is not available' });
    }

    // Check for overlapping active bookings
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('booking_id')
        .eq('spot_id', spot_id)
        .eq('status', 'active')
        .lt('start_time', end_time)
        .gt('end_time', start_time);

    if (conflicts && conflicts.length > 0) {
        return res.status(409).json({ success: false, error: 'Spot is already booked for that time' });
    }

    // Calculate price
    const hours = (end - start) / (1000 * 60 * 60);
    const total_price = parseFloat((hours * spot.hourly_rate).toFixed(2));

    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({ user_id: userId, spot_id, start_time, end_time, total_price, vehicle_make, vehicle_model, license_plate })
        .select()
        .single();

    if (bookingError) {
        console.error('Booking insert error:', bookingError);
        return res.status(500).json({ success: false, error: 'Failed to create booking' });
    }

    return res.status(201).json({ success: true, data: booking });
});

// GET /api/bookings — get current user's bookings
router.get('/bookings', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, parking_spots(address, zip_code, hourly_rate, spot_type)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch bookings error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }

    return res.json({ success: true, count: bookings.length, data: bookings });
});

// PATCH /api/bookings/:id/cancel — cancel a booking
router.patch('/bookings/:id/cancel', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
        return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('booking_id, status, user_id')
        .eq('booking_id', bookingId)
        .single();

    if (fetchError || !booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (booking.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Only active bookings can be cancelled' });
    }

    const { data: updated, error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .select()
        .single();

    if (updateError) {
        return res.status(500).json({ success: false, error: 'Failed to cancel booking' });
    }

    return res.json({ success: true, data: updated });
});

module.exports = router;
