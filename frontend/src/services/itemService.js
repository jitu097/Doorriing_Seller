import api from './api';

/**
 * Item Service - Handles all menu item-related API calls
 */

/**
 * Get all items for a category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of item objects
 */
export const getItemsByCategory = async (categoryId) => {
  return api.apiCall(`/categories/${categoryId}/items`, {
    method: 'GET'
  });
};

/**
 * Get all items across all categories
 * @returns {Promise<Array>} Array of all items
 */
export const getAllItems = async () => {
  return api.apiCall('/items', {
    method: 'GET'
  });
};

/**
 * Get item by ID
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} Item object
 */
export const getItemById = async (itemId) => {
  return api.apiCall(`/items/${itemId}`, {
    method: 'GET'
  });
};

/**
 * Create a new menu item
 * @param {Object} itemData - Item data { name, description, price, category_id, image_url, half_portion_price, is_active }
 * @returns {Promise<Object>} Created item object
 */
export const createItem = async (itemData) => {
  return api.apiCall('/items', {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
};

/**
 * Update menu item
 * @param {string} itemId - Item ID
 * @param {Object} itemData - Updated item data
 * @returns {Promise<Object>} Updated item object
 */
export const updateItem = async (itemId, itemData) => {
  return api.apiCall(`/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(itemData)
  });
};

/**
 * Delete menu item
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteItem = async (itemId) => {
  return api.apiCall(`/items/${itemId}`, {
    method: 'DELETE'
  });
};

/**
 * Toggle item active status
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} Updated item object
 */
export const toggleItem = async (itemId) => {
  return api.apiCall(`/items/${itemId}/toggle`, {
    method: 'PATCH'
  });
};

/**
 * Upload item image
 * @param {string} itemId - Item ID
 * @param {File} imageFile - Image file to upload
 * @returns {Promise<Object>} Image upload response with URL
 */
export const uploadItemImage = async (itemId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  return api.apiCall(`/items/${itemId}/image`, {
    method: 'POST',
    body: formData,
    headers: {} // Let browser set Content-Type for FormData
  });
};

export default {
  getItemsByCategory,
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  toggleItem,
  uploadItemImage
};
