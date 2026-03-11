const { BadRequestError } = require('./errors');

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

const validateRequired = (fields, data) => {
    const missing = [];
    fields.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            missing.push(field);
        }
    });
    if (missing.length > 0) {
        throw new BadRequestError(`Missing required fields: ${missing.join(', ')}`);
    }
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new BadRequestError('Invalid email format');
    }
};

const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        throw new BadRequestError('Invalid phone number format. Must be 10 digits');
    }
};

const validateUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
        throw new BadRequestError('Invalid UUID format');
    }
};

const validatePagination = (page, limit, maxLimit = 100) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    if (pageNum < 1) {
        throw new BadRequestError('Page must be greater than 0');
    }

    if (limitNum < 1 || limitNum > maxLimit) {
        throw new BadRequestError(`Limit must be between 1 and ${maxLimit}`);
    }

    return {
        page: pageNum,
        limit: limitNum,
        offset: (pageNum - 1) * limitNum
    };
};

const validateOrderStatus = (status) => {
    const normalized = status?.toLowerCase?.();
    const validStatuses = [
        'pending', 'accepted', 'preparing', 'ready_for_pickup',
        'picked_up', 'out_for_delivery', 'delivered', 'cancelled',
        'rejected', 'expired'
    ];
    const legacyStatuses = ['confirmed', 'packing', 'ready', 'outfordelivery'];

    if (!normalized || (!validStatuses.includes(normalized) && !legacyStatuses.includes(normalized))) {
        throw new BadRequestError(`Invalid status. Must be one of: ${[...validStatuses, ...legacyStatuses].join(', ')}`);
    }
};

const validateBookingStatus = (status) => {
    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'NoShow'];
    if (!validStatuses.includes(status)) {
        throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
};

const validateDateFormat = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        throw new BadRequestError('Invalid date format. Use YYYY-MM-DD');
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new BadRequestError('Invalid date value');
    }
    return dateString;
};

const validateNumber = (value, fieldName = 'Value') => {
    const num = parseFloat(value);
    if (isNaN(num)) {
        throw new BadRequestError(`${fieldName} must be a valid number`);
    }
    return num;
};

const validatePositiveNumber = (value, fieldName = 'Value') => {
    const num = validateNumber(value, fieldName);
    if (num < 0) {
        throw new BadRequestError(`${fieldName} must be a positive number`);
    }
    return num;
};

module.exports = {
    sanitizeString,
    validateRequired,
    validateEmail,
    validatePhone,
    validateUUID,
    validatePagination,
    validateOrderStatus,
    validateBookingStatus,
    validateDateFormat,
    validateNumber,
    validatePositiveNumber
};
