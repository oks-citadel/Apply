/**
 * Centralized API Configuration
 * Single source of truth for all API URLs across the application
 *
 * SECURITY FIX: Standardizes API URLs to prevent inconsistent endpoint usage
 */

// Main API for general services (job-service, user-service, etc.)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Auth API for authentication services (auth-service)
export const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8001/api/v1';

// Feature flags service
export const FEATURE_FLAGS_URL = process.env.NEXT_PUBLIC_FEATURE_FLAGS_URL || 'http://localhost:8000';

// Analytics service
export const ANALYTICS_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:3001';

// Notifications service
export const NOTIFICATIONS_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || 'http://localhost:8007';

/**
 * Helper to construct full API URLs
 */
export const buildApiUrl = (path: string, baseUrl: string = API_BASE_URL): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * SSR-safe storage helper
 */
export const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(key);
  }
  return null;
};

export const setStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(key, value);
  }
};

export const removeStorageItem = (key: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(key);
  }
};
