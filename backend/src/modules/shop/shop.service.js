const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { ConflictError, NotFoundError, BadRequestError } = require('../../utils/errors');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../config/cloudinary');
const notificationService = require('../notification/notification.service');

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
    // Check for existing shop using correct column 'seller_id'
    const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('seller_id', sellerId)
        .maybeSingle();

    if (existingShop) {
        throw new ConflictError('Shop already exists for this seller');
    }


    // Speculative fix for business_type_id constraint
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
        // Fallback or Error? DB requires it. Let's try to find a default or throw.
        // Assuming strictness for now as per schema.
        // Attempting to find 'Restaurant' or 'Grocery' exactly if input was loose
        const typeName = shopData.category || shopData.business_type;
        throw new BadRequestError(`Invalid business type: ${typeName}. Must match a valid system type.`);
    }

    let uploadedImage = null;
    if (imageFile) {
        const folder = 'bazarse/shops';
        const publicId = `shop_${sellerId}_${Date.now()}`;
        uploadedImage = await uploadToCloudinary(imageFile.buffer, folder, publicId);
    }

    // Map camelCase inputs (from frontend) or snake_case inputs to DB columns
    const { data: shop, error } = await supabase
        .from('shops')
        .insert({
            seller_id: sellerId, // CORRECTED: owner_id -> seller_id
            shop_name: shopData.shopName || shopData.shop_name,
            owner_name: shopData.ownerName || shopData.owner_name,
            name: shopData.shopName || shopData.shop_name,
            phone: shopData.phone,
            address: shopData.address,
            city: shopData.city || 'Latehar',
            state: shopData.state || 'Jharkhand',
            pincode: shopData.pincode || shopData.PINCode || '829206',
            business_type: (shopData.category || shopData.business_type)?.toLowerCase(),
            business_type_id: businessTypeId, // Added likely required FK
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
            // Terms & Conditions consent (recorded at registration)
            terms_accepted: shopData.termsAccepted === 'true' || shopData.termsAccepted === true,
            terms_accepted_at: new Date().toISOString(),
            terms_version: shopData.terms_version || 'v1'
        })
        .select()
        .single();

    if (error) {
        if (uploadedImage?.public_id) {
            await deleteFromCloudinary(uploadedImage.public_id);
        }
        console.error('Supabase Create Shop Error:', error);
        throw error;
    }

    cache.delete(`shop:seller:${sellerId}`);

    try {
        await notificationService.createNotification(
            shop.id,
            'Seller Account Created',
            `Welcome aboard! Your shop ${shop.shop_name || shop.name || ''} is now live on Doorriing.`,
            'seller_onboarding',
            shop.id,
            'shop'
        );
    } catch (notifyError) {
        console.error('Failed to create seller onboarding notification', notifyError);
    }

    return shop;
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

        if (existingShopError || !existingShop) {
            throw new NotFoundError('Shop not found');
        }

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
            await deleteFromCloudinary(oldPublicId);
        }
    }

    cache.delete(`shop:seller:${sellerId}`);

    return data;
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

    if (!normalizedStatus) {
        throw new BadRequestError('Either status or is_open is required');
    }

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
    // 1. Get current shop to check for existing image
    const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_image_url')
        .eq('seller_id', sellerId)
        .single();

    if (shopError || !shop) {
        throw new NotFoundError('Shop not found');
    }

    // 2. Upload to Cloudinary
    const folder = 'bazarse/shops';
    const publicId = `shop_${shop.id}_${Date.now()}`;

    const { secure_url, public_id } = await uploadToCloudinary(file.buffer, folder, publicId);

    // 3. Delete old image from Cloudinary (if exists)
    if (shop.shop_image_url) {
        const oldPublicId = extractPublicId(shop.shop_image_url);
        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }
    }

    // 4. Update shop record with new Cloudinary URL
    const { data: updatedShop, error: updateError } = await supabase
        .from('shops')
        .update({ shop_image_url: secure_url })
        .eq('seller_id', sellerId)
        .select()
        .single();

    if (updateError) throw updateError;

    cache.delete(`shop:seller:${sellerId}`);

    return updatedShop;
};

const uploadCoverImage = async (sellerId, file) => {
    // Alias to uploadShopImage for cover button functionality
    return await uploadShopImage(sellerId, file);
};

const updateBookingStatusById = async (sellerId, shopId, isBookingEnabled) => {
    const { data, error } = await supabase
        .from('shops')
        .update({
            is_booking_enabled: isBookingEnabled
        })
        .eq('seller_id', sellerId)
        .eq('id', shopId)
        .select('id, shop_name, is_booking_enabled')
        .single();

    if (error) throw error;

    cache.delete(`shop:seller:${sellerId}`);

    return data;
};

module.exports = {
    createShop,
    getShop,
    updateShop,
    toggleShopStatus,
    updateShopStatusById,
    uploadShopImage,
    uploadCoverImage,
    updateBookingStatusById
};
