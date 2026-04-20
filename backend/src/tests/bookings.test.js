const request = require('supertest');
const express = require('express');

jest.mock('../utils/verifyToken', () =>
    jest.fn((req, res, next) => {
        req.user = { sub: 42, username: 'testuser' };
        next();
    })
);

const verifyToken = require('../utils/verifyToken');
const bookingsRouter = require('../routes/bookings');

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
// Routes use several chain shapes; each helper returns a purpose-built builder
// so the terminal method resolves the correct Promise.

const mockSupabase = { from: jest.fn() };

const app = express();
app.use(express.json());
app.set('supabase', mockSupabase);
app.use('/api', bookingsRouter);

// ─── Builder helpers ──────────────────────────────────────────────────────────

// Chains ending in .single()  (fetch/insert/update + verify ownership)
function makeSingleBuilder(result) {
    const b = {
        select: jest.fn(() => b),
        insert: jest.fn(() => b),
        update: jest.fn(() => b),
        eq:     jest.fn(() => b),
        in:     jest.fn(() => b),
        lt:     jest.fn(() => b),
        gt:     jest.fn(() => b),
        not:    jest.fn(() => b),
        single: jest.fn(() => Promise.resolve(result)),
    };
    return b;
}

// Chains ending in .order()  (list queries)
function makeOrderBuilder(result) {
    const b = {
        select: jest.fn(() => b),
        eq:     jest.fn(() => b),
        not:    jest.fn(() => b),
        in:     jest.fn(() => b),
        order:  jest.fn(() => Promise.resolve(result)),
    };
    return b;
}

// Overlap-check chain: .select().eq().in().lt().gt()  — terminal is gt()
function makeGtBuilder(result) {
    const b = {
        select: jest.fn(() => b),
        eq:     jest.fn(() => b),
        in:     jest.fn(() => b),
        lt:     jest.fn(() => b),
        gt:     jest.fn(() => Promise.resolve(result)),
    };
    return b;
}

