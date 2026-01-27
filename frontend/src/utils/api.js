import axios from 'axios';
import { API_BASE_URL } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Always set Authorization header, even for FormData requests
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData, don't set Content-Type - let axios set it with boundary
    // This ensures the Authorization header is preserved
    if (config.data instanceof FormData) {
      // Remove any manually set Content-Type to let axios handle it
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/';
      return Promise.reject(error);
    }
    
    // Log 403 errors for debugging (admin permission issues)
    if (status === 403) {
      console.error('403 Forbidden:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.response?.data?.error || 'Access denied',
        hasToken: !!localStorage.getItem('accessToken'),
      });
    }
    
    // Only redirect to error pages for critical server errors
    // 400 errors are usually validation errors and should be handled by components
    // 404 errors on API calls might be expected (resource not found)
    // Only redirect for 500+ server errors that indicate system issues
    if (status >= 500) {
      // Only redirect if it's not a handled error (check if error was already handled)
      const shouldRedirect = !error.config?.skipErrorRedirect;
      if (shouldRedirect) {
        window.location.href = '/error/500';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
