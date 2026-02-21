import api from './api';

/**
 * Subcategory Service - Handles all subcategory-related API calls
 */

/**
 * Get all subcategories, optionally filtered by category
 * @param {string} categoryId - Optional category ID to filter by
 * @returns {Promise<Array>} Array of subcategory objects
 */
export const getSubcategories = async (categoryId = null) => {
  const queryParam = categoryId ? `?category_id=${categoryId}` : '';
  return api(`/subcategories${queryParam}`, {
    method: 'GET'
  });
};

/**
 * Get subcategory by ID
 * @param {string} subcategoryId - Subcategory ID
 * @returns {Promise<Object>} Subcategory object
 */
export const getSubcategoryById = async (subcategoryId) => {
  return api(`/subcategories/${subcategoryId}`, {
    method: 'GET'
  });
};

/**
 * Create a new subcategory
 * @param {Object} subcategoryData - Subcategory data { name, category_id }
 * @returns {Promise<Object>} Created subcategory object
 */
export const createSubcategory = async (subcategoryData, imageFile = null) => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('name', subcategoryData.name);
    formData.append('category_id', subcategoryData.category_id);
    formData.append('image', imageFile);

    return api('/subcategories', {
      method: 'POST',
      body: formData
    });
  }

  return api('/subcategories', {
    method: 'POST',
    body: JSON.stringify(subcategoryData)
  });
};

/**
 * Update subcategory
 * @param {string} subcategoryId - Subcategory ID
 * @param {Object} subcategoryData - Updated subcategory data
 * @returns {Promise<Object>} Updated subcategory object
 */
export const updateSubcategory = async (subcategoryId, subcategoryData) => {
  return api(`/subcategories/${subcategoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(subcategoryData)
  });
};

/**
 * Toggle subcategory visibility
 * @param {string} subcategoryId - Subcategory ID
 * @returns {Promise<Object>} Updated subcategory object
 */
export const toggleSubcategory = async (subcategoryId) => {
  return api(`/subcategories/${subcategoryId}/toggle`, {
    method: 'PATCH'
  });
};

/**
 * Delete subcategory
 * @param {string} subcategoryId - Subcategory ID
 * @returns {Promise<Object>} Response object
 */
export const deleteSubcategory = async (subcategoryId) => {
  return api(`/subcategories/${subcategoryId}`, {
    method: 'DELETE'
  });
};

export default {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  toggleSubcategory,
  deleteSubcategory
};
