/**
 * Secure Authentication Module
 *
 * This module exports secure token management utilities that protect
 * against XSS attacks by:
 *
 * 1. Storing access tokens in memory only (not accessible to XSS)
 * 2. Using httpOnly cookies for refresh tokens (not accessible to JavaScript)
 * 3. Implementing proper token refresh with CSRF protection
 *
 * Usage:
 * - Import from '@/lib/auth' in your components
 * - Use getAccessToken() to get the current access token for API calls
 * - The auth store handles token management automatically
 */

export {
  // Token management
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  hasValidToken,
  getTokenExpiration,

  // Token refresh
  refreshAccessToken,
  isTokenRefreshing,
  subscribeToTokenRefresh,

  // Session management
  performLogout,
  initializeAuth,

  // Migration helper
  migrateFromLocalStorage,

  // Event system
  onAuthEvent,
} from './secureTokenManager';
