const request = require('supertest');
const express = require('express');

// Mock verifyToken before the router is loaded.
// Default behaviour: inject a valid user and call next().
// Individual tests can override with mockImplementationOnce to test 401s.
jest.mock('../utils/verifyToken', () =>
    jest.fn((req, res, next) => {
        req.user = { sub: 42, username: 'testuser' };
        next();
    })
);

const verifyToken = require('../utils/verifyToken');
const serviceRequestsRouter = require('../routes/serviceRequests');

// ─── Mock Supabase client ─────────────────────────────────────────────────────
// Each `from()` call returns a fresh chainable builder.
// `mockDB.result` controls what the terminal methods (single/order) resolve with.
// `mockDB.lastBuilder` exposes the most recent builder so tests can inspect
// what was passed to insert/update.

const mockDB = {
    result: { data: null, error: null },
    lastBuilder: null,
    make() {
        const builder = {
            select: jest.fn(() => builder),
            insert: jest.fn(() => builder),
            update: jest.fn(() => builder),
            not:    jest.fn(() => builder),
            eq:     jest.fn(() => builder),
            order:  jest.fn(() => Promise.resolve(mockDB.result)),
            single: jest.fn(() => Promise.resolve(mockDB.result)),
        };
        mockDB.lastBuilder = builder;
        return builder;
    },
};

const mockSupabase = {
    from: jest.fn(() => mockDB.make()),
};

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.set('supabase', mockSupabase);
app.use('/api', serviceRequestsRouter);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACTIVE_REQUEST = {
    request_id: 200,
    user_id: 42,
    spot_id: 1001,
    booking_id: null,
    service_type: 'battery_jump',
    notes: 'dead battery',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

const IN_PROGRESS_REQUEST = { ...ACTIVE_REQUEST, request_id: 202, status: 'in_progress' };

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    mockDB.result = { data: null, error: null };
    // Re-attach from() implementation (clearAllMocks wipes call counts but not implementations;
    // re-assigning just to be safe and explicit for readers)
    mockSupabase.from.mockImplementation(() => mockDB.make());
});

// ─── GET /api/service-requests ────────────────────────────────────────────────

