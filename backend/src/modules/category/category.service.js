const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

const CACHE_PREFIX = 'categories:';

const getCategories = async (shopId) => {
    const cacheKey = `${CACHE_PREFIX}${shopId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shopId)
        .order('sort_order', { ascending: true });

    if (error) throw error;

    await cache.set(cacheKey, data);
    return data;
};

const createCategory = async (shopId, categoryData) => {
    const { data, error } = await supabase
        .from('categories')
        .insert([{ shop_id: shopId, ...categoryData }])
        .select()
        .single();

    if (error) throw error;

    // Invalidate cache
    await cache.del(`${CACHE_PREFIX}${shopId}`);

    return data;
};

const updateCategory = async (categoryId, shopId, updates) => {
    // Verify category belongs to shop
    const { data: existing, error: fetchError } = await supabase
        .from('categories')
        .select('shop_id')
        .eq('id', categoryId)
        .single();

    if (fetchError || !existing) throw new NotFoundError('Category not found');
    if (existing.shop_id !== shopId) throw new ForbiddenError('Access denied');

    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

    if (error) throw error;

    // Invalidate cache
    await cache.del(`${CACHE_PREFIX}${shopId}`);

    return data;
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory
};
