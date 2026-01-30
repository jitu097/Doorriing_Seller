const supabase = require('../../config/supabaseClient');
const cache = require('../../utils/cache');
const { ConflictError, NotFoundError } = require('../../utils/errors');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../config/cloudinary');

const createShop = async (sellerId, shopData) => {
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
            shop_image_url: null, // Image upload requires separate flow, setting null for now
            delivery_enabled: true,
            delivery_charge: 0,
            min_order_amount: 0,
            is_open: true,
            is_active: true,
            is_verified: false
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase Create Shop Error:', error);
        throw error;
    }

    cache.delete(`shop:seller:${sellerId}`);

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

const updateShop = async (sellerId, updates) => {
    const allowedFields = [
        'shop_name', 'description', 'phone', 'email', 'website',
        'address', 'shop_photo_url', 'operating_hours',
        'delivery_enabled', 'delivery_charge', 'min_order_amount'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredUpdates[key] = updates[key];
        }
    });

    const { data, error } = await supabase
        .from('shops')
        .update(filteredUpdates)
        .eq('seller_id', sellerId)
        .select()
        .single();

    if (error) throw error;

    cache.delete(`shop:seller:${sellerId}`);

    return data;
};

const toggleShopStatus = async (sellerId, isOpen) => {
    const { data, error } = await supabase
        .from('shops')
        .update({ is_open: isOpen })
        .eq('seller_id', sellerId)
        .select('id, shop_name, is_open')
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

module.exports = {
    createShop,
    getShop,
    updateShop,
    toggleShopStatus,
    uploadShopImage
};