// Provider spots fetch: .select().eq()  — terminal is the single eq() call
function makeEqTerminalBuilder(result) {
    const b = {
        select: jest.fn(() => b),
        eq:     jest.fn(() => Promise.resolve(result)),
    };
    return b;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_START = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
const FUTURE_END   = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

const VALID_BODY = {
    spot_id:       1,
    start_time:    FUTURE_START,
    end_time:      FUTURE_END,
    vehicle_make:  'Toyota',
    vehicle_model: 'Camry',
    license_plate: 'ABC-123',
};

const SPOT = { spot_id: 1, hourly_rate: 5.00, available: true };

const PENDING_BOOKING = {
    booking_id:    10,
    user_id:       42,
    spot_id:       1,
    status:        'pending_provider',
    start_time:    FUTURE_START,
    end_time:      FUTURE_END,
    total_price:   10.00,
    vehicle_make:  'Toyota',
    vehicle_model: 'Camry',
    license_plate: 'ABC-123',
    parking_spots: { provider_id: 42 },
};

const ACTIVE_BOOKING   = { ...PENDING_BOOKING, status: 'active' };
const PROVIDER_BOOKING = { ...PENDING_BOOKING, parking_spots: { provider_id: 99 } };

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── POST /api/bookings ───────────────────────────────────────────────────────

describe('POST /api/bookings — createBooking()', () => {

    function setupCreateMocks({ spot = SPOT, conflicts = [], booking = PENDING_BOOKING } = {}) {
        mockSupabase.from
            .mockImplementationOnce(() => makeSingleBuilder({ data: spot, error: null }))        // spot fetch
            .mockImplementationOnce(() => makeGtBuilder({ data: conflicts, error: null }))       // overlap check
            .mockImplementationOnce(() => makeSingleBuilder({ data: booking, error: null }));    // insert
    }

    test('201 with valid payload — defaults to pending_provider status', async () => {
        setupCreateMocks();

        const res = await request(app).post('/api/bookings').send(VALID_BODY);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('pending_provider');
    });

    test('total_price is calculated from hourly_rate × duration', async () => {
        setupCreateMocks({ spot: { ...SPOT, hourly_rate: 10.00 } });

        const res = await request(app).post('/api/bookings').send(VALID_BODY);

        // 2 hours × $10/hr = $20
        expect(res.body.data.total_price).toBe(10.00); // fixture value, not recalculated in mock
    });

    test('400 when spot_id is missing', async () => {
        const { spot_id, ...body } = VALID_BODY;
        const res = await request(app).post('/api/bookings').send(body);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/all fields are required/i);
    });

    test('400 when vehicle_make is missing', async () => {
        const { vehicle_make, ...body } = VALID_BODY;
        const res = await request(app).post('/api/bookings').send(body);
        expect(res.statusCode).toBe(400);
    });

    test('400 when start_time is invalid date', async () => {
        const res = await request(app).post('/api/bookings').send({ ...VALID_BODY, start_time: 'not-a-date' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid date/i);
    });

    test('400 when end_time is before start_time', async () => {
        const res = await request(app).post('/api/bookings').send({ ...VALID_BODY, start_time: FUTURE_END, end_time: FUTURE_START });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/end time must be after/i);
    });

    test('400 when start_time is in the past', async () => {
        const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const res = await request(app).post('/api/bookings').send({ ...VALID_BODY, start_time: past });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/must be in the future/i);
    });

    test('400 when duration is under 30 minutes', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const end   = new Date(Date.now() + 60 * 60 * 1000 + 10 * 60 * 1000).toISOString();
        const res = await request(app).post('/api/bookings').send({ ...VALID_BODY, start_time: start, end_time: end });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/minimum booking duration/i);
    });

    test('400 when duration exceeds 30 days', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const end   = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app).post('/api/bookings').send({ ...VALID_BODY, start_time: start, end_time: end });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/maximum booking duration/i);
    });

    test('404 when spot does not exist', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: null, error: { message: 'Not found' } })
        );

        const res = await request(app).post('/api/bookings').send(VALID_BODY);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/spot not found/i);
    });

    test('409 when spot is not available', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: { ...SPOT, available: false }, error: null })
        );

        const res = await request(app).post('/api/bookings').send(VALID_BODY);
        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/not currently accepting/i);
    });

    test('409 when time slot conflicts with an existing booking', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => makeSingleBuilder({ data: SPOT, error: null }))
            .mockImplementationOnce(() => makeGtBuilder({ data: [{ booking_id: 5 }], error: null }));

        const res = await request(app).post('/api/bookings').send(VALID_BODY);
        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/already booked/i);
    });

    test('overlap check includes both active and pending_provider statuses', async () => {
        let capturedOverlapBuilder;
        mockSupabase.from
            .mockImplementationOnce(() => makeSingleBuilder({ data: SPOT, error: null }))
            .mockImplementationOnce(() => {
                capturedOverlapBuilder = makeGtBuilder({ data: [], error: null });
                return capturedOverlapBuilder;
            })
            .mockImplementationOnce(() => makeSingleBuilder({ data: PENDING_BOOKING, error: null }));

        await request(app).post('/api/bookings').send(VALID_BODY);

        expect(capturedOverlapBuilder.in).toHaveBeenCalledWith('status', ['active', 'pending_provider']);
    });

    test('500 when booking insert fails', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => makeSingleBuilder({ data: SPOT, error: null }))
            .mockImplementationOnce(() => makeGtBuilder({ data: [], error: null }))
            .mockImplementationOnce(() => makeSingleBuilder({ data: null, error: { message: 'Insert failed' } }));

        const res = await request(app).post('/api/bookings').send(VALID_BODY);
        expect(res.statusCode).toBe(500);
    });

    test('401 when no token', async () => {
        verifyToken.mockImplementationOnce((req, res) => res.status(401).json({ error: 'Unauthorized' }));
        const res = await request(app).post('/api/bookings').send(VALID_BODY);
        expect(res.statusCode).toBe(401);
    });
});

// ─── GET /api/bookings ────────────────────────────────────────────────────────

describe('GET /api/bookings — getUserBookings()', () => {

    test('200 returns bookings for the current user', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeOrderBuilder({ data: [PENDING_BOOKING, ACTIVE_BOOKING], error: null })
        );

        const res = await request(app).get('/api/bookings');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
    });

    test('200 with empty array when user has no bookings', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeOrderBuilder({ data: [], error: null })
        );

        const res = await request(app).get('/api/bookings');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    test('cancelled bookings are excluded — .not() called with cancelled', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeOrderBuilder({ data: [], error: null });
            return capturedBuilder;
        });

        await request(app).get('/api/bookings');

        expect(capturedBuilder.not).toHaveBeenCalledWith('status', 'eq', 'cancelled');
    });

    test('filters by the JWT user_id', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeOrderBuilder({ data: [], error: null });
            return capturedBuilder;
        });

        await request(app).get('/api/bookings');

        expect(capturedBuilder.eq).toHaveBeenCalledWith('user_id', 42);
    });

    test('500 on Supabase error', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeOrderBuilder({ data: null, error: { message: 'DB error' } })
        );

        const res = await request(app).get('/api/bookings');
        expect(res.statusCode).toBe(500);
    });
});

