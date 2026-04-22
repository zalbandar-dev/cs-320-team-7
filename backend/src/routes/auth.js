const express = require('express');
const router = express.Router();
const {
    validateInputCredentials,
    hashPassword,
    validateLogin,
    storeUser,
    generateJWT,
    getUserInfo,
    removeJWT,
    deleteUser,
    redactSensitiveData,
    getPublicProfile,
    generateResetToken,
    hashResetToken
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

        // 2. Fetch user (This returns the userData class instance)
        const user = await getUserInfo(username);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // 3. Issue the token 
        // FIX: Pass the 'user' object instance so generateJWT can access user.id
        const token = await generateJWT(user);

        // 4. Send response
        res.status(200).json({
            message: "Login successful",
            accessToken: token, // Changed to accessToken for frontend compatibility
            user: {
                username: user.username,
                firstName: user.firstName, // Matches your userData class property
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/auth/logout
// Remove verifyToken temporarily to see if the request hits the handler
router.post('/logout', async (req, res) => {
    const authHeader = req.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) return res.status(400).json({ error: "No token provided" });

    // Pass the token to the blacklisting function
    const result = await removeJWT(token);

    if (result.success) {
        res.status(200).json({ message: "Logout successful" });
    } else {
        // Log the exact error from Supabase to your terminal
        console.error("Supabase Blacklist Error:", result.error);
        res.status(500).json({ error: "Logout failed at database level" });
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

router.delete('/user', verifyToken, async (req, res) => {
    try {
        // verifyToken attaches the decoded token to req.user
        // deleteUser expects the username to find the row
        const result = await deleteUser(req.user.username);

        if (result.flag) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(500).json({ error: result.message });
        }
    } catch (err) {
        console.error("Deactivation Error:", err);
        res.status(500).json({ error: "Internal server error during deactivation" });
    }
});

module.exports = router;