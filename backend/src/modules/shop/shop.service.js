const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { BadRequestError, NotFoundError } = require('../../utils/errors');

const CACHE_PREFIX = 'shop:';

const getShopByOwnerId = async (ownerId) => {
    const cacheKey = `${CACHE_PREFIX}${ownerId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
        .from('shops')
        .select('*, business_types(id, name)')
        .eq('owner_id', ownerId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
        throw error;
    }

    if (data) {
        await cache.set(cacheKey, data);
    }

    return data;
};

const createShop = async (ownerId, shopData) => {
    const { business_type_id, ...rest } = shopData;

    if (!business_type_id) {
        throw new BadRequestError('Business type is required');
    }

    // Check if shop already exists
    const existingShop = await getShopByOwnerId(ownerId);
    if (existingShop) {
        throw new BadRequestError('Shop already exists for this seller');
    }

    // Validate business_type_id
    const { data: bt, error: btError } = await supabase
        .from('business_types')
        .select('id')
        .eq('id', business_type_id)
        .single();

    if (btError || !bt) {
        throw new BadRequestError('Invalid business type');
    }

    const { data, error } = await supabase
        .from('shops')
        .insert([{ owner_id: ownerId, business_type_id, ...rest }])
        .select('*, business_types(id, name)')
        .single();

    if (error) throw error;
    return data;
};

const updateShop = async (ownerId, updates) => {
    // Validate business_type_id if being updated
    if (updates.business_type_id) {
        const { data: bt, error: btError } = await supabase
            .from('business_types')
            .select('id')
            .eq('id', updates.business_type_id)
            .single();

        if (btError || !bt) {
            throw new BadRequestError('Invalid business type');
        }
    }

    const { data, error } = await supabase
        .from('shops')
        .update(updates)
        .eq('owner_id', ownerId)
        .select('*, business_types(id, name)')
        .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Shop not found');

    // Invalidate cache
    await cache.del(`${CACHE_PREFIX}${ownerId}`);

    return data;
};

// Kept for backward compatibility if needed, but proxied to updateShop
const updateShopStatus = async (ownerId, status) => {
    return updateShop(ownerId, { status });
};

module.exports = {
    getShopByOwnerId,
    createShop,
    updateShop,
    updateShopStatus
};
