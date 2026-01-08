import axios from "axios";
import URLS from "../config/urls";

/**
 * API Configuration
 * Environment URLs for different deployment stages
 *
 * URL Pattern: All projects now use ${URLS.API}/api as base
 * - Admin: ${URLS.API}/api → /admin/...
 * - Provider: ${URLS.API}/api → /provider/...
 * - Client: ${URLS.API}/api → /customer/...
 * - Web: ${URLS.API}/api → /customer/...
 */

// API Base URL - includes /api prefix for consistency
const API_URL = `${URLS.API}/api`;

// Auth Web URL (for redirects)
export const AUTH_WEB_URL = URLS.MAIN_SITE;

/**
 * Export the current environment URL (for static files/images)
 */
export const NodeURL = URLS.API;

/**
 * Local storage keys for authentication
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "autoscreen-token",
  USER: "autoscreen-user",
  USER_STATE: "autoscreen-userstate",
};

/**
 * Session status codes
 */
const SESSION_STATUS = {
  EXPIRED: "00",
};

/**
 * Creates and configures the axios instance
 */
export const client = axios.create({
  baseURL: API_URL,
  responseType: "json",
});

/**
 * Request interceptor to attach authorization token
 * Automatically adds the auth token from localStorage to all requests
 */
client.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (authToken) {
      // Add Bearer prefix if not already present
      config.headers.Authorization = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Handles session expiration and cleanup
 * Clears local storage and redirects to login page
 */
const handleSessionExpiration = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.USER_STATE);
  window.location = `${AUTH_WEB_URL}/auth`;
};

/**
 * Response interceptor to handle data unwrapping and global errors
 */
client.interceptors.response.use(
  (response) => {
    // Check if session has expired (custom status code)
    if (response?.data?.status === SESSION_STATUS.EXPIRED) {
      handleSessionExpiration();
      return Promise.reject("Session expired");
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status

      // Handle 401 Unauthorized - but NOT for auth endpoints
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      // Also check specific error message for "User not found"
      const isUserNotFound = error.response.data?.error === "User not found";

      if (
        (error.response.status === 401 && !isAuthEndpoint) ||
        isUserNotFound
      ) {
        handleSessionExpiration();
      }
    } else if (error.request) {
    } else {
    }

    return Promise.reject(
      error.response?.data || error.response || error.message
    );
  }
);

/**
 * Makes an HTTP request using the configured axios client
 * @param {Object} options - Axios request configuration options
 * @returns {Promise} Promise resolving to response data or rejecting with error
 */
export const request = (options) => {
  return client(options);
};

export default request;
