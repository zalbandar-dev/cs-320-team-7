const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');

// POST /api/bookings — create a booking (defaults to pending_provider)
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

    // Fetch spot — must exist and be available
    const { data: spot, error: spotError } = await supabase
        .from('parking_spots')
        .select('spot_id, hourly_rate, available, provider_id, address')
        .eq('spot_id', spot_id)
        .single();

    if (spotError || !spot) {
        return res.status(404).json({ success: false, error: 'Spot not found' });
    }

    if (!spot.available) {
        return res.status(409).json({ success: false, error: 'This spot is not currently accepting bookings' });
    }

    // Overlap check: reject if any active OR pending_provider booking overlaps the requested window.
    // Overlap condition: new.start < existing.end AND new.end > existing.start
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('booking_id')
        .eq('spot_id', spot_id)
        .in('status', ['active', 'pending_provider'])
        .lt('start_time', end_time)
        .gt('end_time', start_time);

    if (conflicts && conflicts.length > 0) {
        return res.status(409).json({ success: false, error: 'That time slot is already booked. Try a different window.' });
    }

    const total_price = parseFloat(((end - start) / (1000 * 60 * 60) * spot.hourly_rate).toFixed(2));

    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            user_id: userId,
            spot_id,
            start_time,
            end_time,
            total_price,
            vehicle_make,
            vehicle_model,
            license_plate,
            status: 'pending_provider',
        })
        .select()
        .single();

    if (bookingError) {
        console.error('Booking insert error:', bookingError);
        return res.status(500).json({ success: false, error: 'Failed to create booking' });
    }

    // Notify the spot owner a booking request came in
    await supabase.from('notifications').insert({
        user_id: spot.provider_id,
        type:    'booking_received',
        message: `New booking request for your spot at ${spot.address}. Go to Booking Requests to confirm or reject it.`,
    });

    return res.status(201).json({ success: true, data: booking });
});

// GET /api/bookings — current user's own bookings
router.get('/bookings', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, parking_spots(address, zip_code, hourly_rate, spot_type)')
        .eq('user_id', userId)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }

    return res.json({ success: true, count: bookings.length, data: bookings });
});

// GET /api/bookings/provider — all bookings for spots this provider owns
// Must be defined before /:id routes so 'provider' is not matched as an id.
router.get('/bookings/provider', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const providerId = req.user.sub;

    // Get all spot_ids owned by this provider
    const { data: spots, error: spotsError } = await supabase
        .from('parking_spots')
        .select('spot_id')
        .eq('provider_id', providerId);

    if (spotsError) {
        return res.status(500).json({ success: false, error: 'Failed to fetch your spots' });
    }

    if (!spots || spots.length === 0) {
        return res.json({ success: true, count: 0, data: [] });
    }

    const spotIds = spots.map(s => s.spot_id);

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, parking_spots(address, zip_code, spot_type, hourly_rate), users(first_name, last_name, username, email, phone)')
        .in('spot_id', spotIds)
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }

    return res.json({ success: true, count: bookings.length, data: bookings });
});

// PATCH /api/bookings/:id/confirm — provider confirms a pending booking → active
router.patch('/bookings/:id/confirm', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const providerId = req.user.sub;
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
        return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    // Fetch booking + spot to verify ownership
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('booking_id, status, user_id, spot_id, parking_spots(provider_id, address)')
        .eq('booking_id', bookingId)
        .single();

    if (fetchError || !booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.parking_spots.provider_id !== providerId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (booking.status !== 'pending_provider') {
        return res.status(400).json({ success: false, error: 'Only pending bookings can be confirmed' });
    }

    const { data: updated, error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .select()
        .single();

    if (updateError) {
        return res.status(500).json({ success: false, error: 'Failed to confirm booking' });
    }

    // Notify the customer their booking was confirmed
    await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type:    'booking_confirmed',
        message: `Your booking at ${booking.parking_spots.address} has been confirmed! You're all set.`,
    });

    return res.json({ success: true, data: updated });
});

