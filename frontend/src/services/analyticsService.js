import apiCall from './api';

export const analyticsService = {
  // Get daily analytics data
  getDailyAnalytics: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const query = params.toString();
    return await apiCall(`/analytics/daily${query ? `?${query}` : ''}`);
  },

  // Get summary analytics
  getSummary: async (days = 7) => {
    return await apiCall(`/analytics/summary?days=${days}`);
  },
};
