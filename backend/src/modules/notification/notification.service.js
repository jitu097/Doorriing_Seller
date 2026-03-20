const supabase = require('../../config/supabaseClient');
const admin = require('../../config/firebaseAdmin');
const { BadRequestError } = require('../../utils/errors');

const NOTIFICATION_COLUMNS = 'id, shop_id, customer_id, title, message, type, reference_id, is_read, created_at';
const TOKEN_COLUMNS = 'id, fcm_token, customer_id, shop_id, updated_at, created_at';

const logServiceError = (scope, error, context = {}) => {
    if (process.env.NODE_ENV === 'development' || !error?.statusCode || error?.statusCode >= 500) {
        console.error(`[NotificationService] ${scope}`, { message: error?.message, ...context });
    }
};

const logServiceInfo = (scope, payload = {}) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[NotificationService] ${scope}`, payload);
    }
};

const getShopBasePath = async (shopId) => {
    try {
        const { data, error } = await supabase
            .from('shops')
            .select('business_type')
            .eq('id', shopId)
            .maybeSingle();

        if (error) throw error;
        const businessType = String(data?.business_type || '').toLowerCase();
        return businessType === 'grocery' ? '/grocery' : '/restaurant';
    } catch (error) {
        logServiceError('getShopBasePath', error, { shopId });
        return '/restaurant'; // Safe fallback
    }
};

const resolveNotificationRoute = async (shopId, type) => {
    const basePath = await getShopBasePath(shopId);
    const normalizedType = String(type || '').toLowerCase();

    if (normalizedType.includes('booking')) return `${basePath}/bookings`;
    if (normalizedType.includes('stock') || normalizedType.includes('product') || normalizedType.includes('menu')) return `${basePath}/products`;
    if (normalizedType.includes('order')) return `${basePath}/orders`;

    return `${basePath}/dashboard`;
};

const cleanupInvalidTokens = async (tokens = []) => {
    if (!tokens.length) return;
    try {
        const { error } = await supabase
            .from('notification_tokens')
            .delete()
            .in('fcm_token', tokens);

        if (error) throw error;
    } catch (error) {
        logServiceError('cleanupInvalidTokens', error);
    }
};

const sendPushToShop = async ({ shopId, title, body, type, referenceId }) => {
    try {
        const { data: tokenRows, error } = await supabase
            .from('notification_tokens')
            .select('fcm_token')
            .eq('shop_id', shopId);

        if (error) throw error;

        const tokens = [...new Set((tokenRows || []).map(row => row.fcm_token).filter(Boolean))];
        if (!tokens.length) return { successCount: 0, failureCount: 0 };

        const route = await resolveNotificationRoute(shopId, type);

        const response = await admin.messaging().sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: {
                type: String(type || ''),
                referenceId: String(referenceId || ''),
                route,
                click_action: route,
                title: String(title || ''),
                body: String(body || ''),
            },
            webpush: {
                fcmOptions: { link: route },
                notification: {
                    icon: '/icons/icon-192.png',
                    badge: '/icons/icon-192.png',
                },
            },
        });

        const invalidTokens = [];
        response.responses.forEach((result, index) => {
            if (!result.success) {
                const code = result.error?.code || '';
                if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
                    invalidTokens.push(tokens[index]);
                }
                logServiceError('sendPushToShop.tokenFailure', result.error, { shopId, tokenSuffix: tokens[index]?.slice?.(-8) });
            }
        });

        if (invalidTokens.length > 0) {
            void cleanupInvalidTokens(invalidTokens);
        }

        return { successCount: response.successCount, failureCount: response.failureCount };
    } catch (error) {
        logServiceError('sendPushToShop', error, { shopId });
        return { successCount: 0, failureCount: 0 };
    }
};

const getNotifications = async (shopId, limit = 20) => {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(NOTIFICATION_COLUMNS)
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })
            .limit(safeLimit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        logServiceError('getNotifications', error, { shopId });
        throw new Error('Unable to load notifications at this time');
    }
};

const processingLocks = new Set();

const createNotification = async (shopId, title, message, type, referenceId) => {
    const lockKey = referenceId ? `${shopId}:${type}:${referenceId}` : null;
    
    try {
        if (lockKey) {
            if (processingLocks.has(lockKey)) {
                return null;
            }
            processingLocks.add(lockKey);
            // Safety timeout to clear lock even if process hangs
            setTimeout(() => processingLocks.delete(lockKey), 10000);

            const exists = await hasUnreadNotification(shopId, type, referenceId);
            if (exists) {
                processingLocks.delete(lockKey);
                logServiceInfo('createNotification.skipDuplicate', { shopId, type, referenceId });
                return null;
            }
        }

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                shop_id: shopId,
                title,
                message,
                type,
                reference_id: referenceId,
                is_read: false
            })
            .select()
            .single();

        if (lockKey) {
            processingLocks.delete(lockKey);
        }

        if (error) throw error;

        // Push triggered in background
        sendPushToShop({ shopId, title, body: message, type, referenceId })
            .catch(err => logServiceError('createNotification.push', err, { shopId }));

        return data;
    } catch (error) {
        if (lockKey) {
            processingLocks.delete(lockKey);
        }
        logServiceError('createNotification', error, { shopId, type });
        return null;
    }
};

const markAsRead = async (notificationId, shopId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('shop_id', shopId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logServiceError('markAsRead', error, { notificationId });
        throw new Error('Unable to mark notification as read');
    }
};

const markAllAsRead = async (shopId) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('shop_id', shopId)
            .eq('is_read', false);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        logServiceError('markAllAsRead', error, { shopId });
        throw new Error('Unable to mark notifications as read');
    }
};

const getUnreadCount = async (shopId) => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('is_read', false);

        if (error) throw error;
        return { count };
    } catch (error) {
        logServiceError('getUnreadCount', error, { shopId });
        throw new Error('Unable to load unread notifications');
    }
};

const hasUnreadNotification = async (shopId, type, referenceId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('id')
            .eq('shop_id', shopId)
            .eq('type', type)
            .eq('reference_id', referenceId)
            .eq('is_read', false)
            .limit(1);

        if (error) return false;
        return data && data.length > 0;
    } catch (ignore) {
        return false;
    }
};

const upsertNotificationToken = async ({ sellerId, shopId, token }) => {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) throw new BadRequestError('FCM token is required');

    try {
        // Cleanup old tokens for this user/shop that are NOT the current one
        await supabase
            .from('notification_tokens')
            .delete()
            .eq('customer_id', sellerId)
            .eq('shop_id', shopId)
            .neq('fcm_token', normalizedToken);

        const { data, error } = await supabase
            .from('notification_tokens')
            .upsert({
                fcm_token: normalizedToken,
                customer_id: sellerId,
                shop_id: shopId,
            }, { onConflict: 'fcm_token' })
            .select(TOKEN_COLUMNS)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logServiceError('upsertNotificationToken', error, { sellerId });
        throw new Error('Unable to save push notification token');
    }
};

const createNewOrderNotification = async (shopId, orderId, orderNumber) => {
    try {
        const alreadyExists = await hasUnreadNotification(shopId, 'new_order', orderId);
        if (alreadyExists) return null;

        return await createNotification(
            shopId,
            'New Order Received',
            `Order #${orderNumber || String(orderId).slice(0, 8).toUpperCase()} has been placed and is awaiting action`,
            'new_order',
            orderId
        );
    } catch (error) {
        logServiceError('createNewOrderNotification', error, { orderId });
        return null;
    }
};

module.exports = {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    hasUnreadNotification,
    upsertNotificationToken,
    createNewOrderNotification
};
