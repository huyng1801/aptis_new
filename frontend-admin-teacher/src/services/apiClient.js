import axios from 'axios';
import { authService } from '@/services/authService';
import { API_ENDPOINTS } from '@/config/api.config';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Track refresh token request to prevent multiple simultaneous requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'NO TOKEN',
      headers: config.headers
    });
    
    if (token && !config.url.includes('/auth/login') && !config.url.includes('/auth/refresh')) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Authorization header added:', `Bearer ${token.substring(0, 30)}...`);
    } else if (!token) {
      console.log('[API Request] WARNING: No token available for request!');
    } else {
      console.log('[API Request] Skipping auth header for auth endpoint');
    }
    
    console.log('[API Request] Final headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('[API Request] Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`[API Error] ${error.response?.status || 'NO_STATUS'} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      message: error.response?.data?.message || error.message,
      errorDetails: error.response?.data
    });
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[API] Attempting token refresh...');
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = authService.getRefreshToken();
      console.log('[API] Refresh token available:', !!refreshToken);
      
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/refresh-token`,
            { refreshToken }
          );
          
          const { access: newToken, refresh: newRefreshToken } = refreshResponse.data.data || refreshResponse.data;
          
          authService.setTokens(newToken, newRefreshToken);
          
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
          
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError.response?.data || refreshError.message);
          authService.clearTokens();
          processQueue(refreshError, null);
          
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        } finally {
          isRefreshing = false;
        }
      } else {
        authService.clearTokens();
        processQueue(new Error('No refresh token'), null);
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to upload files with progress
export const uploadWithProgress = (url, formData, onProgress) => {
  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (onProgress) {
        onProgress(progress);
      }
    },
  });
};

// Helper function to download files
export const downloadFile = async (url, filename) => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    
    const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true, message: 'File downloaded successfully' };
  } catch (error) {
    throw new Error('Failed to download file');
  }
};

// Helper function for making requests with retry
export const requestWithRetry = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

export { apiClient };