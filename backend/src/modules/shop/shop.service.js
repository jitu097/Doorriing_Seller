const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { ConflictError, NotFoundError, BadRequestError } = require('../../utils/errors');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../config/cloudinary');
const notificationService = require('../notification/notification.service');
const admin = require('../../config/firebaseAdmin');

const VALID_SHOP_STATUSES = ['open', 'closed'];

const normalizeShopStatus = (status, isOpen) => {
    if (typeof status === 'string') {
        const normalized = status.toLowerCase();
        if (!VALID_SHOP_STATUSES.includes(normalized)) {
            throw new BadRequestError(`Invalid shop status: ${status}. Allowed values: ${VALID_SHOP_STATUSES.join(', ')}`);
        }
        return normalized;
    }

    if (typeof isOpen === 'boolean') {
        return isOpen ? 'open' : 'closed';
    }

    return null;
};

const isStatusOpen = (status) => status === 'open';

const createShop = async (sellerId, shopData, imageFile = null) => {
    try {
        // Check for existing shop
        const { data: existingShop } = await supabase
            .from('shops')
            .select('id')
            .eq('seller_id', sellerId)
            .maybeSingle();

        if (existingShop) {
            throw new ConflictError('Shop already exists for this seller');
        }

        let businessTypeId = null;
        try {
            const { data: bType } = await supabase
                .from('business_types')
                .select('id')
                .ilike('name', shopData.category || shopData.business_type)
                .maybeSingle();
            if (bType) businessTypeId = bType.id;
        } catch (ignore) { }

        if (!businessTypeId) {
            const typeName = shopData.category || shopData.business_type;
            throw new BadRequestError(`Invalid business type: ${typeName}. Must match a valid system type.`);
        }

        let uploadedImage = null;
        if (imageFile) {
            const folder = 'bazarse/shops';
            const publicId = `shop_${sellerId}_${Date.now()}`;
            uploadedImage = await uploadToCloudinary(imageFile.buffer, folder, publicId);
        }

        const { data: shop, error } = await supabase
            .from('shops')
            .insert({
                seller_id: sellerId,
                shop_name: shopData.shopName || shopData.shop_name,
                owner_name: shopData.ownerName || shopData.owner_name,
                name: shopData.shopName || shopData.shop_name,
                phone: shopData.phone,
                address: shopData.address,
                city: shopData.city || 'Latehar',
                state: shopData.state || 'Jharkhand',
                pincode: shopData.pincode || shopData.PINCode || '829206',
                business_type: (shopData.category || shopData.business_type)?.toLowerCase(),
                business_type_id: businessTypeId,
                subcategory: shopData.subcategory,
                description: shopData.description || '',
                shop_image_url: uploadedImage?.secure_url || null,
                delivery_enabled: true,
                delivery_charge: 0,
                min_order_amount: 0,
                opening_time: shopData.opening_time || shopData.openingTime || null,
                closing_time: shopData.closing_time || shopData.closingTime || null,
                status: 'open',
                is_open: true,
                is_active: true,
                is_verified: false,
                terms_accepted: shopData.termsAccepted === 'true' || shopData.termsAccepted === true,
                terms_accepted_at: new Date().toISOString(),
                terms_version: shopData.terms_version || 'v1'
            })
            .select()
            .single();

        if (error) throw error;

        cache.delete(`shop:seller:${sellerId}`);

        // Non-blocking notification
        void notificationService.createNotification(
            shop.id,
            'Seller Account Created',
            `Welcome aboard! Your shop ${shop.shop_name || shop.name || ''} is now live on Doorriing.`,
            'seller_onboarding',
            shop.id
        ).catch(() => {});

        return shop;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[ShopService] createShop error:', error);
        }
        throw error;
    }
};

const getShop = async (sellerId) => {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

    if (error) throw new NotFoundError('Shop not found');
    return data;
};

const updateShop = async (sellerId, updates, imageFile = null) => {
    try {
        const allowedFields = [
            'shop_name', 'description', 'phone', 'email', 'website',
            'address', 'shop_image_url', 'operating_hours',
            'delivery_enabled', 'delivery_charge', 'min_order_amount',
            'opening_time', 'closing_time', 'status', 'is_open',
            'city', 'state', 'pincode', 'owner_name'
        ];

        const normalizedUpdates = { ...updates };

        if (updates.openingTime !== undefined && updates.opening_time === undefined) {
            normalizedUpdates.opening_time = updates.openingTime;
        }

        if (updates.closingTime !== undefined && updates.closing_time === undefined) {
            normalizedUpdates.closing_time = updates.closingTime;
        }

        const normalizedStatus = normalizeShopStatus(updates.status, updates.is_open);
        if (normalizedStatus) {
            normalizedUpdates.status = normalizedStatus;
            normalizedUpdates.is_open = isStatusOpen(normalizedStatus);
        }

        const filteredUpdates = {};
        Object.keys(normalizedUpdates).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = normalizedUpdates[key];
            }
        });

        let oldImageUrl = null;
        if (imageFile) {
            const { data: existingShop, error: existingShopError } = await supabase
                .from('shops')
                .select('id, shop_image_url')
                .eq('seller_id', sellerId)
                .single();

            if (existingShopError || !existingShop) throw new NotFoundError('Shop not found');

            oldImageUrl = existingShop.shop_image_url;
            const folder = 'bazarse/shops';
            const publicId = `shop_${existingShop.id}_${Date.now()}`;
            const { secure_url } = await uploadToCloudinary(imageFile.buffer, folder, publicId);
            filteredUpdates.shop_image_url = secure_url;
        }

        const { data, error } = await supabase
            .from('shops')
            .update(filteredUpdates)
            .eq('seller_id', sellerId)
            .select()
            .single();

        if (error) throw error;

        if (imageFile && oldImageUrl) {
            const oldPublicId = extractPublicId(oldImageUrl);
            if (oldPublicId) {
                void deleteFromCloudinary(oldPublicId).catch(() => {});
            }
        }

        cache.delete(`shop:seller:${sellerId}`);
        return data;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[ShopService] updateShop error:', error);
        }
        throw error;
    }
};

