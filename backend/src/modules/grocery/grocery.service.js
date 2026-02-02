const supabase = require('../../config/supabaseClient');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const cache = require('../../utils/cache');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../config/cloudinary');

/**
 * Service: Grocery
 * Handles logic for Grocery items, inclusive of optional categories and full schema support.
 */

// --- UTILS ---

/**
 * Helper to build a safe payload for the 'items' table.
 * Strictly adheres to the schema to prevent Supabase errors.
 * Omits undefined/null keys to let DB defaults handle them, unless explicitly nullable.
 */
const buildItemPayload = (shopId, data) => {
    const payload = {
        shop_id: shopId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        half_portion_price: data.half_portion_price || null,
        stock_quantity: data.stock_quantity || 0,
        unit: data.unit || null,
        image_url: data.image_url || null,
        is_available: data.is_available !== undefined ? data.is_available : true,
    };

    // Category is optional for Grocery
    if (data.category_id) {
        payload.category_id = data.category_id;
    } else {
        payload.category_id = null; // Explicitly null if not provided, relies on DB column being nullable
    }

    // Clean undefined values just in case
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    return payload;
};

// --- ITEMS ---

const createGroceryItem = async (shopId, itemData) => {
    // 1. Validate critical inputs
    if (!itemData.name || itemData.price === undefined) {
        throw new BadRequestError('Name and Price are required.');
    }

    // 2. Build Safe Payload
    const payload = buildItemPayload(shopId, itemData);

    // 3. Insert into Supabase
    const { data, error } = await supabase
        .from('items')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error('Error creating grocery item:', error);
        throw error;
    }

    return data;
};

const getGroceryItems = async (shopId, filters = {}) => {
    let query = supabase
        .from('items')
        .select(`
            *,
            categories (id, name)
        `)
        .eq('shop_id', shopId);

    // Optional Filter: Category
    if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
    }

    // Optional Filter: Availability
    if (filters.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

const getGroceryItemById = async (shopId, itemId) => {
    const { data, error } = await supabase
        .from('items')
        .select(`
            *,
            categories (id, name)
        `)
        .eq('id', itemId)
        .eq('shop_id', shopId) // Security: Ensure item belongs to this shop
        .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Item not found');

    return data;
};

const updateGroceryItem = async (shopId, itemId, updates) => {
    // 1. Build Payload (Only include fields present in 'updates')
    // We treat 'updates' as a partial object.
    const allowedFields = [
        'name', 'description', 'price', 'half_portion_price',
        'stock_quantity', 'unit', 'image_url', 'is_available', 'category_id'
    ];

    const payload = {};
    allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
            payload[field] = updates[field];
        }
    });

    // Special handling for category_id un-setting
    if (updates.category_id === null) {
        payload.category_id = null;
    }

    if (Object.keys(payload).length === 0) {
        return await getGroceryItemById(shopId, itemId);
    }

    const { data, error } = await supabase
        .from('items')
        .update(payload)
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

const deleteGroceryItem = async (shopId, itemId) => {
    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('shop_id', shopId);

    if (error) throw error;
    return { success: true };
};


// --- INVENTORY ---

const updateInventory = async (shopId, itemId, quantity) => {
    // 1. Simple update of stock_quantity
    const { data, error } = await supabase
        .from('items')
        .update({ stock_quantity: quantity })
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

const toggleAvailability = async (shopId, itemId, status) => {
    const { data, error } = await supabase
        .from('items')
        .update({ is_available: status })
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

const uploadItemImage = async (itemId, shopId, file) => {
    // 1. Verify item ownership
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, image_url')
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .single();

    if (itemError || !item) {
        throw new NotFoundError('Item not found or access denied');
    }

    // 2. Upload to Cloudinary
    const folder = 'bazarse/items';
    const publicId = `shop_${shopId}_grocery_${itemId}_${Date.now()}`;

    const { secure_url, public_id } = await uploadToCloudinary(file.buffer, folder, publicId);

    // 3. Delete old image from Cloudinary (if exists)
    if (item.image_url) {
        const oldPublicId = extractPublicId(item.image_url);
        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }
    }

    // 4. Update Item record with new Cloudinary URL
    const { data: updatedItem, error: updateError } = await supabase
        .from('items')
        .update({ image_url: secure_url })
        .eq('id', itemId)
        .select()
        .single();

    if (updateError) throw updateError;

    return updatedItem;
};

// --- CATEGORIES (OPTIONAL) ---

const createGroceryCategory = async (shopId, name) => {
    // Check dupe
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('shop_id', shopId)
        .eq('name', name)
        .maybeSingle();

    if (existing) throw new BadRequestError('Category already exists');

    const { data, error } = await supabase
        .from('categories')
        .insert({ shop_id: shopId, name: name })
        .select()
        .single();

    if (error) throw error;
    return data;
};

const getGroceryCategories = async (shopId) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shopId)
        .order('display_order', { ascending: true });

    if (error) throw error;
    if (error) throw error;
    return data || [];
};

const deleteGroceryCategory = async (shopId, categoryId) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('shop_id', shopId);

    if (error) throw error;
    return { success: true };
};

const updateGroceryCategory = async (shopId, categoryId, updates) => {
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    createGroceryItem,
    getGroceryItems,
    getGroceryItemById,
    updateGroceryItem,
    deleteGroceryItem,
    updateInventory,
    toggleAvailability,
    uploadItemImage,
    createGroceryCategory,
    getGroceryCategories,
    deleteGroceryCategory,
    updateGroceryCategory
};
