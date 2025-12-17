/**
 * Centralized API Configuration
 * Single source of truth for all API URLs across the application
 *
 * IMPORTANT: Backend services handle /api/v1 routing internally.
 * The API gateway (api.applyforus.com) routes directly to services:
 * - /auth/* -> auth-service
 * - /jobs/* -> job-service
 * - /users/* -> user-service
 * - etc.
 *
 * Do NOT add /api/v1 prefix here or in environment variables.
 */

// Main API for general services (job-service, user-service, etc.)
// Production: https://api.applyforus.com
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Auth API for authentication services (auth-service)
// Production: https://api.applyforus.com (same as main API, gateway handles routing)
export const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';

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
