const bookingService = require('./booking.service');
const { successResponse } = require('../../utils/response');
const { validateDateFormat } = require('../../utils/validators');

const getBookings = async (req, res, next) => {
    try {
        const { page, limit, status, date } = req.query;
        
        if (date) {
            validateDateFormat(date);
        }
        
        const result = await bookingService.getBookings(req.shop.id, page, limit, status, date);
        successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const booking = await bookingService.updateBookingStatus(id, req.shop.id, status);
        successResponse(res, booking, 'Booking status updated');
    } catch (error) {
        next(error);
    }
};

const getTodayBookings = async (req, res, next) => {
    try {
        const bookings = await bookingService.getTodayBookings(req.shop.id);
        successResponse(res, bookings);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBookings,
    updateStatus,
    getTodayBookings
};
