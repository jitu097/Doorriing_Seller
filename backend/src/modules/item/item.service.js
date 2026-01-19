const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

const CACHE_PREFIX = 'items:';

const getItems = async (shopId, categoryId) => {
    // Validate category belongs to shop might be needed, but for Read it's implicitly handled if we query by shopId + categoryId
    // Actually, standard practice: get by categoryId, but DB row has shop_id, so we filter by both.

    const cacheKey = `${CACHE_PREFIX}${categoryId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('shop_id', shopId)
        .eq('category_id', categoryId);

    if (error) throw error;

    await cache.set(cacheKey, data);
    return data;
};

const createItem = async (shopId, itemData) => {
    const { data, error } = await supabase
        .from('items')
        .insert([{ shop_id: shopId, ...itemData }])
        .select()
        .single();

    if (error) throw error;

    // Invalidate cache
    await cache.del(`${CACHE_PREFIX}${itemData.category_id}`);

    return data;
};

const updateItem = async (itemId, shopId, updates) => {
    // Need to fetch item first to check ownership and get category_id for invalidation
    const { data: existing, error: fetchError } = await supabase
        .from('items')
        .select('shop_id, category_id')
        .eq('id', itemId)
        .single();

    if (fetchError || !existing) throw new NotFoundError('Item not found');
    if (existing.shop_id !== shopId) throw new ForbiddenError('Access denied');

    const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

    if (error) throw error;

    // Invalidate cache
    await cache.del(`${CACHE_PREFIX}${existing.category_id}`);
    if (updates.category_id && updates.category_id !== existing.category_id) {
        await cache.del(`${CACHE_PREFIX}${updates.category_id}`);
    }

    return data;
};

module.exports = {
    getItems,
    createItem,
    updateItem
};
