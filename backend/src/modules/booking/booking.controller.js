const bookingService = require('./booking.service');
const { successResponse } = require('../../utils/response');
const { validateDateFormat } = require('../../utils/validators');

const createBooking = async (req, res, next) => {
    try {
        const { shop_id, customer_name, customer_phone, number_of_guests, booking_date, booking_time } = req.body;
        
        // Validate required fields
        if (!shop_id || !customer_name || !customer_phone || !number_of_guests || !booking_date || !booking_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        validateDateFormat(booking_date);
        
        const booking = await bookingService.createBooking(shop_id, {
            customer_name,
            customer_phone,
            number_of_guests,
            booking_date,
            booking_time
        });
        
        successResponse(res, booking, 'Booking created successfully', 201);
    } catch (error) {
        next(error);
    }
};

const getBookings = async (req, res, next) => {
    try {
        const { page, limit, status, date } = req.query;
        
        console.log('🎯 Get Bookings Request - Shop:', req.shop?.name, 'ID:', req.shop?.id);
        
        if (date) {
            validateDateFormat(date);
        }
        
        const result = await bookingService.getBookings(req.shop.id, page, limit, status, date);
        successResponse(res, result);
    } catch (error) {
        console.error('❌ Error in getBookings controller:', error);
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
    createBooking,
    getBookings,
    updateStatus,
    getTodayBookings
};
