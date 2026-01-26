const supabase = require('../../config/supabaseClient');
const { validatePagination, validateBookingStatus } = require('../../utils/validators');

const getBookings = async (shopId, page = 1, limit = 20, status = null, date = null) => {
    const pagination = validatePagination(page, limit);
    
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
    
    if (error) throw error;
    
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
    
    return data;
};

const getTodayBookings = async (shopId) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('shop_id', shopId)
        .eq('booking_date', today)
        .in('status', ['Pending', 'Confirmed'])
        .order('booking_time', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
};

module.exports = {
    getBookings,
    updateBookingStatus,
    getTodayBookings
};
