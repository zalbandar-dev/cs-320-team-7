require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Supabase client — shared across all routes via app.get('supabase')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
app.set('supabase', supabase);

// Routes
app.use('/api', require('./routes/spots'));
app.use('/api', require('./routes/serviceRequests'));
app.use('/api', require('./routes/providers'));
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/payments'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});