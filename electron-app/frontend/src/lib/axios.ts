import axios from 'axios';

// Create a custom axios instance
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : `${BASE_URL}/api`,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from local storage
    const token = localStorage.getItem('topify_token');

    // If token is present, set the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('topify_token');
      localStorage.removeItem('topify_user');
      window.location.href = '#/login';
    }
    return Promise.reject(error);
  }
);

export const getApiBaseUrl = () => {
  return import.meta.env.DEV ? 'http://localhost:3000' : BASE_URL;
};

export default api;
