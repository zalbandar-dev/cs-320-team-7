const jwt = require('jsonwebtoken');

async function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // 1. Standard JWT Verification (Signature & Expiry)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 2. Blacklist Check (CRITICAL)
        // You must check if the token's unique ID (jti) exists in your blacklist
        const supabase = req.app.get('supabase'); // Or however you access your client
        const { data: blacklisted } = await supabase
            .from('jwt_blacklist')
            .select('token')
            .eq('token', decoded.jti) // Your generateJWT should be adding a 'jti'
            .single();

        if (blacklisted) {
            return res.status(401).json({ error: 'Token has been revoked (logged out)' });
        }

        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = verifyToken;