const toggleShopStatus = async (sellerId, isOpen) => {
    const normalizedStatus = normalizeShopStatus(undefined, isOpen);
    const { data, error } = await supabase
        .from('shops')
        .update({
            status: normalizedStatus,
            is_open: isStatusOpen(normalizedStatus)
        })
        .eq('seller_id', sellerId)
        .select('id, shop_name, status, is_open, opening_time, closing_time')
        .single();

    if (error) throw error;
    cache.delete(`shop:seller:${sellerId}`);
    return data;
};

const updateShopStatusById = async (sellerId, shopId, status, isOpen) => {
    const normalizedStatus = normalizeShopStatus(status, isOpen);
    if (!normalizedStatus) throw new BadRequestError('Either status or is_open is required');

    const { data, error } = await supabase
        .from('shops')
        .update({
            status: normalizedStatus,
            is_open: isStatusOpen(normalizedStatus)
        })
        .eq('seller_id', sellerId)
        .eq('id', shopId)
        .select('id, shop_name, status, is_open, opening_time, closing_time')
        .single();

    if (error) throw error;
    cache.delete(`shop:seller:${sellerId}`);
    return data;
};

const uploadShopImage = async (sellerId, file) => {
    try {
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, shop_image_url')
            .eq('seller_id', sellerId)
            .single();

        if (shopError || !shop) throw new NotFoundError('Shop not found');

        const folder = 'bazarse/shops';
        const publicId = `shop_${shop.id}_${Date.now()}`;
        const { secure_url } = await uploadToCloudinary(file.buffer, folder, publicId);

        if (shop.shop_image_url) {
            const oldPublicId = extractPublicId(shop.shop_image_url);
            if (oldPublicId) {
                void deleteFromCloudinary(oldPublicId).catch(() => {});
            }
        }

        const { data: updatedShop, error: updateError } = await supabase
            .from('shops')
            .update({ shop_image_url: secure_url })
            .eq('seller_id', sellerId)
            .select()
            .single();

        if (updateError) throw updateError;
        cache.delete(`shop:seller:${sellerId}`);
        return updatedShop;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[ShopService] uploadShopImage error:', error);
        }
        throw error;
    }
};

const uploadCoverImage = async (sellerId, file) => {
    return await uploadShopImage(sellerId, file);
};

const updateBookingStatusById = async (sellerId, shopId, isBookingEnabled) => {
    const { data, error } = await supabase
        .from('shops')
        .update({ is_booking_enabled: isBookingEnabled })
        .eq('seller_id', sellerId)
        .eq('id', shopId)
        .select('id, shop_name, is_booking_enabled')
        .single();

    if (error) throw error;
    cache.delete(`shop:seller:${sellerId}`);
    return data;
};

const deleteSellerAccount = async (sellerId) => {
    try {
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, shop_image_url')
            .eq('seller_id', sellerId)
            .maybeSingle();

        if (shopError) throw shopError;
        if (!shop) throw new NotFoundError('Shop not found');

        const shopId = shop.id;
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('image_url')
            .eq('shop_id', shopId);

        if (itemsError) throw itemsError;

        const publicIdsToDelete = [];
        if (shop.shop_image_url) {
            const sid = extractPublicId(shop.shop_image_url);
            if (sid) publicIdsToDelete.push(sid);
        }

        (items || []).forEach(item => {
            if (item.image_url) {
                const iid = extractPublicId(item.image_url);
                if (iid) publicIdsToDelete.push(iid);
            }
        });

        const { error: rpcError } = await supabase.rpc('delete_seller_account', {
            p_seller_id: sellerId
        });

        if (rpcError) throw rpcError;

        // Cleanup Cloudinary images best effort
        for (const publicId of publicIdsToDelete) {
            void deleteFromCloudinary(publicId).catch(() => {});
        }

        try {
            await admin.auth().deleteUser(sellerId);
        } catch (firebaseError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Firebase Auth deletion failed:', firebaseError);
            }
        }

        cache.delete(`shop:seller:${sellerId}`);
        cache.delete(`wallet:summary:${shopId}`);

        return { success: true, message: 'Account and associated data deleted' };
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[ShopService] deleteSellerAccount error:', error);
        }
        throw error;
    }
};

module.exports = {
    createShop,
    getShop,
    updateShop,
    toggleShopStatus,
    updateShopStatusById,
    uploadShopImage,
    uploadCoverImage,
    updateBookingStatusById,
    deleteSellerAccount
};
