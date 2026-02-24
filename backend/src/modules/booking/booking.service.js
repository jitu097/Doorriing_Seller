const supabase = require('../../config/supabaseClient');
const { validatePagination, validateBookingStatus } = require('../../utils/validators');
const notificationService = require('../notification/notification.service');

const getBookings = async (shopId, page = 1, limit = 20, status = null, date = null) => {
    const pagination = validatePagination(page, limit);
    
    console.log('📋 Fetching bookings for shop_id:', shopId);
    console.log('Filters:', { status, date, page, limit });
    
    let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('shop_id', shopId);
    
    if (status) {
        query = query.eq('status', status);
    }
    
    if (date) {
        query = query.eq('booking_date', date);
    }
    
    const { data, error, count } = await query
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);
    
    if (error) {
        console.error('❌ Error fetching bookings:', error);
        throw error;
    }
    
    console.log(`✅ Found ${count} bookings, returning ${data?.length || 0} for this page`);
    
    return {
        bookings: data || [],
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages: Math.ceil(count / pagination.limit)
        }
    };
};

const createBooking = async (shopId, bookingData) => {
    const { customer_name, customer_phone, number_of_guests, booking_date, booking_time } = bookingData;
    
    const { data, error } = await supabase
        .from('bookings')
        .insert({
            shop_id: shopId,
            customer_name,
            customer_phone,
            number_of_guests,
            booking_date,
            booking_time,
            status: 'Pending'
        })
        .select()
        .single();
    
    if (error) throw error;
    
    // Create notification for new booking
    await notificationService.createNotification(
        shopId,
        'New Booking Received',
        `${customer_name} booked a table for ${number_of_guests} guests on ${booking_date} at ${booking_time}`,
        'booking_new',
        data.id,
        'booking'
    );
    
    return data;
};

const updateBookingStatus = async (bookingId, shopId, newStatus) => {
    validateBookingStatus(newStatus);
    
    const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    // Create notification for status change (except for Pending which is already notified on creation)
    if (newStatus !== 'Pending') {
        const statusMessages = {
            'Confirmed': 'Booking confirmed',
            'Cancelled': 'Booking cancelled',
            'Completed': 'Booking completed'
        };
        
        await notificationService.createNotification(
            shopId,
            'Booking Status Updated',
            `Booking for ${data.customer_name} has been ${statusMessages[newStatus] || 'updated'}`,
            `booking_${newStatus.toLowerCase()}`,
            bookingId,
            'booking'
        );
    }
    
    return data;
};

const getTodayBookings = async (shopId) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('📅 Fetching today\'s bookings for shop_id:', shopId);
    console.log('Today\'s date:', today);
    
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('shop_id', shopId)
        .eq('booking_date', today)
        .in('status', ['Pending', 'Confirmed'])
        .order('booking_time', { ascending: true });
    
    if (error) {
        console.error('❌ Error fetching today\'s bookings:', error);
        throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} bookings for today`);
    
    return data || [];
};

module.exports = {
    getBookings,
    createBooking,
    updateBookingStatus,
    getTodayBookings
};
