/**
 * Centralized URL Configuration
 * Handles environment-specific URLs for redirects
 */

const getUrl = (envKey, defaultUrl) => {
  // Check if we are in Vite environment
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[envKey] || defaultUrl;
  }
  return defaultUrl;
};

export const URLS = {
  // Main Website (Web)
  MAIN_SITE: getUrl("VITE_MAIN_SITE_URL", "http://localhost:7000"),

  // Customer Portal (Self)
  CUSTOMER_PORTAL: getUrl("VITE_CUSTOMER_PORTAL_URL", "http://localhost:7002"),

  // Provider Portal (Fitter/Business)
  PROVIDER_PORTAL: getUrl("VITE_PROVIDER_PORTAL_URL", "http://localhost:7003"),

  // API Backend
  API: getUrl("VITE_API_URL", "http://localhost:5000"),
};

export default URLS;
