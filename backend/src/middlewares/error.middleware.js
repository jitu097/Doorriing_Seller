const { AppError } = require('../utils/errors');
const { errorResponse } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // Handle Supabase/Database errors (optional refinement)
    if (err.code && err.details) {
        return errorResponse(res, 'Database Error', 500);
    }

    return errorResponse(res, 'Something went wrong', 500);
};

module.exports = errorHandler;
