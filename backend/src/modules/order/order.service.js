const supabase = require('../../config/supabaseClient');
const { validatePagination, validateOrderStatus } = require('../../utils/validators');
const { isValidTransition } = require('../../utils/orderTransitions');
const notificationService = require('../notification/notification.service');
const walletService = require('../wallet/wallet.service');

const getOrders = async (shopId, page = 1, limit = 20, status = null) => {
    const pagination = validatePagination(page, limit);

    let query = supabase
        .from('orders')
        .select('id,order_number,customer_name,customer_phone,delivery_address,items_total,delivery_charge,total_amount,status,payment_method,payment_status,customer_notes,created_at,confirmed_at,delivered_at,cancellation_reason', { count: 'exact' })
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
        .select(`
            *,
            items (
                unit,
                image_url
            )
        `)
        .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return {
        ...order,
        items: items || []
    };
};

const checkExpiry = async (orderId, shopId) => {
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, pending_until, order_number')
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .single();

    if (error) throw error;
    if (!order) throw new Error('Order not found');

    if (order.status === 'pending') {
        const now = new Date();
        const pendingUntil = order.pending_until ? new Date(order.pending_until) : null;

        // If pending_until exists and is in the past, expire it
        // COMMENTED OUT FOR TESTING: Allows accepting/rejecting at any time
        // if (pendingUntil && pendingUntil.getTime() < now.getTime()) {
        //     // Auto expire
        //     const { data: expiredOrder, error: updateError } = await supabase
        //         .from('orders')
        //         .update({ status: 'expired', expired_at: now.toISOString() })
        //         .eq('id', orderId)
        //         .select()
        //         .single();

        //     if (updateError) throw updateError;
        //     throw new Error('Order has expired and can no longer be processed');
        // }
    }

    return order;
};

const acceptOrder = async (orderId, shopId) => {
    const order = await checkExpiry(orderId, shopId);

    if (order.status !== 'pending') {
        throw new Error(`Cannot accept order with status: ${order.status}`);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('orders')
        .update({
            status: 'confirmed',
            accepted_at: now,
            confirmed_at: now
        })
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;

    try {
        await notificationService.createNotification(
            shopId,
            'Order Accepted',
            `Order #${data.order_number} has been accepted and confirmed`,
            'order_update',
            orderId,
            'order'
        );
    } catch (err) {
        console.error('Failed to send notification', err);
    }

    return data;
};

const rejectOrder = async (orderId, shopId) => {
    const order = await checkExpiry(orderId, shopId);

    if (order.status !== 'pending') {
        throw new Error(`Cannot reject order with status: ${order.status}`);
    }

    const { data, error } = await supabase
        .from('orders')
        .update({
            status: 'rejected',
            cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;

    try {
        await notificationService.createNotification(
            shopId,
            'Order Rejected',
            `Order #${data.order_number} has been rejected`,
            'order_update',
            orderId,
            'order'
        );
    } catch (err) {
        console.error('Failed to send notification', err);
    }

    return data;
};

const updateOrderStatus = async (orderId, shopId, newStatus, shopType) => {
    validateOrderStatus(newStatus);

    const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status, order_number')
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .single();

    if (fetchError) throw fetchError;
    if (!currentOrder) throw new Error('Order not found');

    if (!isValidTransition(currentOrder.status, newStatus, shopType)) {
        throw new Error(`Invalid status transition from ${currentOrder.status} to ${newStatus}`);
    }

    const updates = { status: newStatus };
    const now = new Date().toISOString();

    if (newStatus === 'preparing' || newStatus === 'packing') updates.preparing_at = now;
    if (newStatus === 'out_for_delivery') updates.out_for_delivery_at = now;
    if (newStatus === 'delivered') updates.delivered_at = now;

    const data = await (async () => {
        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId)
            .eq('shop_id', shopId)
            .select()
            .single();

        if (error) throw error;
        return data;
    })();

    if (newStatus === 'delivered' && data) {
        try {
            await walletService.processOrderDelivery(orderId, shopId, data.total_amount);
        } catch (err) {
            console.error('Failed to update wallet for delivered order', err);
        }
    }

    // Helper to send notification safely
    try {
        await notificationService.createNotification(
            shopId,
            'Order Updated',
            `Order #${data.order_number} is now ${newStatus}`,
            'order_update', // using 'order' type in general or specific 'order_update'
            orderId,
            'order'
        );
    } catch (err) {
        console.error('Failed to send notification', err);
    }

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
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    getOrderStats
};
