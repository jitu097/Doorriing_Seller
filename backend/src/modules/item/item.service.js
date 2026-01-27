const supabase = require('../../config/supabaseClient');

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
        .select('stock_quantity')
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

    // 2. Upload to Supabase Storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${shopId}/${itemId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('menu-items') // Ensure this bucket exists in Supabase
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (uploadError) throw uploadError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('menu-items')
        .getPublicUrl(filePath);

    // 4. Update Item record with new URL
    const { data: updatedItem, error: updateError } = await supabase
        .from('items')
        .update({ image_url: publicUrl })
        .eq('id', itemId)
        .select()
        .single();

    if (updateError) throw updateError;

    return updatedItem;
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
    updateItem,
    updateStock,
    toggleAvailability,
    uploadItemImage
};
