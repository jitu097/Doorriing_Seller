const supabase = require('../../config/supabaseClient');
const { validatePagination, validateOrderStatus, validateUUID } = require('../../utils/validators');
const { isValidTransition, normalizeOrderStatus } = require('../../utils/orderTransitions');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const notificationService = require('../notification/notification.service');
const walletService = require('../wallet/wallet.service');

const SELLER_MUTABLE_STATUSES = ['pending', 'accepted', 'preparing'];
const SELLER_ALLOWED_TARGET_STATUSES = ['preparing'];
const DRIVER_ASSIGNABLE_STATUSES = ['accepted', 'preparing'];

const STATUS_FILTER_COMPAT_MAP = {
    accepted: ['accepted', 'confirmed'],
    preparing: ['preparing', 'packing'],
    ready_for_pickup: ['ready_for_pickup', 'ready'],
    out_for_delivery: ['out_for_delivery', 'outfordelivery']
};

const ORDER_STATUS_FLOW = [
    'pending',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'out_for_delivery',
    'delivered'
];

const STATUS_PRIORITY_MAP = ORDER_STATUS_FLOW.reduce((acc, status, index) => {
    acc[status] = index;
    return acc;
}, {});

const getStatusRank = (status) => {
    if (!status) return -1;
    const normalized = normalizeOrderStatus(status);
    return STATUS_PRIORITY_MAP[normalized] ?? -1;
};

const resolveSellerFacingStatus = (orderRecord = {}, assignment = null) => {
    let resolved = normalizeOrderStatus(orderRecord?.status) || 'pending';

    const candidateStatuses = [];

    if (assignment) {
        candidateStatuses.push(assignment.status);
        if (assignment.picked_up_at) candidateStatuses.push('picked_up');
        if (assignment.delivered_at) candidateStatuses.push('delivered');
    }

    if (orderRecord?.out_for_delivery_at) candidateStatuses.push('out_for_delivery');
    if (orderRecord?.delivered_at) candidateStatuses.push('delivered');

    candidateStatuses.forEach(candidate => {
        if (!candidate) return;
        const candidateRank = getStatusRank(candidate);
        const currentRank = getStatusRank(resolved);
        if (candidateRank > currentRank) {
            resolved = normalizeOrderStatus(candidate);
        }
    });

    return resolved;
};

const logError = (scope, error, context = {}) => {
    console.error(`[OrderService] ${scope}`, { error: error?.message, ...context });
};

const buildStatusFilterTokens = (status) => {
    const normalized = normalizeOrderStatus(status);
    if (!normalized) return [];
    return STATUS_FILTER_COMPAT_MAP[normalized] || [normalized];
};

const ensureSellerCanMutate = (status) => {
    const normalized = normalizeOrderStatus(status);
    if (!SELLER_MUTABLE_STATUSES.includes(normalized)) {
        throw new BadRequestError('Order can no longer be updated in its current status.');
    }
};

const coerceNumber = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatDriver = (driver) => {
    if (!driver) return null;
    return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type
    };
};

const fetchOrderForShop = async (orderId, shopId, select = 'id, status, order_number, total_amount, pending_until') => {
    validateUUID(orderId);
    validateUUID(shopId);
    const { data, error } = await supabase
        .from('orders')
        .select(select)
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Order not found');
    return data;
};

const getLatestAssignment = (assignments = []) => {
    if (!assignments.length) return null;
    return assignments
        .slice()
        .sort((a, b) => new Date(b?.assigned_at || 0) - new Date(a?.assigned_at || 0))[0];
};

const formatItems = (rawItems = []) => rawItems.map(item => {
    const quantity = Number(item?.quantity) || 0;
    const catalogPrice = coerceNumber(item?.items?.price);
    const unitPrice = coerceNumber(item?.unit_price ?? item?.price ?? catalogPrice);
    const totalPrice = coerceNumber(item?.total_price);
    const computedTotal = totalPrice ?? (unitPrice !== null ? unitPrice * quantity : null);

    return {
        name: item?.items?.name || 'Item',
        quantity,
        unit: item?.items?.unit || null,
        image_url: item?.items?.image_url || null,
        unit_price: unitPrice,
        total_price: computedTotal,
        catalog_price: catalogPrice
    };
});

