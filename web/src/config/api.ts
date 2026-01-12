import axios from 'axios';
import { authStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // Try to get token from store first (most reliable)
    try {
      const storeState = authStore.getState();
      if (storeState.token) {
        config.headers.Authorization = `Bearer ${storeState.token}`;
        return config;
      }
    } catch (e) {
      console.warn('Failed to get token from store:', e);
    }
    
    // Fallback to localStorage parsing
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        }
      } catch (e) {
        // Continue to next fallback
      }
    }
    
    // Final fallback to old token storage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
let isRedirecting = false; // Prevent multiple redirects

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't clear auth for login/register endpoints (they can return 401 normally)
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                            requestUrl.includes('/auth/google') ||
                            requestUrl.includes('/auth/register');
      
      // Don't auto-clear for user update endpoints - let components handle the error
      const isUserUpdateEndpoint = requestUrl.includes('/users/') && error.config?.method === 'put';
      
      if (!isAuthEndpoint && !isUserUpdateEndpoint && !isRedirecting) {
        // Only clear auth and redirect if we're not already on login/register page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          // Check if auth storage exists before clearing
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            try {
              const parsed = JSON.parse(authStorage);
              // Only clear if token exists (meaning user was authenticated)
              if (parsed?.state?.token) {
                console.warn('Token expired or invalid, clearing auth and redirecting to login');
                isRedirecting = true;
                localStorage.removeItem('auth-storage');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Use setTimeout to prevent multiple redirects
                setTimeout(() => {
                  if (!window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                  }
                  isRedirecting = false;
                }, 100);
              }
            } catch (e) {
              // If parsing fails, clear anyway
              console.error('Error parsing auth storage:', e);
              localStorage.removeItem('auth-storage');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

