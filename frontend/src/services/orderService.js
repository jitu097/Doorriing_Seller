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
  const { status, page = 1, limit = 20, startDate, endDate } = filters;

  queryParams.append('page', page);
  queryParams.append('limit', limit);

  if (status && status !== 'all') queryParams.append('status', status);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

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

export const assignDriver = async (orderId, deliveryPartnerId) => {
  return api(`/seller/orders/${orderId}/assign-driver`, {
    method: 'POST',
    body: JSON.stringify({ delivery_partner_id: deliveryPartnerId })
  });
};

export const markOrderReady = async (orderId) => {
  return api(`/seller/orders/${orderId}/ready`, {
    method: 'POST'
  });
};

export const getActiveDeliveryPartners = async () => {
  return api('/seller/orders/delivery-partners/active', {
    method: 'GET'
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
  assignDriver,
  markOrderReady,
  getActiveDeliveryPartners,
  getTodayOrders,
  getOrderStats
};
