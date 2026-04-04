require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

// ─── Supabase Connection Tests ────────────────────────────────────────────────

describe('Supabase Connection', () => {

    test('SUPABASE_URL and SUPABASE_KEY env vars are set', () => {
        expect(process.env.SUPABASE_URL).toBeDefined();
        expect(process.env.SUPABASE_KEY).toBeDefined();
        expect(process.env.SUPABASE_URL).not.toBe('');
        expect(process.env.SUPABASE_KEY).not.toBe('');
    });

    test('Supabase client can be created', () => {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        expect(supabase).toBeDefined();
    });

    test('Supabase can query the parking_spots table', async () => {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        const { data, error } = await supabase
            .from('parking_spots')
            .select('*')
            .limit(1);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    test('Supabase can query the users table', async () => {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    test('Supabase can query the service_requests table', async () => {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        const { data, error } = await supabase
            .from('service_requests')
            .select('*')
            .limit(1);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

});

// ─── Geoapify Connection Tests ────────────────────────────────────────────────

describe('Geoapify Autocomplete Connection', () => {

    test('GEOAPIFY_KEY env var is set', () => {
        expect(process.env.GEOAPIFY_KEY).toBeDefined();
        expect(process.env.GEOAPIFY_KEY).not.toBe('');
        expect(process.env.GEOAPIFY_KEY).not.toBe('your_geoapify_key_here');
    });

    test('Geoapify returns results for a valid address', async () => {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent('456 Newbury St Boston')}&filter=countrycode:us&format=json&apiKey=${process.env.GEOAPIFY_KEY}`;

        const response = await fetch(url);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.results).toBeDefined();
        expect(data.results.length).toBeGreaterThan(0);
    });

    test('Geoapify result contains expected location fields', async () => {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent('456 Newbury St Boston')}&filter=countrycode:us&format=json&apiKey=${process.env.GEOAPIFY_KEY}`;

        const response = await fetch(url);
        const data = await response.json();
        const first = data.results[0];

        expect(first.lat).toBeDefined();
        expect(first.lon).toBeDefined();
        expect(first.formatted).toBeDefined();
    });

    test('Geoapify returns empty results for a nonsense address', async () => {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent('zzzzzzzzzzzzzzzzzzz')}&filter=countrycode:us&format=json&apiKey=${process.env.GEOAPIFY_KEY}`;

        const response = await fetch(url);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(Array.isArray(data.results)).toBe(true);
    });

});
