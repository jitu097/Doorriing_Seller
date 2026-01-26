const { AppError } = require('../utils/errors');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return errorResponse(res, err.message, err.statusCode);
    }

    if (err.name === 'ValidationError') {
        return errorResponse(res, 'Validation failed', 400, err.errors);
    }

    // Development: Return actual error message
    if (process.env.NODE_ENV === 'development') {
        return errorResponse(res, err.message, 500, err);
    }

    return errorResponse(res, 'Internal server error', 500);
};

module.exports = errorHandler;