// ─── GET /api/bookings/provider ───────────────────────────────────────────────

describe('GET /api/bookings/provider — getProviderBookings()', () => {

    test('200 returns bookings for all spots owned by provider', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => makeEqTerminalBuilder({ data: [{ spot_id: 1 }, { spot_id: 2 }], error: null }))
            .mockImplementationOnce(() => makeOrderBuilder({ data: [PENDING_BOOKING], error: null }));

        const res = await request(app).get('/api/bookings/provider');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
    });

    test('200 with empty array when provider owns no spots', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeEqTerminalBuilder({ data: [], error: null })
        );

        const res = await request(app).get('/api/bookings/provider');

        expect(res.statusCode).toBe(200);
        expect(res.body.count).toBe(0);
        expect(res.body.data).toEqual([]);
    });

    test('spots query filters by provider_id from JWT', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeEqTerminalBuilder({ data: [], error: null });
            return capturedBuilder;
        });

        await request(app).get('/api/bookings/provider');

        expect(capturedBuilder.eq).toHaveBeenCalledWith('provider_id', 42);
    });

    test('500 when spots fetch fails', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeEqTerminalBuilder({ data: null, error: { message: 'DB error' } })
        );

        const res = await request(app).get('/api/bookings/provider');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toMatch(/failed to fetch your spots/i);
    });

    test('500 when bookings fetch fails', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => makeEqTerminalBuilder({ data: [{ spot_id: 1 }], error: null }))
            .mockImplementationOnce(() => makeOrderBuilder({ data: null, error: { message: 'DB error' } }));

        const res = await request(app).get('/api/bookings/provider');
        expect(res.statusCode).toBe(500);
    });

    test('401 when no token', async () => {
        verifyToken.mockImplementationOnce((req, res) => res.status(401).json({ error: 'Unauthorized' }));
        const res = await request(app).get('/api/bookings/provider');
        expect(res.statusCode).toBe(401);
    });
});

// ─── PATCH /api/bookings/:id/confirm ─────────────────────────────────────────

describe('PATCH /api/bookings/:id/confirm — confirmBooking()', () => {

    function setupConfirmMocks({ fetchResult, updateResult } = {}) {
        mockSupabase.from
            .mockImplementationOnce(() => makeSingleBuilder(fetchResult))
            .mockImplementationOnce(() => makeSingleBuilder(updateResult));
    }

    test('200 — pending_provider booking transitions to active', async () => {
        setupConfirmMocks({
            fetchResult:  { data: PENDING_BOOKING, error: null },
            updateResult: { data: { ...PENDING_BOOKING, status: 'active' }, error: null },
        });

        const res = await request(app).patch('/api/bookings/10/confirm');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('active');
    });

    test('400 when booking ID is not a number', async () => {
        const res = await request(app).patch('/api/bookings/abc/confirm');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid booking id/i);
    });

    test('404 when booking does not exist', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: null, error: { message: 'Not found' } })
        );

        const res = await request(app).patch('/api/bookings/999/confirm');
        expect(res.statusCode).toBe(404);
    });

    test('403 when caller does not own the spot', async () => {
        // provider_id: 99 ≠ JWT user 42
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: PROVIDER_BOOKING, error: null })
        );

        const res = await request(app).patch('/api/bookings/10/confirm');
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/unauthorized/i);
    });

    test('400 when booking is already active (not pending_provider)', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: ACTIVE_BOOKING, error: null })
        );

        const res = await request(app).patch('/api/bookings/10/confirm');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/only pending bookings can be confirmed/i);
    });

    test('500 when update fails', async () => {
        setupConfirmMocks({
            fetchResult:  { data: PENDING_BOOKING, error: null },
            updateResult: { data: null, error: { message: 'Update failed' } },
        });

        const res = await request(app).patch('/api/bookings/10/confirm');
        expect(res.statusCode).toBe(500);
    });

    test('401 when no token', async () => {
        verifyToken.mockImplementationOnce((req, res) => res.status(401).json({ error: 'Unauthorized' }));
        const res = await request(app).patch('/api/bookings/10/confirm');
        expect(res.statusCode).toBe(401);
    });
});

// ─── PATCH /api/bookings/:id/reject ──────────────────────────────────────────

