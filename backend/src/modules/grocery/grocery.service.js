const supabase = require('../../config/supabaseClient');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const cache = require('../../utils/cache');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../config/cloudinary');
const { fetchImageFromUnsplash } = require('../../services/unsplash.service');

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
        expiry_date: data.expiry_date || null,
        price: data.price,
        half_portion_price: data.half_portion_price || null,
        stock_quantity: data.stock_quantity || 0,
        unit: data.unit || null,
        image_url: data.image_url || null,
        is_available: data.is_available !== undefined ? data.is_available : true,
        subcategory_id: data.subcategory_id || null,
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

    // 2. Validate category if provided
    if (itemData.category_id) {
        const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('id, shop_id')
            .eq('id', itemData.category_id)
            .eq('shop_id', shopId)
            .single();

        if (categoryError || !category) {
            throw new BadRequestError('Category not found or does not belong to this shop');
        }

    }

    // 3. Validate subcategory if provided
    if (itemData.subcategory_id) {
        const { data: subcategory, error: subcategoryError } = await supabase
            .from('subcategories')
            .select('id, category_id, shop_id')
            .eq('id', itemData.subcategory_id)
            .eq('shop_id', shopId)
            .single();

        if (subcategoryError || !subcategory) {
            throw new BadRequestError('Subcategory not found or does not belong to this shop');
        }

        if (subcategory.category_id == null) {
            throw new BadRequestError('Subcategory is missing a parent category');
        }

        if (itemData.category_id && subcategory.category_id !== itemData.category_id) {
            console.warn('Category mismatch for item create; overriding to subcategory parent', {
                providedCategory: itemData.category_id,
                subcategoryCategory: subcategory.category_id,
                subcategoryShop: subcategory.shop_id
            });
        }

        itemData.category_id = subcategory.category_id;
    }

    // 4. Build Safe Payload
    const payload = buildItemPayload(shopId, itemData);

    // 3. Insert into Supabase
    const { data, error } = await supabase
        .from('items')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error('Error creating grocery item:', { error, payload });
        throw error;
    }

    return data;
};

const getGroceryItems = async (shopId, filters = {}) => {
    let query = supabase
        .from('items')
        .select(`
            id,
            shop_id,
            category_id,
            subcategory_id,
            name,
            description,
            price,
            half_portion_price,
            stock_quantity,
            unit,
            image_url,
            is_available,
            expiry_date,
            created_at,
            updated_at,
            category:categories!items_category_id_fkey(id, name),
            subcategory:subcategories(id, name)
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
            id,
            shop_id,
            category_id,
            subcategory_id,
            name,
            description,
            price,
            half_portion_price,
            stock_quantity,
            unit,
            image_url,
            is_available,
            expiry_date,
            created_at,
            updated_at,
            category:categories!items_category_id_fkey(id, name),
            subcategory:subcategories(id, name)
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
        'stock_quantity', 'unit', 'image_url', 'is_available', 'category_id',
        'expiry_date', 'subcategory_id'
    ];

    // 2. Validate category_id if being updated
    if (updates.category_id) {
        const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('id, shop_id')
            .eq('id', updates.category_id)
            .eq('shop_id', shopId)
            .single();

        if (categoryError || !category) {
            throw new BadRequestError('Category not found or does not belong to this shop');
        }

    }

    // 3. Validate subcategory if provided
    if (updates.subcategory_id) {
        const { data: subcategory, error: subcategoryError } = await supabase
            .from('subcategories')
            .select('id, category_id, shop_id')
            .eq('id', updates.subcategory_id)
            .eq('shop_id', shopId)
            .single();

        if (subcategoryError || !subcategory) {
            throw new BadRequestError('Subcategory not found or does not belong to this shop');
        }

        if (subcategory.category_id == null) {
            throw new BadRequestError('Subcategory is missing a parent category');
        }

        if (updates.category_id && subcategory.category_id !== updates.category_id) {
            console.warn('Category mismatch for item update; overriding to subcategory parent', {
                providedCategory: updates.category_id,
                subcategoryCategory: subcategory.category_id,
                subcategoryShop: subcategory.shop_id
            });
        }

        updates.category_id = subcategory.category_id;
    }

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

const createGroceryCategory = async (shopId, name, file) => {
    // Check dupe
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('shop_id', shopId)
        .eq('name', name)
        .maybeSingle();

    if (existing) throw new BadRequestError('Category already exists');

    let imageUrl = null;

    if (file) {
        // Handle manual Cloudinary Upload
        const folder = 'bazarse/categories';
        const publicId = `shop_${shopId}_category_${Date.now()}`;
        const uploadResult = await uploadToCloudinary(file.buffer, folder, publicId);
        imageUrl = uploadResult.secure_url;
    } else {
        // Fallback to Unsplash
        imageUrl = await fetchImageFromUnsplash(name);
    }

    const { data, error } = await supabase
        .from('categories')
        .insert({
            shop_id: shopId,
            name: name,
            image_url: imageUrl
        })
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
