import api from './api';

export const getCategories = async () => {
  return api('/restaurant/categories', {
    method: 'GET'
  });
};

export const createCategory = async (categoryData, imageFile = null) => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('name', categoryData.name);
    if (categoryData.display_order !== undefined) {
      formData.append('display_order', String(categoryData.display_order));
    }
    formData.append('image', imageFile);

    return api('/restaurant/categories', {
      method: 'POST',
      body: formData
    });
  }

  return api('/restaurant/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData)
  });
};

export const updateCategory = async (categoryId, categoryData) => {
  return api(`/restaurant/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(categoryData)
  });
};

export const deleteCategory = async (categoryId) => {
  return api(`/restaurant/categories/${categoryId}`, {
    method: 'DELETE'
  });
};

export const toggleCategory = async (categoryId) => {
  return api(`/restaurant/categories/${categoryId}/toggle`, {
    method: 'PATCH'
  });
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategory
};
