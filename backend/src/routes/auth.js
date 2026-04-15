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

        // 2. Fetch user_id (numeric PK) and display fields directly
        const supabase = req.app.get('supabase');
        const { data: userRow, error: userErr } = await supabase
            .from('users')
            .select('user_id, username, first_name, role')
            .eq('username', username)
            .single();

        if (userErr || !userRow) {
            return res.status(500).json({ error: 'Failed to retrieve user' });
        }

        // 3. Issue the token — sub is the numeric user_id
        const token = await generateJWT(userRow.user_id);

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                username: userRow.username,
                firstName: userRow.first_name,
                role: userRow.role,
                userId: userRow.user_id,
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
        const supabase = req.app.get('supabase');
        const { data: user, error } = await supabase
            .from('users')
            .select('user_id, username, first_name, last_name, email, phone, role')
            .eq('user_id', req.user.sub)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            userId: user.user_id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        });
    } catch (err) {
        console.error("Get User Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// For future releases
// POST   /api/auth/logout     → removeJWT()
// POST   /api/auth/reset-password → generateResetToken(), hashResetToken(), sendResetLink()

module.exports = router;