describe('GET /api/service-requests — listRequests()', () => {

    test('200 with list of active requests', async () => {
        mockDB.result = { data: [ACTIVE_REQUEST, IN_PROGRESS_REQUEST], error: null };

        const res = await request(app).get('/api/service-requests');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.data).toHaveLength(2);
    });

    test('200 with empty array when no active requests exist', async () => {
        mockDB.result = { data: [], error: null };

        const res = await request(app).get('/api/service-requests');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(0);
        expect(res.body.data).toEqual([]);
    });

    test('filters are applied — .not() is called twice to exclude completed and rejected', async () => {
        mockDB.result = { data: [], error: null };

        await request(app).get('/api/service-requests');

        const builder = mockDB.lastBuilder;
        expect(builder.not).toHaveBeenCalledTimes(2);
        expect(builder.not).toHaveBeenCalledWith('status', 'eq', 'completed');
        expect(builder.not).toHaveBeenCalledWith('status', 'eq', 'rejected');
    });

    test('results are ordered newest first', async () => {
        mockDB.result = { data: [], error: null };

        await request(app).get('/api/service-requests');

        expect(mockDB.lastBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    test('401 when no token is provided', async () => {
        verifyToken.mockImplementationOnce((req, res) => {
            res.status(401).json({ error: 'No token provided' });
        });

        const res = await request(app).get('/api/service-requests');

        expect(res.statusCode).toBe(401);
    });

    test('500 on Supabase error', async () => {
        mockDB.result = { data: null, error: { message: 'DB connection failed' } };

        const res = await request(app).get('/api/service-requests');

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('DB connection failed');
    });
});

// ─── POST /api/service-requests ───────────────────────────────────────────────

describe('POST /api/service-requests — createRequest()', () => {

    test('(A) 201 with valid payload (spot_id)', async () => {
        mockDB.result = { data: { ...ACTIVE_REQUEST, request_id: 203 }, error: null };

        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'oil_change', spot_id: 1001, notes: 'please check tires' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.request_id).toBe(203);
        expect(res.body.data).toBeDefined();
    });

    test('(A) 201 with valid payload (booking_id only, no spot_id)', async () => {
        mockDB.result = {
            data: { ...ACTIVE_REQUEST, request_id: 204, spot_id: null, booking_id: 7 },
            error: null,
        };

        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'battery_jump', booking_id: 7 });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    test('(B) 400 when service_type is missing', async () => {
        const res = await request(app)
            .post('/api/service-requests')
            .send({ spot_id: 1001 });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toContain('serviceType');
    });

    test('(B) 400 when both spot_id and booking_id are missing', async () => {
        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'oil_change' });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('spot_id or booking_id');
    });

    test('(C) 400 when spot_id is a negative number', async () => {
        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'oil_change', spot_id: -1 });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('spot_id');
    });

    test('(C) 400 when booking_id is a negative number', async () => {
        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'oil_change', booking_id: -5 });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('booking_id');
    });

    test('(C) 400 when service_type is an empty string', async () => {
        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: '', spot_id: 1 });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('serviceType');
    });

    test('security: user_id is taken from the JWT, not the request body', async () => {
        mockDB.result = { data: { ...ACTIVE_REQUEST, request_id: 205 }, error: null };

        // Send user_id: 999 in the body — the route must ignore it and use 42 (from JWT)
        await request(app)
            .post('/api/service-requests')
            .send({ user_id: 999, service_type: 'oil_change', spot_id: 1001 });

        const insertedRows = mockDB.lastBuilder.insert.mock.calls[0][0];
        expect(insertedRows[0].user_id).toBe(42);   // from JWT
        expect(insertedRows[0].user_id).not.toBe(999); // not from body
    });

    test('notes defaults to null when not provided', async () => {
        mockDB.result = { data: { ...ACTIVE_REQUEST, notes: null }, error: null };

        await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'oil_change', spot_id: 1 });

        const insertedRows = mockDB.lastBuilder.insert.mock.calls[0][0];
        expect(insertedRows[0].notes).toBeNull();
    });

    test('service_type is trimmed before insert', async () => {
        mockDB.result = { data: ACTIVE_REQUEST, error: null };

        await request(app)
            .post('/api/service-requests')
            .send({ service_type: '  oil_change  ', spot_id: 1 });

        const insertedRows = mockDB.lastBuilder.insert.mock.calls[0][0];
        expect(insertedRows[0].service_type).toBe('oil_change');
    });

    test('401 when no token is provided', async () => {
        verifyToken.mockImplementationOnce((req, res) => {
            res.status(401).json({ error: 'No token provided' });
        });

        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'oil_change', spot_id: 1 });

        expect(res.statusCode).toBe(401);
    });

    test('500 on Supabase error', async () => {
        mockDB.result = { data: null, error: { message: 'Insert failed' } };

        const res = await request(app)
            .post('/api/service-requests')
            .send({ service_type: 'oil_change', spot_id: 1 });

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
    });
});

// ─── GET /api/service-requests/:id ───────────────────────────────────────────

