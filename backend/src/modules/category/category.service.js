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
            is_hidden: categoryData.is_hidden || false
        })
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

const getCategories = async (shopId) => {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, display_order, is_hidden, created_at')
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
            is_hidden: updates.is_hidden
        })
        .eq('id', categoryId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

const toggleCategoryVisibility = async (categoryId, shopId, isHidden) => {
    const { data, error } = await supabase
        .from('categories')
        .update({ is_hidden: isHidden })
        .eq('id', categoryId)
        .eq('shop_id', shopId)
        .select('id, name, is_hidden')
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
