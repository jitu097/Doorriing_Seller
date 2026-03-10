import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

// Helper function to get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Only set Content-Type to application/json if it's not already set and body is not FormData
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Remove Content-Type header completely for FormData to let browser set it with boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default apiCall;
