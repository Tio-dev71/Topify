import axios from 'axios';

// Create a custom axios instance
const BASE_URL = import.meta.env.VITE_API_URL || 'https://topify.vn';
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
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return BASE_URL;
  }
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return BASE_URL;
};

export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  let base = BASE_URL;
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    base = window.location.origin;
  }
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

export default api;
