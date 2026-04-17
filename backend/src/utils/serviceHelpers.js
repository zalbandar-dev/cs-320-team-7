// Aryan — functions 21-26
// validateServiceRequest, validateStatus

// Statuses that can be manually set via updateRequestStatus.
// 'pending' is excluded because it is set automatically on creation.
const VALID_TRANSITION_STATUSES = [
    'awaiting_approval',
    'approved',
    'rejected',
    'provider_assigned',
    'in_progress',
    'completed',
];

// Statuses treated as "closed" — filtered out by listRequests.
const CLOSED_STATUSES = ['completed', 'rejected'];

// validateServiceRequest(data) → { ok: bool, errors: string[] }
// Validates the payload for creating a service request.
// Required: user_id (positive integer), service_type (non-empty string).
// At least one of spot_id or booking_id must be provided.
function validateServiceRequest(data) {
    const errors = [];

    if (!data.user_id || typeof data.user_id !== 'number' || data.user_id <= 0) {
        errors.push('user_id');
    }

    if (!data.service_type || typeof data.service_type !== 'string' || data.service_type.trim() === '') {
        errors.push('serviceType');
    }

    if (!data.spot_id && !data.booking_id) {
        errors.push('spot_id or booking_id');
    }

    if (data.spot_id != null && (typeof data.spot_id !== 'number' || data.spot_id <= 0)) {
        errors.push('spot_id');
    }

    if (data.booking_id != null && (typeof data.booking_id !== 'number' || data.booking_id <= 0)) {
        errors.push('booking_id');
    }

    return { ok: errors.length === 0, errors };
}

// validateStatus(status) → boolean
// Returns true only if the status is a valid manual transition.
// 'pending' is not a valid transition — it is the auto-set initial state.
function validateStatus(status) {
    return VALID_TRANSITION_STATUSES.includes(status);
}

module.exports = { validateServiceRequest, validateStatus, CLOSED_STATUSES };
