const supabase = require('../../config/supabaseClient');
const { validatePagination, validateOrderStatus } = require('../../utils/validators');

const getOrders = async (shopId, page = 1, limit = 20, status = null) => {
    const pagination = validatePagination(page, limit);
    
    let query = supabase
        .from('orders')
        .select('id,order_number,customer_name,customer_phone,delivery_address,items_total,delivery_charge,total_amount,status,payment_method,payment_status,customer_notes,created_at,confirmed_at,delivered_at', { count: 'exact' })
        .eq('shop_id', shopId);
    
    if (status) {
        query = query.eq('status', status);
    }
    
    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);
    
    if (error) throw error;
    
    return {
        orders: data || [],
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages: Math.ceil(count / pagination.limit)
        }
    };
};

const getOrderDetails = async (orderId, shopId) => {
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .single();
    
    if (orderError) throw orderError;
    
    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
    
    if (itemsError) throw itemsError;
    
    return {
        ...order,
        items: items || []
    };
};

const updateOrderStatus = async (orderId, shopId, newStatus, cancellationReason = null) => {
    validateOrderStatus(newStatus);
    
    const updates = { status: newStatus };
    
    if (newStatus === 'Confirmed') {
        updates.confirmed_at = new Date().toISOString();
    } else if (newStatus === 'Delivered') {
        updates.delivered_at = new Date().toISOString();
    } else if (newStatus === 'Cancelled') {
        updates.cancelled_at = new Date().toISOString();
        if (cancellationReason) {
            updates.cancellation_reason = cancellationReason;
        }
    }
    
    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

const getOrderStats = async (shopId) => {
    const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount')
        .eq('shop_id', shopId);
    
    if (error) throw error;
    
    const stats = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0
    };
    
    data.forEach(order => {
        if (order.status === 'Pending') stats.pending++;
        else if (order.status === 'Confirmed') stats.confirmed++;
        else if (order.status === 'Preparing') stats.preparing++;
        else if (order.status === 'OutForDelivery') stats.outForDelivery++;
        else if (order.status === 'Delivered') {
            stats.delivered++;
            stats.totalRevenue += parseFloat(order.total_amount || 0);
        }
        else if (order.status === 'Cancelled') stats.cancelled++;
    });
    
    return stats;
};

module.exports = {
    getOrders,
    getOrderDetails,
    updateOrderStatus,
    getOrderStats
};
