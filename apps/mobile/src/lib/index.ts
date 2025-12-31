/**
 * Library utilities for the mobile app
 *
 * Exports secure authentication utilities that protect against token theft.
 */

export {
  // Token management
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  hasValidToken,

  // Secure storage (keychain)
  setRefreshToken,
  getRefreshToken,
  clearRefreshToken,
  setUserData,
  getUserData,
  clearUserData,

  // Session management
  storeAuthData,
  clearAllAuthData,
  performLogout,
  initializeAuth,

  // Token refresh
  refreshAccessToken,
  isTokenRefreshing,
  subscribeToTokenRefresh,

  // Migration helper
  migrateFromAsyncStorage,

  // Event system
  onAuthEvent,
} from './secureTokenManager';
