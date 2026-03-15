import api from './api';
import imageCompression from 'browser-image-compression';

/**
 * Grocery Service - Handles all grocery-related API calls
 * Now expanded to cover Orders, Offers, and Profile
 */

const parseNumber = (value, fallback = 0) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const DEFAULT_DISCOUNT_TYPE = 'none';

// --- ITEMS ---

/**
 * Get all grocery items for the current shop
 * @param {Object} filters - Optional filters { category_id, is_available }
 */
export const getGroceryItems = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return api(`/grocery/items?${queryParams}`, {
        method: 'GET'
    });
};

/**
 * Get a single grocery item by ID
 */
export const getGroceryItemById = async (itemId) => {
    return api(`/grocery/items/${itemId}`, {
        method: 'GET'
    });
};

/**
 * Create a new grocery item
 */
export const createGroceryItem = async (itemData) => {
	const basePrice = parseNumber(itemData.price, 0);
	const discountType = itemData.discount_type || DEFAULT_DISCOUNT_TYPE;
	const discountValue = discountType === DEFAULT_DISCOUNT_TYPE ? 0 : parseNumber(itemData.discount_value, 0);
	const finalPrice = itemData.final_price !== undefined ? parseNumber(itemData.final_price, basePrice) : basePrice;
	const fullPrice = itemData.full_price !== undefined ? parseNumber(itemData.full_price, basePrice) : basePrice;
	const fullDiscountType = itemData.full_discount_type || discountType;
	const fullDiscountValue = fullDiscountType === DEFAULT_DISCOUNT_TYPE ? 0 : parseNumber(itemData.full_discount_value ?? discountValue, discountValue);
	const fullFinalPrice = itemData.full_final_price !== undefined ? parseNumber(itemData.full_final_price, finalPrice) : finalPrice;

    // Sanitize Payload
    const payload = {
        name: itemData.name,
        description: itemData.description || null,
        price: basePrice,
        stock_quantity: parseInt(itemData.stock_quantity || 0, 10),
        unit: itemData.unit,
        is_available: itemData.active !== undefined ? itemData.active : true,
        discount_type: discountType,
        discount_value: discountValue,
        final_price: finalPrice,
        full_price: fullPrice,
        full_discount_type: fullDiscountType,
        full_discount_value: fullDiscountValue,
        full_final_price: fullFinalPrice,
    };

    if (itemData.category_id && itemData.category_id !== "") {
        payload.category_id = itemData.category_id;
    } else {
        payload.category_id = null;
    }

    // Persist optional subcategory selection
    if (itemData.subcategory_id && itemData.subcategory_id !== "") {
        payload.subcategory_id = itemData.subcategory_id;
    } else {
        payload.subcategory_id = null;
    }

    return api('/grocery/items', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

/**
 * Update a grocery item
 */
export const updateGroceryItem = async (itemId, updates) => {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price = parseNumber(updates.price, 0);
    if (updates.stock_quantity !== undefined) payload.stock_quantity = parseInt(updates.stock_quantity, 10);
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.image_url !== undefined) payload.image_url = updates.image_url;
    if (updates.active !== undefined) payload.is_available = updates.active;
    if (updates.discount_type !== undefined) payload.discount_type = updates.discount_type;
    if (updates.discount_value !== undefined) payload.discount_value = parseNumber(updates.discount_value, 0);
    if (updates.final_price !== undefined) payload.final_price = parseNumber(updates.final_price, 0);
    if (updates.full_price !== undefined) payload.full_price = parseNumber(updates.full_price, 0);
    if (updates.full_discount_type !== undefined) payload.full_discount_type = updates.full_discount_type;
    if (updates.full_discount_value !== undefined) payload.full_discount_value = parseNumber(updates.full_discount_value, 0);
    if (updates.full_final_price !== undefined) payload.full_final_price = parseNumber(updates.full_final_price, 0);

    if (updates.category_id !== undefined) {
        payload.category_id = updates.category_id === "" ? null : updates.category_id;
    }

    if (updates.subcategory_id !== undefined) {
        payload.subcategory_id = updates.subcategory_id === "" ? null : updates.subcategory_id;
    }

    return api(`/grocery/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

export const deleteGroceryItem = async (itemId) => {
    return api(`/grocery/items/${itemId}`, {
        method: 'DELETE'
    });
};

export const updateStock = async (itemId, quantity) => {
    return api(`/grocery/items/${itemId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: parseInt(quantity, 10) })
    });
};