const formatDeliveryTimeline = (assignment, orderRecord, derivedStatus) => {
    if (!assignment && !orderRecord?.out_for_delivery_at && !orderRecord?.delivered_at) {
        return null;
    }

    return {
        status: derivedStatus
            || (assignment ? (normalizeOrderStatus(assignment.status) || assignment.status) : normalizeOrderStatus(orderRecord?.status)),
        assignedAt: assignment?.assigned_at || null,
        acceptedAt: assignment?.accepted_at || orderRecord?.accepted_at || null,
        pickedUpAt: assignment?.picked_up_at || null,
        outForDeliveryAt: orderRecord?.out_for_delivery_at || null,
        deliveredAt: assignment?.delivered_at || orderRecord?.delivered_at || null
    };
};

const formatOrderRecord = (order = {}, { driverMap = new Map() } = {}) => {
    const {
        order_items: rawItems = [],
        order_delivery_assignments: assignments = [],
        ...rest
    } = order;

    const latestAssignment = getLatestAssignment(assignments);
    const driverFromAssignment = latestAssignment?.partner;
    const fallbackDriver = driverMap.get(rest.delivery_partner_id) || null;
    const derivedStatus = resolveSellerFacingStatus(rest, latestAssignment);

    return {
        ...rest,
        status: derivedStatus,
        items: formatItems(rawItems),
        customer: null,
        driver: formatDriver(driverFromAssignment || fallbackDriver),
        deliveryTimeline: formatDeliveryTimeline(latestAssignment, rest, derivedStatus)
    };
};

const baseOrderSelect = `
    id,
    shop_id,
    order_number,
    delivery_address,
    items_total,
    delivery_charge,
    total_amount,
    status,
    payment_method,
    payment_status,
    customer_notes,
    created_at,
    accepted_at,
    preparing_at,
    out_for_delivery_at,
    delivered_at,
    cancellation_reason,
    delivery_partner_id,
    order_items:order_items (
        quantity,
        unit_price,
        total_price,
        price,
        items (
            name,
            unit,
            image_url,
            price
        )
    ),
    order_delivery_assignments:order_delivery_assignments (
        id,
        delivery_partner_id,
        status,
        assigned_at,
        accepted_at,
        picked_up_at,
        delivered_at,
        partner:delivery_partners (
            id,
            name,
            phone,
            vehicle_type
        )
    )
`;

const collectDriverIds = (orders = []) => {
    const ids = new Set();
    orders.forEach(order => {
        if (order.delivery_partner_id) ids.add(order.delivery_partner_id);
        (order.order_delivery_assignments || []).forEach(assignment => {
            if (!assignment?.partner && assignment?.delivery_partner_id) {
                ids.add(assignment.delivery_partner_id);
            }
        });
    });
    return Array.from(ids);
};

const buildDriverMap = async (orders = []) => {
    const ids = collectDriverIds(orders);
    if (!ids.length) return new Map();

    const { data, error } = await supabase
        .from('delivery_partners')
        .select('id, name, phone, vehicle_type')
        .in('id', ids);

    if (error) throw error;

    return new Map((data || []).map(driver => [driver.id, driver]));
};

