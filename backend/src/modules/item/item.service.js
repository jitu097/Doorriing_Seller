const supabase = require('../../config/supabaseClient');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../config/cloudinary');
const notificationService = require('../notification/notification.service');

const createItem = async (shopId, itemData) => {
    const { data, error } = await supabase
        .from('items')
        .insert({
            shop_id: shopId,
            category_id: itemData.category_id,
            name: itemData.name,
            // description: itemData.description, // Removed due to schema mismatch error
            price: itemData.price,
            half_portion_price: itemData.half_portion_price,
            stock_quantity: itemData.stock_quantity || 0,
            unit: itemData.unit,
            image_url: itemData.image_url,
            is_available: itemData.is_available !== undefined ? itemData.is_available : true
        })
        .select()
        .single();

    if (error) throw error;

    if (itemData.stock_quantity) {
        await logInventoryChange(data.id, shopId, 'purchase', 0, itemData.stock_quantity, 'Initial stock');
    }

    return data;
};

const getItems = async (shopId, categoryId = null) => {
    let query = supabase
        .from('items')
        .select(`
            id,
            name,
            // description, 
            price,
            half_portion_price,
            stock_quantity,
            unit,
            image_url,
            is_available,
            created_at,
            categories (id, name)
        `)
        .eq('shop_id', shopId);

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
};

const getItem = async (itemId, shopId) => {
    const { data, error } = await supabase
        .from('items')
        .select(`
            *,
            categories (id, name)
        `)
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .single();

    if (error) throw error;

    return data;
};

const updateItem = async (itemId, shopId, updates) => {
    const allowedFields = [
        'name', /* 'description', */ 'price', 'half_portion_price',
        'unit', 'image_url', 'category_id'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
            filteredUpdates[key] = updates[key];
        }
    });

    const { data, error } = await supabase
        .from('items')
        .update(filteredUpdates)
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;

    return data;
};

const updateStock = async (itemId, shopId, newQuantity, changeType = 'adjustment', notes = null) => {
    const { data: currentItem } = await supabase
        .from('items')
        .select('stock_quantity, name, unit')
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .single();

    if (!currentItem) {
        throw new Error('Item not found');
    }

    const oldQuantity = currentItem.stock_quantity || 0;
    const quantityChange = newQuantity - oldQuantity;

    if (quantityChange === 0) {
        return currentItem;
    }

    const { data, error } = await supabase
        .from('items')
        .update({ stock_quantity: newQuantity })
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .select()
        .single();

    if (error) throw error;

    await logInventoryChange(itemId, shopId, changeType, oldQuantity, quantityChange, notes);

    // Low stock notification (Grocery only)
    if (newQuantity <= 10) { // Threshold: 10
        try {
            const hasUnread = await notificationService.hasUnreadNotification(shopId, 'stock', itemId);
            if (!hasUnread) {
                await notificationService.createNotification(
                    shopId,
                    'Low Stock Alert',
                    `${currentItem.name} is running low (${newQuantity} ${currentItem.unit || 'units'} left)`,
                    'stock',
                    itemId,
                    'item'
                );
            }
        } catch (err) {
            console.error('Failed to send stock notification', err);
        }
    }

    return data;
};

const toggleAvailability = async (itemId, shopId, isAvailable) => {
    const { data, error } = await supabase
        .from('items')
        .update({ is_available: isAvailable })
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .select('id, name, is_available')
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
        throw new Error('Item not found or access denied');
    }

    // 2. Upload to Cloudinary
    const folder = 'bazarse/items';
    const publicId = `shop_${shopId}_item_${itemId}_${Date.now()}`;

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

const deleteItem = async (itemId, shopId) => {
    // 1. Get item to find image_url
    const { data: item, error: fetchError } = await supabase
        .from('items')
        .select('id, image_url')
        .eq('id', itemId)
        .eq('shop_id', shopId)
        .single();

    if (fetchError || !item) {
        throw new Error('Item not found or access denied');
    }

    // 2. Delete image from Cloudinary if exists
    if (item.image_url) {
        try {
            const publicId = extractPublicId(item.image_url);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        } catch (err) {
            console.error('Failed to delete image from Cloudinary:', err);
            // Continue with item deletion even if image delete fails
        }
    }

    // 3. Delete item from DB
    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

    if (error) throw error;

    return { message: 'Item deleted successfully' };
};

const logInventoryChange = async (itemId, shopId, changeType, quantityBefore, quantityChange, notes = null) => {
    const quantityAfter = quantityBefore + quantityChange;

    await supabase
        .from('inventory_logs')
        .insert({
            item_id: itemId,
            shop_id: shopId,
            change_type: changeType,
            quantity_before: quantityBefore,
            quantity_change: quantityChange,
            quantity_after: quantityAfter,
            notes: notes
        });
};

module.exports = {
    createItem,
    getItems,
    getItem,
    deleteItem,
    updateItem,
    updateStock,
    toggleAvailability,
    uploadItemImage
};
