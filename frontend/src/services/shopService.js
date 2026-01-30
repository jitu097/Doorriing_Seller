import apiCall from './api';

export const shopService = {
  // Get shop details
  getShop: async () => {
    return await apiCall('/shop');
  },

  // Create new shop
  createShop: async (shopData) => {
    return await apiCall('/shop', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
  },

  // Update shop details
  updateShop: async (shopData) => {
    return await apiCall('/shop', {
      method: 'PATCH',
      body: JSON.stringify(shopData),
    });
  },

  // Toggle shop open/close status
  toggleStatus: async (isOpen) => {
    return await apiCall('/shop/status', {
      method: 'PATCH',
      body: JSON.stringify({ is_open: isOpen }),
    });
  },

  // Upload shop image
  uploadShopImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return await apiCall('/shop/image', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  },
};
