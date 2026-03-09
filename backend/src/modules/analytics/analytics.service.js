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

const getReports = async (shopId, timeRange) => {
    let query = supabase
        .from('orders')
        .select(`
            *,
            order_items (
                quantity,
                unit_price,
                total_price,
                items (
                    name
                )
            )
        `)
        .eq('shop_id', shopId);

    if (timeRange && timeRange !== 'all') {
        const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : null;
        if (days) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const dateStr = startDate.toISOString();
            query = query.gte('created_at', dateStr);
        }
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    const summary = {
        total_revenue: 0,
        total_orders: orders.length,
        completed_orders: 0,
        avg_order_value: 0,
        daily_revenue_data: [],
        top_items: []
    };

    const dailyDataMap = {};
    const itemsMap = {};

    orders.forEach(order => {
        if (order.status === 'delivered') {
            summary.completed_orders += 1;
            summary.total_revenue += Number(order.total_amount || 0);

            const dateStr = order.created_at ? order.created_at.split('T')[0] : null;
            if (dateStr) {
                if (!dailyDataMap[dateStr]) {
                    dailyDataMap[dateStr] = { date: dateStr, revenue: 0, orders_count: 0 };
                }
                dailyDataMap[dateStr].revenue += Number(order.total_amount || 0);
                dailyDataMap[dateStr].orders_count += 1;
            }

            // Aggregate items
            if (order.order_items && Array.isArray(order.order_items)) {
                order.order_items.forEach(itemInfo => {
                    const itemName = itemInfo.items?.name || 'Unknown Item';
                    const qty = Number(itemInfo.quantity || 1);
                    const rev = Number(itemInfo.total_price || (itemInfo.unit_price * qty) || 0);

                    if (!itemsMap[itemName]) {
                        itemsMap[itemName] = { item_name: itemName, total_quantity: 0, total_revenue: 0 };
                    }
                    itemsMap[itemName].total_quantity += qty;
                    itemsMap[itemName].total_revenue += rev;
                });
            }
        }
    });

    if (summary.completed_orders > 0) {
        summary.avg_order_value = summary.total_revenue / summary.completed_orders;
    }

    summary.daily_revenue_data = Object.values(dailyDataMap).sort((a, b) => a.date.localeCompare(b.date));

    // Sort items by revenue descending and take top 5
    summary.top_items = Object.values(itemsMap)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

    return summary;
};



module.exports = {
    getDailyAnalytics,
    getSummary,
    getReports
};
