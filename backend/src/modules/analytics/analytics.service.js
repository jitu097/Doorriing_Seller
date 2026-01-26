const supabase = require('../../config/supabaseClient');

const getDailyAnalytics = async (shopId, startDate, endDate) => {
    let query = supabase
        .from('analytics_daily')
        .select('*')
        .eq('shop_id', shopId)
        .order('date', { ascending: false });
    
    if (startDate) {
        query = query.gte('date', startDate);
    }
    
    if (endDate) {
        query = query.lte('date', endDate);
    }
    
    const { data, error } = await query.limit(30);
    
    if (error) throw error;
    
    return data || [];
};

const getSummary = async (shopId, days = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateStr = startDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
        .from('analytics_daily')
        .select('total_orders, total_revenue, completed_orders')
        .eq('shop_id', shopId)
        .gte('date', dateStr);
    
    if (error) throw error;
    
    const summary = {
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
        averageOrderValue: 0
    };
    
    if (data && data.length > 0) {
        data.forEach(day => {
            summary.totalOrders += day.total_orders || 0;
            summary.totalRevenue += parseFloat(day.total_revenue || 0);
            summary.completedOrders += day.completed_orders || 0;
        });
        
        if (summary.totalRevenue > 0 && summary.completedOrders > 0) {
            summary.averageOrderValue = parseFloat((summary.totalRevenue / summary.completedOrders).toFixed(2));
        }
    }
    
    return summary;
};

module.exports = {
    getDailyAnalytics,
    getSummary
};
