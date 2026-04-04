const express = require('express');
const router = express.Router();

// Ishan — functions 1-11
// POST   /api/auth/register   → validateInputCredentials(), hashPassword(), storeUser()
// POST   /api/auth/login      → validateLogin(), generateJWT()
// POST   /api/auth/logout     → removeJWT()
// GET    /api/auth/user/:username → getUserInfo()
// POST   /api/auth/reset-password → generateResetToken(), hashResetToken(), sendResetLink()

module.exports = router;