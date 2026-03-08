const VALID_TRANSITIONS = {
    restaurant: {
        confirmed: ['preparing'],
        preparing: ['ready'],
        ready: ['out_for_delivery'],
        out_for_delivery: ['delivered']
    },
    grocery: {
        confirmed: ['packing'],
        packing: ['ready'],
        ready: ['out_for_delivery'],
        out_for_delivery: ['delivered']
    }
};

/**
 * Validates if the transition from currentStatus to newStatus is allowed
 * @param {string} currentStatus - The current status of the order
 * @param {string} newStatus - The target status
 * @param {string} shopType - 'restaurant' or 'grocery'
 * @returns {boolean} True if valid, false otherwise
 */
const isValidTransition = (currentStatus, newStatus, shopType) => {
    const restaurantTypes = ['restaurant', 'cloud kitchen', 'hotel'];
    const type = restaurantTypes.includes(shopType?.toLowerCase()) ? 'restaurant' : 'grocery';
    const allowedNextStates = VALID_TRANSITIONS[type][currentStatus?.toLowerCase()];

    if (!allowedNextStates) {
        return false;
    }

    return allowedNextStates.includes(newStatus?.toLowerCase());
};

module.exports = {
    isValidTransition
};
