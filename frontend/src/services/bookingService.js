import apiCall from './api';

export const bookingService = {
  // Get all bookings with filters
  getBookings: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const query = params.toString();
    return await apiCall(`/bookings${query ? `?${query}` : ''}`);
  },

  // Get today's bookings
  getTodayBookings: async () => {
    return await apiCall('/bookings/today');
  },

  // Update booking status
  updateStatus: async (bookingId, status) => {
    return await apiCall(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
