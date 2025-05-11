/**
 * Axios Configuration Module
 * 
 * This module configures a centralized Axios instance for making HTTP requests to the backend API.
 * It includes request and response interceptors for handling authentication, error management,
 * and toast notifications.
 * 
 * Features:
 * - Base URL and timeout configuration
 * - Automatic JWT token inclusion in request headers
 * - Proper Content-Type handling for different request types
 * - Comprehensive error handling with user-friendly messages
 * - Session expiration detection and handling
 * - Automatic success message display
 * 
 * @module services/axios
 */
import axios from 'axios';
import { showToast } from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with base configuration
 * Sets default values for all requests made through this instance
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor
 * This interceptor runs before each request is sent
 * 
 * It handles:
 * 1. Adding the authentication token from localStorage
 * 2. Setting appropriate Content-Type headers based on request data
 */
api.interceptors.request.use(
  (config) => {
    // Add JWT token to request headers if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set Content-Type header
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * This interceptor runs after each response is received
 * 
 * It handles:
 * 1. Displaying success messages
 * 2. Processing errors based on status code
 * 3. Handling authentication issues
 * 4. Providing user-friendly error notifications
 */
api.interceptors.response.use(
  (response) => {
    // Show success message if available
    if (response.data?.message) {
      showToast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    // Handle request cancellation
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject(error);
    }

    // Log error details
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      data: error.config?.data
    });

    // Handle specific error cases
    if (error.message === 'Network Error') {
      showToast.error('Cannot connect to server. Please check your connection.');
      return Promise.reject(error);
    }

    if (!error.response) {
      showToast.error('Network error. Please try again.');
      return Promise.reject(error);
    }

    switch (error.response.status) {
      case 401:
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        showToast.error('Session expired. Please login again.');
        window.location.href = '/login';
        break;
      
      case 403:
        showToast.error('You do not have permission to perform this action');
        break;
      
      case 404:
        showToast.error('Resource not found');
        break;
      
      case 422:
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          errors.forEach(err => showToast.error(err.message));
        } else {
          showToast.error(error.response.data.message || 'Validation failed');
        }
        break;
      
      case 500:
        showToast.error('Server error. Please try again later.');
        break;
      
      default:
        showToast.error(error.response.data.message || 'An error occurred. Please try again.');
    }

    return Promise.reject(error);
  }
);

export default api; 