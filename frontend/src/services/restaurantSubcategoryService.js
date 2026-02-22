import api from './api';

export const getSubcategories = async (categoryId = null) => {
  const queryParam = categoryId ? `?category_id=${categoryId}` : '';
  return api(`/restaurant/subcategories${queryParam}`, {
    method: 'GET'
  });
};

export const getSubcategoryById = async (subcategoryId) => {
  return api(`/restaurant/subcategories/${subcategoryId}`, {
    method: 'GET'
  });
};

export const createSubcategory = async (subcategoryData, imageFile = null) => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('name', subcategoryData.name);
    formData.append('category_id', subcategoryData.category_id);
    formData.append('image', imageFile);

    return api('/restaurant/subcategories', {
      method: 'POST',
      body: formData
    });
  }

  return api('/restaurant/subcategories', {
    method: 'POST',
    body: JSON.stringify(subcategoryData)
  });
};

export const updateSubcategory = async (subcategoryId, subcategoryData) => {
  return api(`/restaurant/subcategories/${subcategoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(subcategoryData)
  });
};

export const toggleSubcategory = async (subcategoryId) => {
  return api(`/restaurant/subcategories/${subcategoryId}/toggle`, {
    method: 'PATCH'
  });
};

export const deleteSubcategory = async (subcategoryId) => {
  return api(`/restaurant/subcategories/${subcategoryId}`, {
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
