const supabase = require('../config/supabaseClient');
const cache = require('../utils/cache');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

/**
 * SINGLE SOURCE OF TRUTH
 * Loads user and shop context from database
 * Creates user if not exists, but NEVER auto-creates shop
 */
const loadSellerContext = async (req, res, next) => {
    try {
        const firebaseUid = req.firebaseUid;

        // Step 1: Get or create user
        let { data: user } = await supabase
            .from('users')
            .select('id, firebase_uid, role')
            .eq('firebase_uid', firebaseUid)
            .maybeSingle();

        if (!user) {
            // Create user on first login
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({ firebase_uid: firebaseUid, role: 'seller' })
                .select('id, firebase_uid, role')
                .single();

            if (createError) throw createError;
            user = newUser;
        }

        if (user.role !== 'seller') {
            throw new ForbiddenError('Access denied. Seller role required');
        }

        // Step 2: Check if shop exists (DO NOT CREATE)
        const { data: shop } = await supabase
            .from('shops')
            .select('*')
            .eq('seller_id', user.id)
            .maybeSingle();

        // Attach to request
        req.user = user;
        req.shop = shop; // null if not exists
        req.seller = user; // Keep for backward compatibility

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Guard: Requires shop to exist
 * Use this for protected routes that need shop
 */
const requireShop = async (req, res, next) => {
    if (!req.shop) {
        return res.status(403).json({
            success: false,
            error: 'Shop registration required',
            hasShop: false
        });
    }
    next();
};

// Legacy middleware for backward compatibility
const loadSeller = loadSellerContext;

const loadShop = async (req, res, next) => {
    if (!req.shop) {
        throw new NotFoundError('Shop not found for this seller');
    }
    next();
};

const requireBusiness = (allowedTypes) => (req, res, next) => {
    if (!req.shop) {
        return res.status(403).json({
            success: false,
            error: 'Shop registration required'
        });
    }

    if (!req.shop.business_type) {
        // Log warning for missing business type
        console.warn(`Shop ${req.shop.id} has no business_type set`);
        return res.status(403).json({
            success: false,
            error: 'Shop business type configuration error'
        });
    }

    const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    const shopType = req.shop.business_type.toLowerCase();

    if (!types.includes(shopType)) {
        return res.status(403).json({
            success: false,
            error: `Access denied. This feature is for ${types.join('/')} shops only. Your shop is: ${shopType}`
        });
    }
    next();
};

const requireRestaurant = requireBusiness(['restaurant', 'cloud kitchen', 'hotel']);
const requireGrocery = requireBusiness(['grocery', 'supermarket']);


module.exports = {
    loadSellerContext,
    requireShop,
    loadSeller,
    loadShop,
    requireRestaurant,
    requireGrocery
};
