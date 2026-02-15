const supabase = require('../../config/supabaseClient');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

/**
 * Get all subcategories for a shop, optionally filtered by category
 */
const getSubcategories = async (shopId, categoryId = null) => {
    let query = supabase
        .from('subcategories')
        .select('id, name, category_id, is_active, created_at')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
};

/**
 * Get a single subcategory by ID
 */
const getSubcategoryById = async (shopId, subcategoryId) => {
    const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('id', subcategoryId)
        .eq('shop_id', shopId)
        .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Subcategory not found');

    return data;
};

/**
 * Create a new subcategory
 */
const createSubcategory = async (shopId, subcategoryData) => {
    // Validate required fields
    if (!subcategoryData.name || !subcategoryData.category_id) {
        throw new BadRequestError('Name and category_id are required');
    }

    // Verify category belongs to this shop
    const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', subcategoryData.category_id)
        .eq('shop_id', shopId)
        .single();

    if (categoryError || !category) {
        throw new BadRequestError('Category not found or does not belong to this shop');
    }

    // Check for duplicate subcategory name within the same category
    const { data: existing } = await supabase
        .from('subcategories')
        .select('id')
        .eq('shop_id', shopId)
        .eq('category_id', subcategoryData.category_id)
        .eq('name', subcategoryData.name)
        .maybeSingle();

    if (existing) {
        throw new BadRequestError('Subcategory with this name already exists in this category');
    }

    // Create subcategory
    const { data, error } = await supabase
        .from('subcategories')
        .insert({
            shop_id: shopId,
            category_id: subcategoryData.category_id,
            name: subcategoryData.name,
            is_active: subcategoryData.is_active !== undefined ? subcategoryData.is_active : true
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Update a subcategory
 */
const updateSubcategory = async (shopId, subcategoryId, updates) => {
    const allowedFields = ['name', 'is_active'];
    
    const payload = {};
    allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
            payload[field] = updates[field];
        }
    });

    if (Object.keys(payload).length === 0) {
        return await getSubcategoryById(shopId, subcategoryId);
    }

    const { data, error } = await supabase
        .from('subcategories')
        .update(payload)
        .eq('id', subcategoryId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Subcategory not found');

    return data;
};

/**
 * Toggle subcategory visibility (is_active)
 */
const toggleSubcategoryVisibility = async (shopId, subcategoryId) => {
    // First get current status
    const { data: current, error: fetchError } = await supabase
        .from('subcategories')
        .select('is_active')
        .eq('id', subcategoryId)
        .eq('shop_id', shopId)
        .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
        .from('subcategories')
        .update({ is_active: !current.is_active })
        .eq('id', subcategoryId)
        .eq('shop_id', shopId)
        .select('id, name, is_active')
        .single();

    if (error) throw error;

    return data;
};

/**
 * Delete a subcategory
 * Note: Items with this subcategory will have subcategory_id set to NULL (ON DELETE SET NULL)
 */
const deleteSubcategory = async (shopId, subcategoryId) => {
    const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId)
        .eq('shop_id', shopId);

    if (error) throw error;
    return { success: true, message: 'Subcategory deleted successfully' };
};

module.exports = {
    getSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    toggleSubcategoryVisibility,
    deleteSubcategory
};
