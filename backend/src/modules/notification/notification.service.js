const supabase = require('../../config/supabaseClient');

const NOTIFICATION_COLUMNS = 'id, shop_id, customer_id, title, message, type, reference_id, is_read, created_at';

const logServiceError = (scope, error) => {
    console.error(`[NotificationService] ${scope}`, error);
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
        logServiceError('getNotifications', error);
        throw new Error('Unable to load notifications at this time');
    }
};

const createNotification = async (shopId, title, message, type, referenceId) => {
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

    if (error) {
        logServiceError('createNotification', error);
        return null; // Silent failure
    }

    return data;
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
        logServiceError('markAsRead', error);
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
        logServiceError('markAllAsRead', error);
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
        logServiceError('getUnreadCount', error);
        throw new Error('Unable to load unread notifications');
    }
};

const hasUnreadNotification = async (shopId, type, referenceId) => {
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
};

module.exports = {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    hasUnreadNotification
};
