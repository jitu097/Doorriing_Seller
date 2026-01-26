import apiCall from './api';

export const discountService = {
  // Get all discounts
  getDiscounts: async () => {
    return await apiCall('/discounts');
  },

  // Create new discount
  createDiscount: async (discountData) => {
    return await apiCall('/discounts', {
      method: 'POST',
      body: JSON.stringify(discountData),
    });
  },

  // Update discount
  updateDiscount: async (discountId, discountData) => {
    return await apiCall(`/discounts/${discountId}`, {
      method: 'PATCH',
      body: JSON.stringify(discountData),
    });
  },

  // Toggle discount active status
  toggleDiscount: async (discountId, isActive) => {
    return await apiCall(`/discounts/${discountId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};