// PATCH /api/bookings/:id/reject — provider rejects a pending booking → cancelled
router.patch('/bookings/:id/reject', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const providerId = req.user.sub;
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
        return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('booking_id, status, user_id, spot_id, parking_spots(provider_id, address)')
        .eq('booking_id', bookingId)
        .single();

    if (fetchError || !booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.parking_spots.provider_id !== providerId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (booking.status !== 'pending_provider') {
        return res.status(400).json({ success: false, error: 'Only pending bookings can be rejected' });
    }

    const { data: updated, error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .select()
        .single();

    if (updateError) {
        return res.status(500).json({ success: false, error: 'Failed to reject booking' });
    }

    // Notify the customer their booking was rejected
    await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type:    'booking_rejected',
        message: `Your booking request for ${booking.parking_spots.address} was declined by the owner. Try a different spot or time.`,
    });

    return res.json({ success: true, data: updated });
});

// PATCH /api/bookings/:id/cancel — customer cancels their own booking
router.patch('/bookings/:id/cancel', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;
    const bookingId = parseInt(req.params.id);

    if (isNaN(bookingId)) {
        return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('booking_id, status, user_id, parking_spots(provider_id, address)')
        .eq('booking_id', bookingId)
        .single();

    if (fetchError || !booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (!['active', 'pending_provider'].includes(booking.status)) {
        return res.status(400).json({ success: false, error: 'Only active or pending bookings can be cancelled' });
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

    // Notify the spot owner the customer cancelled
    if (booking.parking_spots) {
        await supabase.from('notifications').insert({
            user_id: booking.parking_spots.provider_id,
            type:    'booking_cancelled',
            message: `A customer cancelled their booking at ${booking.parking_spots.address}. That time slot is now available again.`,
        });
    }

    return res.json({ success: true, data: updated });
});

// ─── REVIEWS ────────────────────────────────────────────────────────────

// GET /api/bookings/reviews/check?spot_id=123
// Returns whether current user has already reviewed this spot
router.get('/bookings/reviews/check', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;
    const spotId = parseInt(req.query.spot_id);

    if (isNaN(spotId)) {
        return res.status(400).json({ success: false, error: 'Invalid spot_id' });
    }

    const { data, error } = await supabase
        .from('reviews')
        .select('review_id')
        .eq('user_id', userId)
        .eq('spot_id', spotId);

    if (error) {
        return res.status(500).json({ success: false, error: 'Failed to check review status' });
    }

    return res.json({ success: true, hasReviewed: data.length > 0 });
});

// POST /api/bookings/reviews — submit a review
router.post('/bookings/reviews', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;
    const { spot_id, booking_id, rating, comment } = req.body;

    if (!spot_id || !booking_id || !rating) {
        return res.status(400).json({ success: false, error: 'spot_id, booking_id, and rating are required' });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
    }

    // Verify the booking belongs to this user and is completed
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('booking_id, user_id, spot_id, status, end_time')
        .eq('booking_id', booking_id)
        .single();

    if (bookingError || !booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Allow review if booking is completed OR if end_time has passed (for active bookings)
    const now = new Date();
    const endTime = new Date(booking.end_time);
    if (booking.status === 'cancelled') {
        return res.status(400).json({ success: false, error: 'Cannot review a cancelled booking' });
    }
    if (endTime > now && booking.status !== 'completed') {
        return res.status(400).json({ success: false, error: 'Can only review past bookings' });
    }

    // Check for duplicate review (same user + same spot)
    const { data: existing } = await supabase
        .from('reviews')
        .select('review_id')
        .eq('user_id', userId)
        .eq('spot_id', spot_id);

    if (existing && existing.length > 0) {
        return res.status(409).json({ success: false, error: 'You have already reviewed this spot' });
    }

    const { data: review, error: insertError } = await supabase
        .from('reviews')
        .insert({
            user_id: userId,
            spot_id,
            booking_id,
            rating,
            comment: comment?.trim() || null,
        })
        .select()
        .single();

    if (insertError) {
        console.error('Review insert error:', insertError);
        return res.status(500).json({ success: false, error: 'Failed to submit review' });
    }

    return res.status(201).json({ success: true, data: review });
});

// GET /api/bookings/reviews/spot/:spotId — get average rating + count for a spot
router.get('/bookings/reviews/spot/:spotId', async (req, res) => {
    const supabase = req.app.get('supabase');
    const spotId = parseInt(req.params.spotId);

    if (isNaN(spotId)) {
        return res.status(400).json({ success: false, error: 'Invalid spot_id' });
    }

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('spot_id', spotId);

    if (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }

    if (!reviews || reviews.length === 0) {
        return res.json({ success: true, data: { average: 0, count: 0 } });
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = parseFloat((sum / reviews.length).toFixed(1));

    return res.json({ success: true, data: { average, count: reviews.length } });
});

module.exports = router;
