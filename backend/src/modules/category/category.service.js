const supabase = require('../../config/supabaseClient');
const { ConflictError } = require('../../utils/errors');

const createCategory = async (shopId, categoryData) => {
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('shop_id', shopId)
        .eq('name', categoryData.name)
        .single();

    if (existing) {
        throw new ConflictError('Category with this name already exists');
    }

    const { data, error } = await supabase
        .from('categories')
        .insert({
            shop_id: shopId,
            name: categoryData.name,
            display_order: categoryData.display_order || 0,
            is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
        })
        .select()
        .single();

    if (error) throw error;

    return data;
};

const getCategories = async (shopId) => {
    const { data, error } = await supabase
        .from('categories')
        .select(`
            id, 
            name, 
            display_order, 
            is_active, 
            created_at,
            items (
                id,
                name,
                price,
                half_portion_price,
                stock_quantity,
                unit,
                image_url,
                is_available,
                is_active
            )
        `)
        .eq('shop_id', shopId)
        .order('display_order', { ascending: true });

    if (error) throw error;

    return data || [];
};

const updateCategory = async (categoryId, shopId, updates) => {
    const { data, error } = await supabase
        .from('categories')
        .update({
            name: updates.name,
            display_order: updates.display_order,
            is_active: updates.is_active
        })
        .eq('id', categoryId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;

    return data;
};

const toggleCategoryVisibility = async (categoryId, shopId) => {
    // First get current status
    const { data: current, error: fetchError } = await supabase
        .from('categories')
        .select('is_active')
        .eq('id', categoryId)
        .eq('shop_id', shopId)
        .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
        .from('categories')
        .update({ is_active: !current.is_active })
        .eq('id', categoryId)
        .eq('shop_id', shopId)
        .select('id, name, is_active')
        .single();

    if (error) throw error;

    return data;
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    toggleCategoryVisibility
};
