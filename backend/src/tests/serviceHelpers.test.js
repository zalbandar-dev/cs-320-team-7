// Pure unit tests for validateServiceRequest and validateStatus.
// No mocks needed — these are stateless validation functions.

const { validateServiceRequest, validateStatus } = require('../utils/serviceHelpers');

// ─── validateServiceRequest ───────────────────────────────────────────────────

describe('validateServiceRequest', () => {

    // ── Valid payloads ────────────────────────────────────────────────────────

    test('(A) valid payload with spot_id returns ok: true', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'battery_jump',
            spot_id: 1001,
            notes: 'dead battery',
        });
        expect(result.ok).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('(A) valid payload with booking_id only (no spot_id) returns ok: true', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            booking_id: 7,
        });
        expect(result.ok).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('(A) valid payload with both spot_id and booking_id returns ok: true', () => {
        const result = validateServiceRequest({
            user_id: 1,
            service_type: 'tire_change',
            spot_id: 5,
            booking_id: 10,
        });
        expect(result.ok).toBe(true);
    });

    test('notes is optional — omitting it still returns ok: true', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            spot_id: 1,
        });
        expect(result.ok).toBe(true);
    });

    test('null notes does not affect validity', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            spot_id: 1,
            notes: null,
        });
        expect(result.ok).toBe(true);
    });

    // ── Missing required fields ───────────────────────────────────────────────

    test('(B) missing service_type returns ok: false and errors includes "serviceType"', () => {
        const result = validateServiceRequest({
            user_id: 42,
            spot_id: 1001,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('serviceType');
    });

    test('empty string service_type returns ok: false', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: '',
            spot_id: 1,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('serviceType');
    });

    test('whitespace-only service_type returns ok: false', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: '   ',
            spot_id: 1,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('serviceType');
    });

    test('missing both spot_id and booking_id returns ok: false', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('spot_id or booking_id');
    });

    test('missing user_id returns ok: false and errors includes "user_id"', () => {
        const result = validateServiceRequest({
            service_type: 'oil_change',
            spot_id: 1,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('user_id');
    });

    // ── Invalid field types (spec test C) ────────────────────────────────────

    test('(C) string user_id returns error for user_id', () => {
        const result = validateServiceRequest({
            user_id: 'abc',
            service_type: 'oil_change',
            spot_id: 1001,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('user_id');
    });

    test('(C) negative spot_id returns error for spot_id', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            spot_id: -1,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('spot_id');
    });

    test('(C) zero spot_id is invalid', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            spot_id: 0,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('spot_id');
    });

    test('(C) negative booking_id returns error for booking_id', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            booking_id: -5,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('booking_id');
    });

    test('zero user_id is invalid', () => {
        const result = validateServiceRequest({
            user_id: 0,
            service_type: 'oil_change',
            spot_id: 1,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('user_id');
    });

    // ── Multiple errors at once ───────────────────────────────────────────────

    test('multiple invalid fields returns multiple errors', () => {
        const result = validateServiceRequest({
            user_id: 'abc',    // invalid type
            service_type: '',  // empty
            spot_id: -1,       // negative
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('user_id');
        expect(result.errors).toContain('serviceType');
        expect(result.errors).toContain('spot_id');
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    test('empty payload returns multiple errors', () => {
        const result = validateServiceRequest({});
        expect(result.ok).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    // ── Null handling ─────────────────────────────────────────────────────────

    test('null spot_id with valid booking_id is fine', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            spot_id: null,
            booking_id: 7,
        });
        expect(result.ok).toBe(true);
    });

    test('null booking_id with valid spot_id is fine', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            spot_id: 5,
            booking_id: null,
        });
        expect(result.ok).toBe(true);
    });

    test('both spot_id and booking_id null is invalid', () => {
        const result = validateServiceRequest({
            user_id: 42,
            service_type: 'oil_change',
            spot_id: null,
            booking_id: null,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toContain('spot_id or booking_id');
    });
});

// ─── validateStatus ───────────────────────────────────────────────────────────

describe('validateStatus', () => {

    // ── All six valid manual transitions ─────────────────────────────────────

    test.each([
        'awaiting_approval',
        'approved',
        'rejected',
        'provider_assigned',
        'in_progress',
        'completed',
    ])('"%s" is a valid transition status', (status) => {
        expect(validateStatus(status)).toBe(true);
    });

    // ── Invalid statuses ──────────────────────────────────────────────────────

    test('(B) "pending" returns false — it is auto-set on creation, not a manual transition', () => {
        expect(validateStatus('pending')).toBe(false);
    });

    test('empty string returns false', () => {
        expect(validateStatus('')).toBe(false);
    });

    test('null returns false', () => {
        expect(validateStatus(null)).toBe(false);
    });

    test('undefined returns false', () => {
        expect(validateStatus(undefined)).toBe(false);
    });

    test('"COMPLETED" (uppercase) returns false — check is case-sensitive', () => {
        expect(validateStatus('COMPLETED')).toBe(false);
    });

    test('"IN_PROGRESS" (uppercase) returns false', () => {
        expect(validateStatus('IN_PROGRESS')).toBe(false);
    });

    test('"open" returns false — not in the schema', () => {
        expect(validateStatus('open')).toBe(false);
    });

    test('arbitrary string returns false', () => {
        expect(validateStatus('some_random_status')).toBe(false);
    });

    test('number returns false', () => {
        expect(validateStatus(1)).toBe(false);
    });
});
