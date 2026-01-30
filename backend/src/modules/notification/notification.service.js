const supabase = require('../../config/supabaseClient');

const getNotifications = async (shopId, limit = 20) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return data || [];
};

const createNotification = async (shopId, title, message, type, referenceId, referenceType) => {
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            shop_id: shopId,
            title,
            message,
            type,
            reference_id: referenceId,
            reference_type: referenceType,
            is_read: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        return null; // Silent failure
    }

    return data;
};

const markAsRead = async (notificationId, shopId) => {
    const { data, error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;

    return data;
};

const markAllAsRead = async (shopId) => {
    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('shop_id', shopId)
        .eq('is_read', false);

    if (error) throw error;

    return { success: true };
};

const getUnreadCount = async (shopId) => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('is_read', false);

    if (error) throw error;

    return { count };
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