describe('GET /api/service-requests/:id — getRequestDetails()', () => {

    test('(A) 200 with full details for a known request ID', async () => {
        mockDB.result = { data: ACTIVE_REQUEST, error: null };

        const res = await request(app).get('/api/service-requests/200');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.request_id).toBe(200);
        expect(res.body.data.service_type).toBe('battery_jump');
        expect(res.body.data.status).toBe('pending');
    });

    test('(B) 404 for an ID that does not exist', async () => {
        mockDB.result = { data: null, error: { message: 'Row not found' } };

        const res = await request(app).get('/api/service-requests/999');

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test('queries by the correct request_id', async () => {
        mockDB.result = { data: ACTIVE_REQUEST, error: null };

        await request(app).get('/api/service-requests/200');

        expect(mockDB.lastBuilder.eq).toHaveBeenCalledWith('request_id', '200');
    });

    test('401 when no token is provided', async () => {
        verifyToken.mockImplementationOnce((req, res) => {
            res.status(401).json({ error: 'No token provided' });
        });

        const res = await request(app).get('/api/service-requests/200');

        expect(res.statusCode).toBe(401);
    });
});

// ─── PATCH /api/service-requests/:id/status ──────────────────────────────────

describe('PATCH /api/service-requests/:id/status — updateRequestStatus()', () => {

    test('(A) 200 when updating to "in_progress"', async () => {
        mockDB.result = { data: { ...ACTIVE_REQUEST, status: 'in_progress' }, error: null };

        const res = await request(app)
            .patch('/api/service-requests/200/status')
            .send({ status: 'in_progress' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('in_progress');
    });

    test('(A) 200 when updating to "completed"', async () => {
        mockDB.result = { data: { ...ACTIVE_REQUEST, status: 'completed' }, error: null };

        const res = await request(app)
            .patch('/api/service-requests/200/status')
            .send({ status: 'completed' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('completed');
    });

    test.each(['awaiting_approval', 'approved', 'rejected', 'provider_assigned'])(
        '200 when updating to "%s"',
        async (status) => {
            mockDB.result = { data: { ...ACTIVE_REQUEST, status }, error: null };

            const res = await request(app)
                .patch('/api/service-requests/200/status')
                .send({ status });

            expect(res.statusCode).toBe(200);
        }
    );

    test('(B) 400 when status is "pending" — not a valid manual transition', async () => {
        const res = await request(app)
            .patch('/api/service-requests/200/status')
            .send({ status: 'pending' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/invalid status/i);
    });

    test('400 when status is an empty string', async () => {
        const res = await request(app)
            .patch('/api/service-requests/200/status')
            .send({ status: '' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('400 when status is an unrecognised value', async () => {
        const res = await request(app)
            .patch('/api/service-requests/200/status')
            .send({ status: 'open' });

        expect(res.statusCode).toBe(400);
    });

    test('400 when status field is missing from body', async () => {
        const res = await request(app)
            .patch('/api/service-requests/200/status')
            .send({});

        expect(res.statusCode).toBe(400);
    });

    test('(C) 404 when the request ID does not exist', async () => {
        mockDB.result = { data: null, error: { message: 'Row not found' } };

        const res = await request(app)
            .patch('/api/service-requests/999/status')
            .send({ status: 'in_progress' });

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test('Supabase is not called when status is invalid', async () => {
        await request(app)
            .patch('/api/service-requests/200/status')
            .send({ status: 'pending' });

        // from() should never be called — validation rejects before hitting the DB
        expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    test('401 when no token is provided', async () => {
        verifyToken.mockImplementationOnce((req, res) => {
            res.status(401).json({ error: 'No token provided' });
        });

        const res = await request(app)
            .patch('/api/service-requests/200/status')
            .send({ status: 'in_progress' });

        expect(res.statusCode).toBe(401);
    });
});

// ─── PATCH /api/service-requests/:id/accept ──────────────────────────────────

describe('PATCH /api/service-requests/:id/accept — acceptRequest()', () => {

    const OPEN_REQUEST = { request_id: 300, status: 'pending', user_id: 99 };
    const ACCEPTED_REQUEST = { ...OPEN_REQUEST, status: 'approved', accepted_by_user_id: 42 };

    function setupAcceptMocks({ fetchResult, updateResult } = {}) {
        mockSupabase.from
            .mockImplementationOnce(() => {
                const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve(fetchResult)) };
                return b;
            })
            .mockImplementationOnce(() => {
                const b = { update: jest.fn(() => b), eq: jest.fn(() => b), select: jest.fn(() => b), single: jest.fn(() => Promise.resolve(updateResult)) };
                return b;
            });
    }

    test('200 with provider info sets status to approved', async () => {
        setupAcceptMocks({
            fetchResult:  { data: OPEN_REQUEST, error: null },
            updateResult: { data: ACCEPTED_REQUEST, error: null },
        });

        const res = await request(app)
            .patch('/api/service-requests/300/accept')
            .send({ provider_name: 'Jane Wrench', provider_contact: '617-555-0001' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('approved');
    });

    test('400 when provider_name is missing', async () => {
        const res = await request(app)
            .patch('/api/service-requests/300/accept')
            .send({ provider_contact: '617-555-0001' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/provider_name/i);
    });

    test('400 when provider_contact is missing', async () => {
        const res = await request(app)
            .patch('/api/service-requests/300/accept')
            .send({ provider_name: 'Jane Wrench' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/provider_contact/i);
    });

    test('400 when user tries to accept their own request', async () => {
        // user_id === acceptorId (both 42 from JWT mock)
        mockSupabase.from.mockImplementationOnce(() => {
            const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: { request_id: 300, status: 'pending', user_id: 42 }, error: null })) };
            return b;
        });

        const res = await request(app)
            .patch('/api/service-requests/300/accept')
            .send({ provider_name: 'Self', provider_contact: 'self@example.com' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/cannot accept your own/i);
    });

    test('400 when request is already accepted', async () => {
        mockSupabase.from.mockImplementationOnce(() => {
            const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: { request_id: 300, status: 'approved', user_id: 99 }, error: null })) };
            return b;
        });

        const res = await request(app)
            .patch('/api/service-requests/300/accept')
            .send({ provider_name: 'Jane Wrench', provider_contact: '617-555-0001' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already been accepted/i);
    });

    test('404 when request does not exist', async () => {
        mockSupabase.from.mockImplementationOnce(() => {
            const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })) };
            return b;
        });

        const res = await request(app)
            .patch('/api/service-requests/999/accept')
            .send({ provider_name: 'Jane Wrench', provider_contact: '617-555-0001' });

        expect(res.statusCode).toBe(404);
    });
});

// ─── PATCH /api/service-requests/:id/unaccept ────────────────────────────────

describe('PATCH /api/service-requests/:id/unaccept — unacceptRequest()', () => {

    const ACCEPTED = {
        request_id: 400,
        status: 'approved',
        user_id: 99,           // original requester
        accepted_by_user_id: 42, // current JWT user
        service_type: 'oil_change',
    };
    const RESET = { ...ACCEPTED, status: 'pending', accepted_by_user_id: null, provider_name: null, provider_contact: null };

    function setupUnacceptMocks({ fetchResult, updateResult, notifyResult = { data: null, error: null } } = {}) {
        mockSupabase.from
            .mockImplementationOnce(() => {
                const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve(fetchResult)) };
                return b;
            })
            .mockImplementationOnce(() => {
                const b = { update: jest.fn(() => b), eq: jest.fn(() => b), select: jest.fn(() => b), single: jest.fn(() => Promise.resolve(updateResult)) };
                return b;
            })
            .mockImplementationOnce(() => {
                const b = { insert: jest.fn(() => Promise.resolve(notifyResult)) };
                return b;
            });
    }

    test('200 — accepted job is reset to pending and requester is notified', async () => {
        setupUnacceptMocks({
            fetchResult:  { data: ACCEPTED, error: null },
            updateResult: { data: RESET, error: null },
        });

        const res = await request(app).patch('/api/service-requests/400/unaccept');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('pending');
    });

    test('notification insert is called for the original requester', async () => {
        let capturedInsert = null;

        mockSupabase.from
            .mockImplementationOnce(() => {
                const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: ACCEPTED, error: null })) };
                return b;
            })
            .mockImplementationOnce(() => {
                const b = { update: jest.fn(() => b), eq: jest.fn(() => b), select: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: RESET, error: null })) };
                return b;
            })
            .mockImplementationOnce(() => {
                capturedInsert = jest.fn(() => Promise.resolve({ data: null, error: null }));
                return { insert: capturedInsert };
            });

        await request(app).patch('/api/service-requests/400/unaccept');

        expect(capturedInsert).toHaveBeenCalledTimes(1);
        const payload = capturedInsert.mock.calls[0][0];
        expect(payload.user_id).toBe(99); // original requester, not the acceptor
        expect(payload.type).toBe('service_unaccepted');
        expect(payload.request_id).toBe(400);
    });

    test('403 when caller is not the one who accepted the job', async () => {
        mockSupabase.from.mockImplementationOnce(() => {
            const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: { ...ACCEPTED, accepted_by_user_id: 77 }, error: null })) };
            return b;
        });

        const res = await request(app).patch('/api/service-requests/400/unaccept');

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/did not accept/i);
    });

    test('404 when request does not exist', async () => {
        mockSupabase.from.mockImplementationOnce(() => {
            const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })) };
            return b;
        });

        const res = await request(app).patch('/api/service-requests/999/unaccept');

        expect(res.statusCode).toBe(404);
    });

    test('500 when Supabase update fails', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => {
                const b = { select: jest.fn(() => b), eq: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: ACCEPTED, error: null })) };
                return b;
            })
            .mockImplementationOnce(() => {
                const b = { update: jest.fn(() => b), eq: jest.fn(() => b), select: jest.fn(() => b), single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Update failed' } })) };
                return b;
            });

        const res = await request(app).patch('/api/service-requests/400/unaccept');

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
    });

    test('401 when no token is provided', async () => {
        verifyToken.mockImplementationOnce((req, res) => {
            res.status(401).json({ error: 'No token provided' });
        });

        const res = await request(app).patch('/api/service-requests/400/unaccept');

        expect(res.statusCode).toBe(401);
    });
});

afterAll((done) => done());
