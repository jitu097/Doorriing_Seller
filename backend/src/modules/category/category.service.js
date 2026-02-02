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

const deleteCategory = async (categoryId, shopId) => {
    // Check if category belongs to shop
    const { data: category, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .eq('shop_id', shopId)
        .single();

    if (fetchError || !category) {
        throw new Error('Category not found or access denied');
    }

    // Delete the category
    // Note: Items should cascade delete or be handled if not cascading.
    // Assuming foreign key constraints are set to CASCADE or we rely on explicit deletion.
    // If we need to delete items first manually, we should do that, but usually DB handles it.
    // However, for Cloudinary images, we might want to iterate items and delete them.
    // simpler approach for now: delete category.

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

    if (error) throw error;

    return { message: 'Category deleted successfully' };
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    toggleCategoryVisibility,
    deleteCategory
};
