/**
 * Secure Token Manager
 *
 * This module provides secure token storage that mitigates XSS attacks:
 *
 * 1. Access tokens are stored in memory only (not localStorage)
 *    - Cleared on page refresh, but can be silently refreshed via httpOnly cookie
 *    - Not accessible to XSS attacks that can read localStorage/sessionStorage
 *
 * 2. Refresh tokens are stored in httpOnly cookies (set by the server)
 *    - Not accessible to JavaScript at all
 *    - Automatically sent with requests via credentials: 'include'
 *
 * 3. CSRF protection via SameSite cookie attribute
 */

// In-memory token storage (not persisted, not accessible to XSS)
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

  // Return unsubscribe function
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

/**
 * Set the access token in memory
 * @param token - The access token to store
 * @param expiresInSeconds - Optional expiration time in seconds
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
  // Check if token is expired
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

/**
 * Get token expiration status
 */
export function getTokenExpiration(): { isExpired: boolean; expiresIn: number | null } {
  if (!tokenExpiresAt) {
    return { isExpired: !accessToken, expiresIn: null };
  }

  const expiresIn = tokenExpiresAt - Date.now();
  return {
    isExpired: expiresIn <= 0,
    expiresIn: expiresIn > 0 ? Math.floor(expiresIn / 1000) : null,
  };
}

/**
 * Subscribe to token refresh completion
 * Used to queue requests while token is being refreshed
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
 * Refresh the access token using the httpOnly refresh token cookie
 *
 * This makes a request to the /auth/refresh endpoint.
 * The server will:
 * 1. Read the refresh token from the httpOnly cookie
 * 2. Validate it and generate a new access token
 * 3. Return the new access token in the response body
 * 4. Optionally rotate the refresh token (set new httpOnly cookie)
 *
 * @param apiBaseUrl - The base URL of the API
 * @returns The new access token or null if refresh failed
 */
export async function refreshAccessToken(apiBaseUrl: string): Promise<string | null> {
  // If already refreshing, wait for the result
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeToTokenRefresh(resolve);
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Important: sends httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newToken = data.accessToken || data.data?.accessToken;
    const expiresIn = data.expiresIn || data.data?.expiresIn || 3600; // Default 1 hour

    if (newToken) {
      setAccessToken(newToken, expiresIn);
      notifyTokenRefreshSubscribers(newToken);
      return newToken;
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

/**
 * Perform logout - clear memory token and call server to clear cookies
 */
export async function performLogout(apiBaseUrl: string): Promise<void> {
  try {
    // Call server to clear httpOnly cookies
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
  } catch (error) {
    // Log error but continue with client-side cleanup
    console.error('Logout request failed:', error);
  } finally {
    // Always clear client-side token
    clearAccessToken();
  }
}

/**
 * Initialize auth state on app load
 * Attempts to refresh the token using the httpOnly cookie
 */
export async function initializeAuth(apiBaseUrl: string): Promise<boolean> {
  try {
    const token = await refreshAccessToken(apiBaseUrl);
    return token !== null;
  } catch {
    return false;
  }
}

/**
 * Migration helper: Clear any tokens from localStorage
 * Call this once during migration to clean up old insecure storage
 */
export function migrateFromLocalStorage(): void {
  if (typeof window === 'undefined') return;

  // List of known localStorage keys that may contain tokens
  const tokenKeys = [
    'accessToken',
    'refreshToken',
    'auth_token',
    'auth-storage', // Zustand persist key
  ];

  tokenKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors (e.g., in private browsing mode)
    }
  });

  console.info('[Security] Migrated from localStorage to secure token storage');
}
