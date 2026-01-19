const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../utils/errors');
const { DISCOUNT_SCOPE } = require('../../utils/constants');

const CACHE_PREFIX = 'discounts:';

const getDiscounts = async (shopId) => {
    const cacheKey = `${CACHE_PREFIX}${shopId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('shop_id', shopId);

    if (error) throw error;

    await cache.set(cacheKey, data);
    return data;
};

const createDiscount = async (shopId, discountData) => {
    // Validate dates
    if (new Date(discountData.valid_from) >= new Date(discountData.valid_until)) {
        throw new BadRequestError('Valid until must be after valid from');
    }

    // Validate scope
    if (discountData.scope === DISCOUNT_SCOPE.CATEGORY && !discountData.category_id) {
        throw new BadRequestError('Category ID required for category scope');
    }
    if (discountData.scope === DISCOUNT_SCOPE.ITEM && !discountData.item_id) {
        throw new BadRequestError('Item ID required for item scope');
    }

    // TODO: Validate that category_id or item_id actually belongs to the shop (omitted for brevity but recommended)

    const { data, error } = await supabase
        .from('discounts')
        .insert([{ shop_id: shopId, ...discountData }])
        .select()
        .single();

    if (error) throw error;

    await cache.del(`${CACHE_PREFIX}${shopId}`);
    return data;
};

const updateDiscount = async (discountId, shopId, updates) => {
    const { data: existing, error: fetchError } = await supabase
        .from('discounts')
        .select('shop_id')
        .eq('id', discountId)
        .single();

    if (fetchError || !existing) throw new NotFoundError('Discount not found');
    if (existing.shop_id !== shopId) throw new ForbiddenError('Access denied');

    // Validate dates if updated
    if (updates.valid_from && updates.valid_until) {
        if (new Date(updates.valid_from) >= new Date(updates.valid_until)) {
            throw new BadRequestError('Valid until must be after valid from');
        }
    }

    const { data, error } = await supabase
        .from('discounts')
        .update(updates)
        .eq('id', discountId)
        .select()
        .single();

    if (error) throw error;

    await cache.del(`${CACHE_PREFIX}${shopId}`);

    return data;
};

module.exports = {
    getDiscounts,
    createDiscount,
    updateDiscount
};
