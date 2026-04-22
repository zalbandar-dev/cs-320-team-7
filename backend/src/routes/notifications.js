const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');

// GET /api/notifications → current user's notifications, newest first
router.get('/notifications', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.user.sub)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
});

// PATCH /api/notifications/read-all → mark all as read for current user
router.patch('/notifications/read-all', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', req.user.sub)
        .eq('read', false);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true });
});

module.exports = router;
