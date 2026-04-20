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
        .select('*, users!fk_request_user(first_name, last_name, username, role), parking_spots(address)')
        .not('status', 'eq', CLOSED_STATUSES[0])
        .not('status', 'eq', CLOSED_STATUSES[1])
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// POST /api/service-requests → createRequest()
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

// GET /api/service-requests/mine → requests submitted by the caller
// Must be before /:id so 'mine' is not matched as an id.
router.get('/service-requests/mine', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('service_requests')
        .select('*, users!fk_request_user(first_name, last_name, username, role), parking_spots(address)')
        .eq('user_id', req.user.sub)
        .not('status', 'eq', 'rejected')
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// GET /api/service-requests/accepted → jobs accepted by the caller to complete
// Must be before /:id so 'accepted' is not matched as an id.
router.get('/service-requests/accepted', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('service_requests')
        .select('*, users!fk_request_user(first_name, last_name, username, email, phone), parking_spots(address)')
        .eq('accepted_by_user_id', req.user.sub)
        .order('provider_assigned_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// GET /api/service-requests/:id → full details for a single request
router.get('/service-requests/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('service_requests')
        .select('*, users!fk_request_user(first_name, last_name, username, role), parking_spots(address)')
        .eq('request_id', id)
        .single();

    if (error) {
        return res.status(404).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
});

// PATCH /api/service-requests/:id/accept → worker accepts a job
// Records who accepted and their contact info; sets status to approved.
router.patch('/service-requests/:id/accept', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { provider_name, provider_contact } = req.body;
    const acceptorId = req.user.sub;

    if (!provider_name || !provider_contact) {
        return res.status(400).json({ success: false, error: 'provider_name and provider_contact are required' });
    }

    const supabase = req.app.get('supabase');

    // Verify the request exists and is still open
    const { data: existing, error: fetchError } = await supabase
        .from('service_requests')
        .select('request_id, status, user_id')
        .eq('request_id', id)
        .single();

    if (fetchError || !existing) {
        return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    if (existing.user_id === acceptorId) {
        return res.status(400).json({ success: false, error: 'You cannot accept your own service request' });
    }

    if (!['pending', 'awaiting_approval'].includes(existing.status)) {
        return res.status(400).json({ success: false, error: 'This request has already been accepted or is closed' });
    }

    const { data, error } = await supabase
        .from('service_requests')
        .update({
            status:               'approved',
            accepted_by_user_id:  acceptorId,
            provider_name:        provider_name.trim(),
            provider_contact:     provider_contact.trim(),
            provider_assigned_at: new Date().toISOString(),
            updated_at:           new Date().toISOString(),
        })
        .eq('request_id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
});

// PATCH /api/service-requests/:id/unaccept → provider cancels an accepted job
// Resets status to pending and notifies the original requester.
router.patch('/service-requests/:id/unaccept', verifyToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.sub;
    const supabase = req.app.get('supabase');

    const { data: existing, error: fetchError } = await supabase
        .from('service_requests')
        .select('request_id, status, user_id, accepted_by_user_id, service_type')
        .eq('request_id', id)
        .single();

    if (fetchError || !existing) {
        return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    if (existing.accepted_by_user_id !== userId) {
        return res.status(403).json({ success: false, error: 'You did not accept this request' });
    }

    const { data, error } = await supabase
        .from('service_requests')
        .update({
            status:               'pending',
            accepted_by_user_id:  null,
            provider_name:        null,
            provider_contact:     null,
            provider_assigned_at: null,
            updated_at:           new Date().toISOString(),
        })
        .eq('request_id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    // Notify the original requester
    await supabase.from('notifications').insert({
        user_id:    existing.user_id,
        type:       'service_unaccepted',
        message:    `Your service request for "${existing.service_type}" was cancelled by the provider and is now open again.`,
        request_id: existing.request_id,
    });

    res.json({ success: true, data });
});

// PATCH /api/service-requests/:id/status → generic status transition
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
