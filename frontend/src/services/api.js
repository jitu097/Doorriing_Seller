import { auth } from '../config/firebase';

const resolveApiBaseUrl = () => {
  const {
    VITE_API_URL,
    VITE_LOCAL_API_URL,
  } = import.meta.env;

  const localFallback = VITE_LOCAL_API_URL || 'http://127.0.0.1:5001/api';

  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname || '';
    const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname) || hostname.endsWith('.local');

    if (isLocalHost) {
      return localFallback;
    }
  }

  return VITE_API_URL || localFallback;
};

export const API_BASE_URL = resolveApiBaseUrl();

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