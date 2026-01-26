import api from './api';

/**
 * Order Service - Handles all order-related API calls
 */

/**
 * Get all orders with optional filters
 * @param {Object} filters - Optional filters (status, date range, etc.)
 * @returns {Promise<Array>} Array of order objects
 */
export const getOrders = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/orders?${queryString}` : '/orders';
  
  return api.apiCall(endpoint, {
    method: 'GET'
  });
};

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order object
 */
export const getOrderById = async (orderId) => {
  return api.apiCall(`/orders/${orderId}`, {
    method: 'GET'
  });
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status (pending, confirmed, preparing, out_for_delivery, delivered, cancelled)
 * @returns {Promise<Object>} Updated order object
 */
export const updateOrderStatus = async (orderId, status) => {
  return api.apiCall(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

/**
 * Get today's orders
 * @returns {Promise<Array>} Array of today's orders
 */
export const getTodayOrders = async () => {
  return api.apiCall('/orders/today', {
    method: 'GET'
  });
};

/**
 * Get order statistics
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Promise<Object>} Order statistics
 */
export const getOrderStats = async (days = 7) => {
  return api.apiCall(`/orders/stats?days=${days}`, {
    method: 'GET'
  });
};

export default {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getTodayOrders,
  getOrderStats
};
