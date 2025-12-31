import { create } from 'zustand';
import { AxiosError } from 'axios';
import { User } from '../types';
import { authApi } from '../services/api';
import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearRefreshToken,
  setUserData,
  getUserData,
  clearUserData,
  storeAuthData,
  clearAllAuthData,
  refreshAccessToken,
  performLogout,
  initializeAuth,
  migrateFromAsyncStorage,
  onAuthEvent,
} from '../lib/secureTokenManager';

// Type for API error responses
interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

// Type for auth response data
interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'linkedin' | 'github', token: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  loadAuthState: () => Promise<void>;
  clearError: () => void;

  // Internal method for API client
  getAccessToken: () => string | null;
}

// Base API URL
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_URL) || 'http://localhost:3000/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  getAccessToken: () => getAccessToken(),

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.login({ email, password });
      const { user, accessToken, refreshToken, expiresIn } = response.data as AuthResponseData;

      // Store tokens securely
      await storeAuthData(accessToken, refreshToken, user as Record<string, unknown>, expiresIn);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loginWithOAuth: async (provider: 'google' | 'linkedin' | 'github', token: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.loginWithOAuth(provider, token);
      const { user, accessToken, refreshToken, expiresIn } = response.data as AuthResponseData;

      // Store tokens securely
      await storeAuthData(accessToken, refreshToken, user as Record<string, unknown>, expiresIn);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'OAuth login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Perform secure logout
      await performLogout(API_BASE_URL);

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      await clearAllAuthData();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.register(data);
      const { user, accessToken, refreshToken, expiresIn } = response.data as AuthResponseData;

      // Store tokens securely
      await storeAuthData(accessToken, refreshToken, user as Record<string, unknown>, expiresIn);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  refreshAccessToken: async () => {
    try {
      const newToken = await refreshAccessToken(API_BASE_URL);

      if (!newToken) {
        // If refresh fails, logout the user
        await get().logout();
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await get().logout();
      throw error;
    }
  },

  loadAuthState: async () => {
    try {
      set({ isLoading: true });

      // Migrate from insecure AsyncStorage on first load
      await migrateFromAsyncStorage();

      // Try to initialize auth using securely stored refresh token
      const success = await initializeAuth(API_BASE_URL);

      if (success) {
        // Load user data from secure storage
        const user = await getUserData<User>();

        if (user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to load auth state:', error);
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// Subscribe to session expired events
onAuthEvent('sessionExpired', () => {
  const store = useAuthStore.getState();
  store.logout();
});
