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
  const endpoint = queryString ? `/seller/orders?${queryString}` : '/seller/orders';

  return api(endpoint, {
    method: 'GET'
  });
};

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order object
 */
export const getOrderById = async (orderId) => {
  return api(`/seller/orders/${orderId}`, {
    method: 'GET'
  });
};

/**
 * Accept order
 */
export const acceptOrder = async (orderId) => {
  return api(`/seller/orders/${orderId}/accept`, {
    method: 'PATCH'
  });
};

/**
 * Reject order
 */
export const rejectOrder = async (orderId) => {
  return api(`/seller/orders/${orderId}/reject`, {
    method: 'PATCH'
  });
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status (pending, confirmed, preparing, out_for_delivery, delivered, cancelled)
 * @returns {Promise<Object>} Updated order object
 */
export const updateOrderStatus = async (orderId, status) => {
  return api(`/seller/orders/${orderId}/update-status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

/**
 * Get today's orders
 * @returns {Promise<Array>} Array of today's orders
 */
export const getTodayOrders = async () => {
  return api('/seller/orders/today', {
    method: 'GET'
  });
};

/**
 * Get order statistics
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Promise<Object>} Order statistics
 */
export const getOrderStats = async (days = 7) => {
  return api(`/seller/orders/stats?days=${days}`, {
    method: 'GET'
  });
};

export default {
  getOrders,
  getOrderById,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  getTodayOrders,
  getOrderStats
};
