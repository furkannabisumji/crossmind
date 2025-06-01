import axios from 'axios';
import { ErrorSeverity, trackError } from './error-tracking';

// Create a base axios instance with common configuration
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens, etc.
axiosClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here when you implement authentication
    // Example: if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Track API errors with the error tracking system
    const errorMessage = error.response?.data?.message || error.message;
    trackError(
      new Error(`API Error: ${errorMessage}`),
      ErrorSeverity.MEDIUM,
      {
        componentName: 'axiosClient',
        additionalData: {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
        },
      }
    );
    
    return Promise.reject(error);
  }
);

export default axiosClient;
