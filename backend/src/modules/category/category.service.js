const supabase = require('../../config/supabaseClient');
const { ConflictError } = require('../../utils/errors');
const { fetchImageFromUnsplash } = require('../../services/unsplash.service');

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

    let imageUrl = categoryData.image_url;
    if (!imageUrl || imageUrl.trim() === '') {
        imageUrl = await fetchImageFromUnsplash(categoryData.name);
    }

    const { data, error } = await supabase
        .from('categories')
        .insert({
            shop_id: shopId,
            name: categoryData.name,
            image_url: imageUrl,
            display_order: categoryData.display_order || 0,
            is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
        })
        .select()
        .single();

    if (error) throw error;

    return data;
};

const getCategories = async (shopId) => {
    // Fetch categories separately (avoids Supabase embed ambiguity)
    const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, display_order, is_active, created_at')
        .eq('shop_id', shopId)
        .order('display_order', { ascending: true });

    if (categoryError) throw categoryError;

    // Fetch items separately using explicit foreign key
    const { data: items, error: itemsError } = await supabase
        .from('items')
        .select(`
            id,
            category_id,
            name,
            price,
            half_portion_price,
            stock_quantity,
            unit,
            image_url,
            is_available,
            is_active
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    // Merge items into categories in memory
    const categoriesWithItems = (categories || []).map(category => ({
        ...category,
        items: (items || []).filter(item => item.category_id === category.id)
    }));

    return categoriesWithItems;
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
