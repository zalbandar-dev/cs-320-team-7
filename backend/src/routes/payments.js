const express = require('express');
const router = express.Router();

// Nishant — functions 27-30
// GET    /api/payments/total          → calculateTotal()
// POST   /api/payments/transaction    → processTransaction()
// (verifyAuth and verifyJWT are middleware, not routes — they will live in src/middleware/auth.js)

module.exports = router;