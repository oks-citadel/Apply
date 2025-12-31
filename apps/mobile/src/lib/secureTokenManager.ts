/**
 * Secure Token Manager for React Native
 *
 * This module provides secure token storage using:
 * 1. react-native-keychain for secure storage (encrypted by OS)
 * 2. In-memory storage for access tokens during app session
 *
 * Security benefits:
 * - Tokens stored in OS-level secure enclave/keychain
 * - Not accessible to other apps
 * - Encrypted at rest
 * - Cleared on device wipe
 *
 * Note: This uses react-native-keychain which stores credentials
 * in the iOS Keychain or Android Keystore.
 */

import * as Keychain from 'react-native-keychain';

// Service identifiers for keychain storage
const SERVICE_NAME = 'com.applyforus.auth';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

// In-memory storage for access token (not persisted)
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

// Token refresh state management
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

// Event emitter for auth state changes
type AuthEventType = 'tokenRefreshed' | 'tokenCleared' | 'sessionExpired';
type AuthEventCallback = (data?: unknown) => void;
const eventListeners = new Map<AuthEventType, Set<AuthEventCallback>>();

/**
 * Subscribe to auth events
 */
export function onAuthEvent(event: AuthEventType, callback: AuthEventCallback): () => void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);

  return () => {
    eventListeners.get(event)?.delete(callback);
  };
}

/**
 * Emit auth event
 */
function emitAuthEvent(event: AuthEventType, data?: unknown): void {
  eventListeners.get(event)?.forEach((callback) => callback(data));
}

// ==================== Access Token (Memory Only) ====================

/**
 * Set the access token in memory
 */
export function setAccessToken(token: string | null, expiresInSeconds?: number): void {
  accessToken = token;

  if (token && expiresInSeconds) {
    // Set expiration with a small buffer (30 seconds before actual expiry)
    tokenExpiresAt = Date.now() + (expiresInSeconds - 30) * 1000;
  } else {
    tokenExpiresAt = null;
  }

  if (token) {
    emitAuthEvent('tokenRefreshed', { token });
  }
}

/**
 * Get the current access token
 * Returns null if token is expired or not set
 */
export function getAccessToken(): string | null {
  if (tokenExpiresAt && Date.now() > tokenExpiresAt) {
    accessToken = null;
    tokenExpiresAt = null;
    return null;
  }
  return accessToken;
}

/**
 * Check if we have a valid access token
 */
export function hasValidToken(): boolean {
  return getAccessToken() !== null;
}

/**
 * Clear the access token from memory
 */
export function clearAccessToken(): void {
  accessToken = null;
  tokenExpiresAt = null;
  emitAuthEvent('tokenCleared');
}

// ==================== Refresh Token (Secure Storage) ====================

/**
 * Store refresh token securely in keychain
 */
export async function setRefreshToken(token: string): Promise<void> {
  try {
    await Keychain.setGenericPassword(REFRESH_TOKEN_KEY, token, {
      service: SERVICE_NAME,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error('Failed to store refresh token:', error);
    throw error;
  }
}

/**
 * Get refresh token from secure storage
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
    });

    if (credentials && credentials.password) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Clear refresh token from secure storage
 */
export async function clearRefreshToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({
      service: SERVICE_NAME,
    });
  } catch (error) {
    console.error('Failed to clear refresh token:', error);
  }
}

// ==================== User Data (Secure Storage) ====================

/**
 * Store user data securely
 */
export async function setUserData(userData: Record<string, unknown>): Promise<void> {
  try {
    const userDataService = `${SERVICE_NAME}.${USER_DATA_KEY}`;
    await Keychain.setGenericPassword(USER_DATA_KEY, JSON.stringify(userData), {
      service: userDataService,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error('Failed to store user data:', error);
    throw error;
  }
}

/**
 * Get user data from secure storage
 */
export async function getUserData<T = Record<string, unknown>>(): Promise<T | null> {
  try {
    const userDataService = `${SERVICE_NAME}.${USER_DATA_KEY}`;
    const credentials = await Keychain.getGenericPassword({
      service: userDataService,
    });

    if (credentials && credentials.password) {
      return JSON.parse(credentials.password) as T;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

/**
 * Clear user data from secure storage
 */
export async function clearUserData(): Promise<void> {
  try {
    const userDataService = `${SERVICE_NAME}.${USER_DATA_KEY}`;
    await Keychain.resetGenericPassword({
      service: userDataService,
    });
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
}

// ==================== Token Refresh ====================

/**
 * Subscribe to token refresh completion
 */
export function subscribeToTokenRefresh(callback: (token: string | null) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function notifyTokenRefreshSubscribers(token: string | null): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Check if token refresh is in progress
 */
export function isTokenRefreshing(): boolean {
  return isRefreshing;
}

/**
 * Refresh the access token using stored refresh token
 */
export async function refreshAccessToken(apiBaseUrl: string): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeToTokenRefresh(resolve);
    });
  }

  isRefreshing = true;

  try {
    const refreshTokenValue = await getRefreshToken();

    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newAccessToken = data.accessToken || data.data?.accessToken;
    const newRefreshToken = data.refreshToken || data.data?.refreshToken;
    const expiresIn = data.expiresIn || data.data?.expiresIn || 3600;

    if (newAccessToken) {
      setAccessToken(newAccessToken, expiresIn);

      // If server rotated refresh token, update it
      if (newRefreshToken) {
        await setRefreshToken(newRefreshToken);
      }

      notifyTokenRefreshSubscribers(newAccessToken);
      return newAccessToken;
    }

    throw new Error('No access token in response');
  } catch (error) {
    clearAccessToken();
    notifyTokenRefreshSubscribers(null);
    emitAuthEvent('sessionExpired');
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ==================== Session Management ====================

/**
 * Store all auth data securely
 */
export async function storeAuthData(
  newAccessToken: string,
  newRefreshToken: string,
  userData: Record<string, unknown>,
  expiresIn?: number
): Promise<void> {
  // Access token in memory
  setAccessToken(newAccessToken, expiresIn || 3600);

  // Refresh token and user data in secure storage
  await Promise.all([
    setRefreshToken(newRefreshToken),
    setUserData(userData),
  ]);
}

/**
 * Clear all auth data
 */
export async function clearAllAuthData(): Promise<void> {
  clearAccessToken();
  await Promise.all([
    clearRefreshToken(),
    clearUserData(),
  ]);
}

/**
 * Perform logout
 */
export async function performLogout(apiBaseUrl: string): Promise<void> {
  try {
    const refreshTokenValue = await getRefreshToken();

    if (refreshTokenValue) {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
    }
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    await clearAllAuthData();
  }
}

/**
 * Initialize auth state on app load
 */
export async function initializeAuth(apiBaseUrl: string): Promise<boolean> {
  try {
    const refreshTokenValue = await getRefreshToken();

    if (!refreshTokenValue) {
      return false;
    }

    const token = await refreshAccessToken(apiBaseUrl);
    return token !== null;
  } catch {
    return false;
  }
}

/**
 * Migration helper: Clear any tokens from AsyncStorage
 */
export async function migrateFromAsyncStorage(): Promise<void> {
  try {
    // Dynamic import to avoid bundling if not needed
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    const keysToRemove = [
      '@applyforus/access_token',
      '@applyforus/refresh_token',
      '@applyforus/user',
    ];

    await AsyncStorage.multiRemove(keysToRemove);
    console.info('[Security] Migrated from AsyncStorage to secure keychain storage');
  } catch (error) {
    // AsyncStorage might not exist or keys might not exist
    console.info('[Security] No AsyncStorage data to migrate');
  }
}
