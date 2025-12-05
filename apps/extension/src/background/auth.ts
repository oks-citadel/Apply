/**
 * Authentication Manager
 * Handles user authentication and token management
 */

import { Storage } from '@shared/storage';
import { AuthState, User, STORAGE_KEYS } from '@shared/types';
import { API_BASE_URL, API_ENDPOINTS } from '@shared/types';

export class AuthManager {
  private authState: AuthState | null = null;

  constructor() {
    this.loadAuthState();
  }

  /**
   * Load authentication state from storage
   */
  private async loadAuthState(): Promise<void> {
    try {
      this.authState = await Storage.get<AuthState>(STORAGE_KEYS.AUTH_STATE);
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.authState = { isAuthenticated: false };
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthState> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();

      const authState: AuthState = {
        isAuthenticated: true,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };

      await this.saveAuthState(authState);
      return authState;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.authState?.token) {
        // Call logout endpoint
        await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authState.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      await this.clearAuthState();
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<AuthState> {
    if (!this.authState) {
      await this.loadAuthState();
    }

    if (!this.authState?.isAuthenticated) {
      return { isAuthenticated: false };
    }

    // Check if token is expired
    if (this.authState.expiresAt && Date.now() >= this.authState.expiresAt) {
      try {
        return await this.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        await this.clearAuthState();
        return { isAuthenticated: false };
      }
    }

    return this.authState;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthState> {
    if (!this.authState?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.authState.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      const authState: AuthState = {
        isAuthenticated: true,
        token: data.accessToken,
        refreshToken: data.refreshToken || this.authState.refreshToken,
        user: this.authState.user,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };

      await this.saveAuthState(authState);
      return authState;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Refresh token if needed (within 5 minutes of expiration)
   */
  async refreshTokenIfNeeded(): Promise<void> {
    if (!this.authState?.isAuthenticated || !this.authState.expiresAt) {
      return;
    }

    const fiveMinutes = 5 * 60 * 1000;
    const timeUntilExpiry = this.authState.expiresAt - Date.now();

    if (timeUntilExpiry < fiveMinutes) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
      }
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const authState = await this.checkAuth();
    return authState.user || null;
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    const authState = await this.checkAuth();
    return authState.token || null;
  }

  /**
   * Validate token with backend
   */
  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await this.clearAuthState();
        return false;
      }

      const user = await response.json();

      // Update user data
      if (this.authState) {
        this.authState.user = user;
        await this.saveAuthState(this.authState);
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Save authentication state
   */
  private async saveAuthState(authState: AuthState): Promise<void> {
    this.authState = authState;
    await Storage.set(STORAGE_KEYS.AUTH_STATE, authState);
  }

  /**
   * Clear authentication state
   */
  private async clearAuthState(): Promise<void> {
    this.authState = { isAuthenticated: false };
    await Storage.remove(STORAGE_KEYS.AUTH_STATE);

    // Clear other cached data
    await Storage.remove(STORAGE_KEYS.CACHED_RESUMES);
    await Storage.remove(STORAGE_KEYS.STATS);
  }

  /**
   * Check if user is authenticated (sync)
   */
  isAuthenticated(): boolean {
    return this.authState?.isAuthenticated || false;
  }
}
