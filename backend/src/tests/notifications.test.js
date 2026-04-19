const request = require('supertest');
const express = require('express');

jest.mock('../utils/verifyToken', () =>
    jest.fn((req, res, next) => {
        req.user = { sub: 42, username: 'testuser' };
        next();
    })
);

const verifyToken = require('../utils/verifyToken');
const notificationsRouter = require('../routes/notifications');

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
// Notifications routes use two chain shapes:
//   GET  → .select().eq().order().limit()   terminal = limit()
//   PATCH → .update().eq().eq()             terminal = second eq()
// We create per-test builders via mockImplementationOnce so each shape resolves correctly.

const mockSupabase = { from: jest.fn() };

const app = express();
app.use(express.json());
app.set('supabase', mockSupabase);
app.use('/api', notificationsRouter);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const UNREAD = {
    notification_id: 1,
    user_id: 42,
    type: 'service_unaccepted',
    message: 'Your oil_change request was cancelled by the provider and is now open again.',
    read: false,
    request_id: 400,
    created_at: '2024-06-01T10:00:00Z',
};

const READ = { ...UNREAD, notification_id: 2, read: true, created_at: '2024-06-01T09:00:00Z' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Builder for GET /notifications: chain ends at limit()
function makeListBuilder(result) {
    const b = {
        select: jest.fn(() => b),
        eq:     jest.fn(() => b),
        order:  jest.fn(() => b),
        limit:  jest.fn(() => Promise.resolve(result)),
    };
    return b;
}

// Builder for PATCH /notifications/read-all: chain ends at the second eq()
// We count eq() calls and resolve on the second one.
function makeUpdateBuilder(result) {
    let eqCalls = 0;
    const b = {
        update: jest.fn(() => b),
        eq: jest.fn(() => {
            eqCalls += 1;
            return eqCalls >= 2 ? Promise.resolve(result) : b;
        }),
    };
    return b;
}

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockImplementation(() => makeListBuilder({ data: [], error: null }));
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {

    test('200 returns list of notifications for current user', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeListBuilder({ data: [UNREAD, READ], error: null })
        );

        const res = await request(app).get('/api/notifications');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(2);
    });

    test('200 with empty array when user has no notifications', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeListBuilder({ data: [], error: null })
        );

        const res = await request(app).get('/api/notifications');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    test('returns unread and read notifications together', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeListBuilder({ data: [UNREAD, READ], error: null })
        );

        const res = await request(app).get('/api/notifications');

        const unread = res.body.data.filter((n) => !n.read);
        const read   = res.body.data.filter((n) => n.read);
        expect(unread).toHaveLength(1);
        expect(read).toHaveLength(1);
    });

    test('queries only the current user — eq called with user_id from JWT', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeListBuilder({ data: [], error: null });
            return capturedBuilder;
        });

        await request(app).get('/api/notifications');

        expect(capturedBuilder.eq).toHaveBeenCalledWith('user_id', 42);
    });

    test('results are ordered newest first', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeListBuilder({ data: [], error: null });
            return capturedBuilder;
        });

        await request(app).get('/api/notifications');

        expect(capturedBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    test('limits to 20 results', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeListBuilder({ data: [], error: null });
            return capturedBuilder;
        });

        await request(app).get('/api/notifications');

        expect(capturedBuilder.limit).toHaveBeenCalledWith(20);
    });

    test('500 on Supabase error', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeListBuilder({ data: null, error: { message: 'DB error' } })
        );

        const res = await request(app).get('/api/notifications');

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('DB error');
    });

    test('401 when no token', async () => {
        verifyToken.mockImplementationOnce((req, res) => {
            res.status(401).json({ error: 'No token provided' });
        });

        const res = await request(app).get('/api/notifications');

        expect(res.statusCode).toBe(401);
    });
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────

describe('PATCH /api/notifications/read-all', () => {

    test('200 marks all unread notifications as read', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeUpdateBuilder({ data: null, error: null })
        );

        const res = await request(app).patch('/api/notifications/read-all');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('update payload sets read = true', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeUpdateBuilder({ data: null, error: null });
            return capturedBuilder;
        });

        await request(app).patch('/api/notifications/read-all');

        expect(capturedBuilder.update).toHaveBeenCalledWith({ read: true });
    });

    test('filters by current user — eq called with user_id from JWT', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeUpdateBuilder({ data: null, error: null });
            return capturedBuilder;
        });

        await request(app).patch('/api/notifications/read-all');

        expect(capturedBuilder.eq).toHaveBeenCalledWith('user_id', 42);
    });

    test('only marks currently unread notifications — eq called with read = false', async () => {
        let capturedBuilder;
        mockSupabase.from.mockImplementationOnce(() => {
            capturedBuilder = makeUpdateBuilder({ data: null, error: null });
            return capturedBuilder;
        });

        await request(app).patch('/api/notifications/read-all');

        expect(capturedBuilder.eq).toHaveBeenCalledWith('read', false);
    });

    test('500 on Supabase error', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            makeUpdateBuilder({ data: null, error: { message: 'Update failed' } })
        );

        const res = await request(app).patch('/api/notifications/read-all');

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
    });

    test('401 when no token', async () => {
        verifyToken.mockImplementationOnce((req, res) => {
            res.status(401).json({ error: 'No token provided' });
        });

        const res = await request(app).patch('/api/notifications/read-all');

        expect(res.statusCode).toBe(401);
    });
});

afterAll((done) => done());
