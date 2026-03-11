const STATUS_NORMALIZATION_MAP = {
    confirmed: 'accepted',
    ready: 'ready_for_pickup',
    packing: 'preparing',
    outfordelivery: 'out_for_delivery'
};

const VALID_TRANSITIONS = {
    pending: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready_for_pickup'],
    ready_for_pickup: ['picked_up'],
    picked_up: ['out_for_delivery'],
    out_for_delivery: ['delivered']
};

const normalizeOrderStatus = (status = '') => {
    const lowered = status?.toLowerCase?.() ?? '';
    return STATUS_NORMALIZATION_MAP[lowered] || lowered;
};

/**
 * Validates if the transition from currentStatus to newStatus is allowed
 * @param {string} currentStatus - The current status of the order
 * @param {string} newStatus - The target status
 * @returns {boolean} True if valid, false otherwise
 */
const isValidTransition = (currentStatus, newStatus) => {
    const normalizedCurrent = normalizeOrderStatus(currentStatus);
    const normalizedTarget = normalizeOrderStatus(newStatus);
    const allowedNextStates = VALID_TRANSITIONS[normalizedCurrent];

    if (!allowedNextStates) {
        return false;
    }

    return allowedNextStates.includes(normalizedTarget);
};

module.exports = {
    isValidTransition,
    normalizeOrderStatus
};
