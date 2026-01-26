const supabase = require('../../config/supabaseClient');

const getNotifications = async (shopId, limit = 20) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) throw error;
    
    return data || [];
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

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