const getOrders = async (shopId, page = 1, limit = 20, status = null) => {
    validateUUID(shopId);
    const pagination = validatePagination(page, limit);

    let query = supabase
        .from('orders')
        .select(baseOrderSelect, { count: 'exact' })
        .eq('shop_id', shopId);

    if (status) {
        const statuses = buildStatusFilterTokens(status);
        if (statuses.length === 1) {
            query = query.eq('status', statuses[0]);
        } else if (statuses.length > 1) {
            query = query.in('status', statuses);
        }
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;

    const rawOrders = data || [];
    const driverMap = await buildDriverMap(rawOrders);
    const sanitizedOrders = rawOrders.map(order => formatOrderRecord(order, { driverMap }));
    const total = typeof count === 'number' ? count : sanitizedOrders.length;
    const totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / pagination.limit));

    return {
        orders: sanitizedOrders,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages
        }
    };
};

const getOrderDetails = async (orderId, shopId) => {
    validateUUID(orderId);
    validateUUID(shopId);
    const { data: order, error } = await supabase
        .from('orders')
        .select(baseOrderSelect)
        .eq('shop_id', shopId)
        .eq('id', orderId)
        .single();

    if (error) throw error;
    if (!order) throw new NotFoundError('Order not found');

    const driverMap = await buildDriverMap([order]);

    return formatOrderRecord(order, { driverMap });
};

const checkExpiry = async (orderId, shopId) => {
    const order = await fetchOrderForShop(orderId, shopId, 'id, status, pending_until, order_number');

    if (normalizeOrderStatus(order.status) === 'pending' && order.pending_until) {
        const now = Date.now();
        const pendingUntil = new Date(order.pending_until).getTime();
        if (!Number.isNaN(pendingUntil) && pendingUntil < now) {
            // Future enhancement: auto expire order.
        }
    }

    return order;
};

const acceptOrder = async (orderId, shopId) => {
    const order = await checkExpiry(orderId, shopId);
    const normalizedStatus = normalizeOrderStatus(order.status);

    if (normalizedStatus !== 'pending') {
        throw new BadRequestError(`Cannot accept order with status: ${order.status}`);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('orders')
        .update({
            status: 'accepted',
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
            `Order #${data.order_number} has been accepted`,
            'order_update',
            orderId,
            'order'
        );
    } catch (err) {
        logError('notification.acceptOrder', err, { orderId });
    }

    return data;
};

const rejectOrder = async (orderId, shopId) => {
    const order = await checkExpiry(orderId, shopId);
    const normalizedStatus = normalizeOrderStatus(order.status);

    if (normalizedStatus !== 'pending') {
        throw new BadRequestError(`Cannot reject order with status: ${order.status}`);
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
        logError('notification.rejectOrder', err, { orderId });
    }

    return data;
};

const updateOrderStatus = async (orderId, shopId, newStatus, actor = 'seller') => {
    validateOrderStatus(newStatus);
    const targetStatus = normalizeOrderStatus(newStatus);

    const currentOrder = await fetchOrderForShop(orderId, shopId, 'status, order_number, total_amount');

    const currentStatus = normalizeOrderStatus(currentOrder.status);

    if (actor === 'seller') {
        ensureSellerCanMutate(currentStatus);
        if (!SELLER_ALLOWED_TARGET_STATUSES.includes(targetStatus)) {
            throw new BadRequestError('Only preparing status updates are allowed from the seller dashboard.');
        }
    }

    if (!isValidTransition(currentStatus, targetStatus)) {
        throw new BadRequestError(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    }

    const updates = { status: targetStatus };
    const now = new Date().toISOString();

    if (targetStatus === 'preparing') updates.preparing_at = now;
    if (targetStatus === 'out_for_delivery') updates.out_for_delivery_at = now;
    if (targetStatus === 'delivered') updates.delivered_at = now;

    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;

    if (targetStatus === 'delivered' && data) {
        try {
            await walletService.processOrderDelivery(orderId, shopId, data.total_amount);
        } catch (err) {
            logError('wallet.delivered', err, { orderId });
        }
    }

    try {
        await notificationService.createNotification(
            shopId,
            'Order Updated',
            `Order #${data.order_number} is now ${targetStatus.replace(/_/g, ' ')}`,
            'order_update',
            orderId,
            'order'
        );
    } catch (err) {
        logError('notification.updateStatus', err, { orderId, targetStatus });
    }

    return data;
};

const getActiveDeliveryPartners = async () => {
    const { data, error } = await supabase
        .from('delivery_partners')
        .select('id, name, phone, vehicle_type')
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
};

const assignDriver = async (orderId, shopId, deliveryPartnerId) => {
    if (!deliveryPartnerId) {
        throw new BadRequestError('delivery_partner_id is required');
    }
    validateUUID(deliveryPartnerId);

    const order = await fetchOrderForShop(orderId, shopId, 'status, order_number');

    const normalizedStatus = normalizeOrderStatus(order.status);
    if (!DRIVER_ASSIGNABLE_STATUSES.includes(normalizedStatus)) {
        throw new BadRequestError('Driver can only be assigned to accepted or preparing orders');
    }

    const { data: driver, error: driverError } = await supabase
        .from('delivery_partners')
        .select('id, name, phone, vehicle_type, is_active')
        .eq('id', deliveryPartnerId)
        .eq('is_active', true)
        .single();

    if (driverError) throw driverError;
    if (!driver) throw new NotFoundError('Delivery partner not found');

    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ delivery_partner_id: deliveryPartnerId })
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (updateError) throw updateError;

    const { error: assignmentError } = await supabase
        .from('order_delivery_assignments')
        .insert({
            order_id: orderId,
            delivery_partner_id: deliveryPartnerId,
            status: 'assigned',
            assigned_at: new Date().toISOString()
        });

    if (assignmentError) throw assignmentError;

    try {
        await notificationService.createNotification(
            shopId,
            'Driver Assigned',
            `Driver ${driver.name} assigned to order #${order.order_number}`,
            'order_update',
            orderId,
            'order'
        );
    } catch (err) {
        logError('notification.assignDriver', err, { orderId, deliveryPartnerId });
    }

    return updatedOrder;
};

