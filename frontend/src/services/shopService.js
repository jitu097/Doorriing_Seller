import apiCall from './api';

const SHOP_STATUS_EVENT = 'shop-status-changed';
const SHOP_OPEN_STATUS = 'open';
const SHOP_CLOSED_STATUS = 'closed';

const extractShop = (response) => {
  if (!response) return null;
  if (response.shop) return response.shop;
  if (response.data?.shop) return response.data.shop;
  return response;
};

const toStatus = (status, isOpen) => {
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized === SHOP_OPEN_STATUS || normalized === SHOP_CLOSED_STATUS) {
      return normalized;
    }
  }

  if (typeof isOpen === 'boolean') {
    return isOpen ? SHOP_OPEN_STATUS : SHOP_CLOSED_STATUS;
  }

  return SHOP_OPEN_STATUS;
};

const isOpenFromShop = (shop) => toStatus(shop?.status, shop?.is_open) === SHOP_OPEN_STATUS;

const emitShopStatusChange = (isOpen) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SHOP_STATUS_EVENT, { detail: { isOpen: !!isOpen } }));
};

export const shopService = {
  // Get shop details
  getShop: async () => {
    const response = await apiCall('/shop');
    return response;
  },

  getCurrentShop: async () => {
    const response = await apiCall('/shop');
    return extractShop(response);
  },

  getShopStatus: async () => {
    const response = await apiCall('/shop');
    const shop = extractShop(response);
    return isOpenFromShop(shop);
  },

  // Create new shop
  createShop: async (shopData) => {
    const body = shopData instanceof FormData ? shopData : JSON.stringify(shopData);

    return await apiCall('/shop', {
      method: 'POST',
      body,
    });
  },

  // Update shop details
  updateShop: async (shopData) => {
    const body = shopData instanceof FormData ? shopData : JSON.stringify(shopData);

    return await apiCall('/shop', {
      method: 'PATCH',
      body,
    });
  },

  // Toggle shop open/close status
  toggleStatus: async (isOpen) => {
    const targetStatus = isOpen ? SHOP_OPEN_STATUS : SHOP_CLOSED_STATUS;
    const currentShop = await shopService.getCurrentShop();
    if (currentShop?.id) {
      const response = await apiCall(`/shops/${currentShop.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus }),
      });

      const updatedShop = extractShop(response);
      emitShopStatusChange(isOpenFromShop(updatedShop));
      return response;
    }

    const legacyResponse = await apiCall('/shop/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: targetStatus }),
    });

    const updatedShop = extractShop(legacyResponse);
    emitShopStatusChange(isOpenFromShop(updatedShop));
    return legacyResponse;
  },

  subscribeToShopStatus: (callback) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handler = (event) => {
      callback(!!event.detail?.isOpen);
    };

    window.addEventListener(SHOP_STATUS_EVENT, handler);

    return () => {
      window.removeEventListener(SHOP_STATUS_EVENT, handler);
    };
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

  // Upload cover image
  uploadCoverImage: async (coverFile) => {
    const formData = new FormData();
    formData.append('cover', coverFile);
    
    return await apiCall('/shop/cover', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  },

  // Delete Account
  deleteAccount: async () => {
    return await apiCall('/shop/delete-account', {
      method: 'DELETE'
    });
  },
};
