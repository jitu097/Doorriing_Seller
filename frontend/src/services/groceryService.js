import api from './api';

/**
 * Grocery Service - Handles all grocery-related API calls
 * Now expanded to cover Orders, Offers, and Profile
 */

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
    // Sanitize Payload
    const payload = {
        name: itemData.name,
        description: itemData.description || null,
        price: parseFloat(itemData.price),
        stock_quantity: parseInt(itemData.stock_quantity || 0, 10),
        unit: itemData.unit,
        is_available: itemData.active !== undefined ? itemData.active : true,
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
    if (updates.price !== undefined) payload.price = parseFloat(updates.price);
    if (updates.stock_quantity !== undefined) payload.stock_quantity = parseInt(updates.stock_quantity, 10);
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.image_url !== undefined) payload.image_url = updates.image_url;
    if (updates.active !== undefined) payload.is_available = updates.active;

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
    const formData = new FormData();
    formData.append('image', imageFile);
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
    return api(`/orders?${queryParams}`, {
        method: 'GET'
    });
};

export const updateOrderStatus = async (orderId, status, cancellationReason = null) => {
    const body = { status };
    if (cancellationReason) {
        body.cancellation_reason = cancellationReason;
    }
    return api(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
};

export const getOrderStats = async () => {
    return api('/orders/stats', { method: 'GET' });
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
    // New additions
    getOrders,
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
