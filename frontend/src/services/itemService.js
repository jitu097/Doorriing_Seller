import api from './api';
import imageCompression from 'browser-image-compression';

/**
 * Item Service - Handles all menu item-related API calls
 */

/**
 * Get all items for a category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of item objects
 */
export const getItemsByCategory = async (categoryId) => {
  return api(`/categories/${categoryId}/items`, {
    method: 'GET'
  });
};

/**
 * Get all items across all categories
 * @returns {Promise<Array>} Array of all items
 */
export const getAllItems = async () => {
  return api('/items', {
    method: 'GET'
  });
};

/**
 * Get item by ID
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} Item object
 */
export const getItemById = async (itemId) => {
  return api(`/items/${itemId}`, {
    method: 'GET'
  });
};

/**
 * Create a new menu item
 * @param {Object} itemData - Item data { name, description, price, category_id, image_url, half_portion_price, is_active }
 * @returns {Promise<Object>} Created item object
 */
export const createItem = async (itemData) => {
  return api('/items', {
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
  return api(`/items/${itemId}`, {
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
  return api(`/items/${itemId}`, {
    method: 'DELETE'
  });
};

/**
 * Toggle item active status
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} Updated item object
 */
export const toggleItem = async (itemId) => {
  return api(`/items/${itemId}/toggle`, {
    method: 'PATCH'
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

  return api(`/items/${itemId}/image`, {
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