const markReadyForPickup = async (orderId, shopId) => {
    const order = await fetchOrderForShop(orderId, shopId, 'status, order_number');

    const normalizedStatus = normalizeOrderStatus(order.status);
    if (normalizedStatus !== 'preparing') {
        throw new BadRequestError('Only preparing orders can be marked ready for pickup');
    }

    const readyTimestamp = new Date().toISOString();
    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'ready', ready_for_pickup_at: readyTimestamp })
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (updateError) throw updateError;

    try {
        await notificationService.createNotification(
            shopId,
            'Order Ready',
            `Order #${order.order_number} is ready for pickup`,
            'order_update',
            orderId,
            'order'
        );
    } catch (err) {
        logError('notification.markReady', err, { orderId });
    }

    return updatedOrder;
};

const getOrderStats = async (shopId) => {
    const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount')
        .eq('shop_id', shopId);

    if (error) throw error;

    const stats = {
        pending: 0,
        accepted: 0,
        preparing: 0,
        readyForPickup: 0,
        enRoute: 0,
        delivered: 0,
        cancelled: 0,
        rejected: 0,
        totalRevenue: 0
    };

    (data || []).forEach(order => {
        const status = normalizeOrderStatus(order.status);
        switch (status) {
            case 'pending':
                stats.pending++;
                break;
            case 'accepted':
                stats.accepted++;
                break;
            case 'preparing':
                stats.preparing++;
                break;
            case 'ready_for_pickup':
                stats.readyForPickup++;
                break;
            case 'picked_up':
            case 'out_for_delivery':
                stats.enRoute++;
                break;
            case 'delivered':
                stats.delivered++;
                stats.totalRevenue += parseFloat(order.total_amount || 0);
                break;
            case 'cancelled':
                stats.cancelled++;
                break;
            case 'rejected':
                stats.rejected++;
                break;
            default:
                break;
        }
    });

    return stats;
};

module.exports = {
    getOrders,
    getOrderDetails,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    getActiveDeliveryPartners,
    assignDriver,
    markReadyForPickup,
    getOrderStats
};