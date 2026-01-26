import api from './api';

/**
 * Category Service - Handles all category-related API calls
 */

/**
 * Get all categories with their items
 * @returns {Promise<Array>} Array of category objects
 */
export const getCategories = async () => {
  return api.apiCall('/categories', {
    method: 'GET'
  });
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Category object
 */
export const getCategoryById = async (categoryId) => {
  return api.apiCall(`/categories/${categoryId}`, {
    method: 'GET'
  });
};

/**
 * Create a new category
 * @param {Object} categoryData - Category data { name, description, display_order }
 * @returns {Promise<Object>} Created category object
 */
export const createCategory = async (categoryData) => {
  return api.apiCall('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData)
  });
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @returns {Promise<Object>} Updated category object
 */
export const updateCategory = async (categoryId, categoryData) => {
  return api.apiCall(`/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(categoryData)
  });
};

/**
 * Delete category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteCategory = async (categoryId) => {
  return api.apiCall(`/categories/${categoryId}`, {
    method: 'DELETE'
  });
};

/**
 * Toggle category visibility
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Updated category object
 */
export const toggleCategory = async (categoryId) => {
  return api.apiCall(`/categories/${categoryId}/toggle`, {
    method: 'PATCH'
  });
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategory
};
