const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const { validateServiceRequest, validateStatus, CLOSED_STATUSES } = require('../utils/serviceHelpers');

// GET /api/service-requests → listRequests()
// Returns all active (non-closed) service requests, newest first.
router.get('/service-requests', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('service_requests')
        .select('*, profiles(full_name, initials, role), spots(name)')
        .not('status', 'eq', CLOSED_STATUSES[0])   // not 'completed'
        .not('status', 'eq', CLOSED_STATUSES[1])   // not 'rejected'
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// POST /api/service-requests → createRequest()
// Creates a new service request. user_id is taken from the verified JWT.
router.post('/service-requests', verifyToken, async (req, res) => {
    const user_id = req.user.sub;
    const { service_type, notes, spot_id, booking_id } = req.body;

    const validation = validateServiceRequest({
        user_id,
        service_type,
        spot_id:    spot_id    ?? null,
        booking_id: booking_id ?? null,
    });

    if (!validation.ok) {
        return res.status(400).json({ success: false, errors: validation.errors });
    }

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('service_requests')
        .insert([{
            user_id,
            service_type: service_type.trim(),
            notes:        notes ?? null,
            spot_id:      spot_id    ?? null,
            booking_id:   booking_id ?? null,
        }])
        .select()
        .single();

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, request_id: data.request_id, data });
});

// GET /api/service-requests/:id → getRequestDetails()
// Returns full details for a single service request.
router.get('/service-requests/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('service_requests')
        .select('*, profiles(full_name, initials, role), spots(name)')
        .eq('request_id', id)
        .single();

    if (error) {
        return res.status(404).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
});

// PATCH /api/service-requests/:id/status → updateRequestStatus()
// Updates the status of a service request to a valid manual transition.
router.patch('/service-requests/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!validateStatus(status)) {
        return res.status(400).json({
            success: false,
            error: `Invalid status. Must be one of: awaiting_approval, approved, rejected, provider_assigned, in_progress, completed`,
        });
    }

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('service_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('request_id', id)
        .select()
        .single();

    if (error) {
        return res.status(404).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
});

module.exports = router;
