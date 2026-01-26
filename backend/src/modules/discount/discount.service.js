const supabase = require('../../config/supabaseClient');
const { ConflictError } = require('../../utils/errors');

const createDiscount = async (shopId, discountData) => {
    const { data: existing } = await supabase
        .from('discounts')
        .select('id')
        .eq('shop_id', shopId)
        .eq('code', discountData.code)
        .single();
    
    if (existing) {
        throw new ConflictError('Discount code already exists');
    }
    
    const { data, error } = await supabase
        .from('discounts')
        .insert({
            shop_id: shopId,
            code: discountData.code.toUpperCase(),
            name: discountData.name,
            description: discountData.description,
            discount_type: discountData.discount_type,
            discount_value: discountData.discount_value,
            min_order_amount: discountData.min_order_amount || 0,
            max_discount_amount: discountData.max_discount_amount,
            usage_limit: discountData.usage_limit,
            usage_per_customer: discountData.usage_per_customer || 1,
            valid_from: discountData.valid_from,
            valid_until: discountData.valid_until,
            is_active: discountData.is_active !== undefined ? discountData.is_active : true
        })
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

const getDiscounts = async (shopId) => {
    const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
};

const updateDiscount = async (discountId, shopId, updates) => {
    const { data, error } = await supabase
        .from('discounts')
        .update(updates)
        .eq('id', discountId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

const toggleDiscount = async (discountId, shopId, isActive) => {
    const { data, error } = await supabase
        .from('discounts')
        .update({ is_active: isActive })
        .eq('id', discountId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

module.exports = {
    createDiscount,
    getDiscounts,
    updateDiscount,
    toggleDiscount
};
