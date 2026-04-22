const express = require('express');
const router = express.Router();
const {
    validateInputCredentials,
    hashPassword,
    validateLogin,
    storeUser,
    generateJWT,
    getUserInfo
} = require('../utils/authentication.js');
const verifyToken = require('../utils/verifyToken.js');

// POST   /api/auth/register   → validateInputCredentials(), hashPassword(), storeUser()
router.post('/register', async (req, res) => {
    try {
        const { username, pwd, email, firstName, lastName, phone, role } = req.body;

        // 1. Validate inputs (availability, email format, password strength)
        const validation = await validateInputCredentials({ username, pwd, email, phone });
        if (!validation.flag) {
            return res.status(400).json({ error: validation.message });
        }

        // 2. Store user (Logic assumes storeUser calls hashPassword internally)
        const storage = await storeUser({
            username,
            pwd, // Pass plain text here; storeUser will hash it before DB entry
            email,
            firstName,
            lastName,
            phone,
            role: role || 'customer'
        });

        if (!storage.flag) {
            return res.status(500).json({ error: storage.message || "Failed to create user account" });
        }

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
    
// POST   /api/auth/login      → validateLogin(), generateJWT()
router.post('/login', async (req, res) => {
    try {
        const { username, pwd } = req.body;

        if (!username || !pwd) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // 1. Verify credentials
        const loginStatus = await validateLogin(username, pwd);
        if (!loginStatus.flag) {
            return res.status(401).json({ error: loginStatus.message });
        }

        // 2. Fetch user details for the payload
        const user = await getUserInfo(username);
        
        // 3. Issue the token
        const token = await generateJWT(user.username, user.id);

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                username: user.username,
                firstName: user.firstName,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/user → returns the logged-in user's info (requires valid JWT)
router.get('/user', verifyToken, async (req, res) => {
    try {
        const user = await getUserInfo(req.user.username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const safe = user.redactSensitiveData();
        res.status(200).json({
            username: safe.username,
            firstName: safe.firstName,
            lastName: safe.lastName,
            email: safe.email,
            phone: safe.phone,
            role: safe.role
        });
    } catch (err) {
        console.error("Get User Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PATCH /api/user → update the logged-in user's editable profile fields
router.patch('/user', verifyToken, async (req, res) => {
    const supabase = req.app.get('supabase');
    const userId = req.user.sub;

    const { first_name, last_name, email, phone } = req.body;

    if (!first_name && !last_name && !email && !phone) {
        return res.status(400).json({ error: 'No fields provided to update' });
    }

    const updates = {};
    if (first_name) updates.first_name = first_name.trim();
    if (last_name)  updates.last_name  = last_name.trim();
    if (email)      updates.email      = email.trim();
    if (phone)      updates.phone      = phone.trim();

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId)
        .select('username, first_name, last_name, email, phone, role')
        .single();

    if (error) {
        return res.status(500).json({ error: 'Failed to update profile: ' + error.message });
    }

    res.json({ success: true, data });
});

// For future releases
// POST   /api/auth/logout     → removeJWT()
// POST   /api/auth/reset-password → generateResetToken(), hashResetToken(), sendResetLink()

module.exports = router;