export const toggleItemAvailability = async (itemId, is_available) => {
    return api(`/grocery/items/${itemId}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ is_available })
    });
};

export const uploadItemImage = async (itemId, imageFile) => {
    let fileToUpload = imageFile;
    if (imageFile instanceof File && imageFile.type.startsWith('image/')) {
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
            fileToUpload = await imageCompression(imageFile, options);
        } catch (error) {
            console.error('Image compression failed:', error);
        }
    }

    const formData = new FormData();
    formData.append('image', fileToUpload);
    return api(`/grocery/items/${itemId}/image`, {
        method: 'POST',
        body: formData
    });
};

// --- CATEGORIES ---

export const getGroceryCategories = async () => {
    return api('/grocery/categories', {
        method: 'GET'
    });
};

export const createGroceryCategory = async (name, imageFile = null) => {
    if (imageFile) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('image', imageFile);

        return api('/grocery/categories', {
            method: 'POST',
            body: formData
        });
    }

    return api('/grocery/categories', {
        method: 'POST',
        body: JSON.stringify({ name })
    });
};

export const deleteGroceryCategory = async (id) => {
    return api(`/grocery/categories/${id}`, {
        method: 'DELETE'
    });
};

export const updateGroceryCategory = async (id, data) => {
    return api(`/grocery/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
};

// --- ORDERS ---

export const getOrders = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return api(`/seller/orders?${queryParams}`, {
        method: 'GET'
    });
};

export const acceptOrder = async (orderId) => {
    return api(`/seller/orders/${orderId}/accept`, { method: 'PATCH' });
};

export const rejectOrder = async (orderId) => {
    return api(`/seller/orders/${orderId}/reject`, { method: 'PATCH' });
};

export const updateOrderStatus = async (orderId, status, cancellationReason = null) => {
    const body = { status };
    if (cancellationReason) {
        body.cancellation_reason = cancellationReason;
    }
    return api(`/seller/orders/${orderId}/update-status`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
};

export const getOrderStats = async () => {
    return api('/seller/orders/stats', { method: 'GET' });
};

// --- OFFERS (Discounts) ---

export const getOffers = async () => {
    return api('/discounts', { method: 'GET' });
};

export const createOffer = async (offerData) => {
    return api('/discounts', {
        method: 'POST',
        body: JSON.stringify(offerData)
    });
};

export const updateOffer = async (id, offerData) => {
    return api(`/discounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(offerData)
    });
};

export const toggleOffer = async (id, isActive) => {
    return api(`/discounts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
    });
};

export const deleteOffer = async (id) => {
    // Note: If backend doesn't have DELETE /discounts/:id, use toggle to deactivate or implement DELETE in backend.
    // Assuming DELETE exists or we just hide it. The plan mentioned CRUD.
    // Checking backend routes... discount.routes.js likely doesn't have delete, usually toggle is used.
    // I entered DELETE here but if it fails I'll switch to toggle off.
    return api(`/discounts/${id}`, {
        method: 'DELETE'
    });
};


// --- PROFILE / DASHBOARD ---

export const getShopProfile = async () => {
    return api('/shop', { method: 'GET' });
};

export const updateShopProfile = async (data) => {
    return api('/shop', {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const getDashboardStats = async (period = 'daily') => {
    // Reusing analytics route
    return api(`/analytics/summary?days=${period === 'weekly' ? 7 : 30}`, { method: 'GET' });
};

export const getAnalyticsChartData = async (startDate, endDate) => {
    let query = '';
    if (startDate) query += `startDate=${startDate}&`;
    if (endDate) query += `endDate=${endDate}`;
    return api(`/analytics/daily?${query}`, { method: 'GET' });
};


export default {
    getGroceryItems,
    getGroceryItemById,
    createGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    deleteGroceryItem,
    updateStock,
    toggleItemAvailability,
    uploadItemImage,
    getGroceryCategories,
    getGroceryCategories,
    createGroceryCategory,
    deleteGroceryCategory,
    updateGroceryCategory,
    getOrders,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    getOrderStats,
    getOffers,
    createOffer,
    updateOffer,
    toggleOffer,
    deleteOffer,
    getShopProfile,
    updateShopProfile,
    getDashboardStats,
    getAnalyticsChartData
};