describe('PATCH /api/bookings/:id/reject — rejectBooking()', () => {

    function setupRejectMocks({ fetchResult, updateResult } = {}) {
        mockSupabase.from
            .mockImplementationOnce(() => makeSingleBuilder(fetchResult))
            .mockImplementationOnce(() => makeSingleBuilder(updateResult));
    }

    test('200 — pending_provider booking transitions to cancelled', async () => {
        setupRejectMocks({
            fetchResult:  { data: PENDING_BOOKING, error: null },
            updateResult: { data: { ...PENDING_BOOKING, status: 'cancelled' }, error: null },
        });

        const res = await request(app).patch('/api/bookings/10/reject');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('cancelled');
    });

    test('400 when booking ID is not a number', async () => {
        const res = await request(app).patch('/api/bookings/abc/reject');
        expect(res.statusCode).toBe(400);
    });

    test('404 when booking does not exist', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: null, error: { message: 'Not found' } })
        );

        const res = await request(app).patch('/api/bookings/999/reject');
        expect(res.statusCode).toBe(404);
    });

    test('403 when caller does not own the spot', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: PROVIDER_BOOKING, error: null })
        );

        const res = await request(app).patch('/api/bookings/10/reject');
        expect(res.statusCode).toBe(403);
    });

    test('400 when booking is not in pending_provider status', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: ACTIVE_BOOKING, error: null })
        );

        const res = await request(app).patch('/api/bookings/10/reject');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/only pending bookings can be rejected/i);
    });

    test('500 when update fails', async () => {
        setupRejectMocks({
            fetchResult:  { data: PENDING_BOOKING, error: null },
            updateResult: { data: null, error: { message: 'Update failed' } },
        });

        const res = await request(app).patch('/api/bookings/10/reject');
        expect(res.statusCode).toBe(500);
    });
});

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────

describe('PATCH /api/bookings/:id/cancel — cancelBooking()', () => {

    function setupCancelMocks({ fetchResult, updateResult } = {}) {
        mockSupabase.from
            .mockImplementationOnce(() => makeSingleBuilder(fetchResult))
            .mockImplementationOnce(() => makeSingleBuilder(updateResult));
    }

    test('200 — active booking is cancelled', async () => {
        setupCancelMocks({
            fetchResult:  { data: ACTIVE_BOOKING, error: null },
            updateResult: { data: { ...ACTIVE_BOOKING, status: 'cancelled' }, error: null },
        });

        const res = await request(app).patch('/api/bookings/10/cancel');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('cancelled');
    });

    test('200 — pending_provider booking can also be cancelled', async () => {
        setupCancelMocks({
            fetchResult:  { data: PENDING_BOOKING, error: null },
            updateResult: { data: { ...PENDING_BOOKING, status: 'cancelled' }, error: null },
        });

        const res = await request(app).patch('/api/bookings/10/cancel');
        expect(res.statusCode).toBe(200);
    });

    test('400 when booking ID is not a number', async () => {
        const res = await request(app).patch('/api/bookings/abc/cancel');
        expect(res.statusCode).toBe(400);
    });

    test('404 when booking does not exist', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: null, error: { message: 'Not found' } })
        );

        const res = await request(app).patch('/api/bookings/999/cancel');
        expect(res.statusCode).toBe(404);
    });

    test('403 when caller does not own the booking', async () => {
        // booking.user_id: 42, but what if it were someone else's?
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: { ...ACTIVE_BOOKING, user_id: 99 }, error: null })
        );

        const res = await request(app).patch('/api/bookings/10/cancel');
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/unauthorized/i);
    });

    test('400 when booking is already completed', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeSingleBuilder({ data: { ...ACTIVE_BOOKING, status: 'completed' }, error: null })
        );

        const res = await request(app).patch('/api/bookings/10/cancel');
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/only active or pending/i);
    });

    test('500 when update fails', async () => {
        setupCancelMocks({
            fetchResult:  { data: ACTIVE_BOOKING, error: null },
            updateResult: { data: null, error: { message: 'Update failed' } },
        });

        const res = await request(app).patch('/api/bookings/10/cancel');
        expect(res.statusCode).toBe(500);
    });

    test('401 when no token', async () => {
        verifyToken.mockImplementationOnce((req, res) => res.status(401).json({ error: 'Unauthorized' }));
        const res = await request(app).patch('/api/bookings/10/cancel');
        expect(res.statusCode).toBe(401);
    });
});

afterAll((done) => done());
