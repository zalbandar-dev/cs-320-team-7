const express = require('express');
const router = express.Router();

// Search all available parking spots 
router.get('/allSpots', async (req, res) => {

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .select('');

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// Search available parking spots by zip code
router.get('/spotByZip', async (req, res) => {
    const { zip_code } = req.query;

    if (!zip_code) {
        return res.status(400).json({ success: false, error: 'zip_code is required' });
    }

    const supabase = req.app.get('supabase');

    const { data, error } = await supabase
        .from('parking_spots')
        .select('')
        .eq('zip_code', zip_code)
        .eq('available', true);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
});

// Address autocomplete via Geoapify
router.get('/autocomplete', async (req, res) => {
    const { text } = req.query;

    if (!text) {
        return res.status(400).json({ success: false, error: 'text is required' });
    }

<<<<<<< HEAD
    try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:us&format=json&apiKey=${process.env.GEOAPIFY_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('Geoapify status:', response.status, 'results:', data.results?.length ?? 0);
        res.json({ success: true, results: data.results ?? [] });
    } catch (err) {
        console.error('Autocomplete error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
=======
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:us&format=json&apiKey=${process.env.GEOAPIFY_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json({ success: true, results: data.results });
>>>>>>> 3e8e42d3c2303f94f1c8795c5e0d95e7adcf3578
});
module.exports = router;
