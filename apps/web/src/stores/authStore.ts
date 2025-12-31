import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';
import type { User, LoginCredentials, RegisterData, AuthResponse, MfaRequiredResponse } from '@/types/auth';
import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  refreshAccessToken,
  performLogout,
  initializeAuth,
  migrateFromLocalStorage,
  onAuthEvent,
} from '@/lib/auth/secureTokenManager';

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

// Helper to extract error message from API response
function extractErrorMessage(data: ApiErrorResponse | undefined, fallback: string): string {
  if (!data?.message) return fallback;
  if (Array.isArray(data.message)) {
    return data.message.join('. ');
  }
  return data.message;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaTempToken: string | null;

  login: (credentials: LoginCredentials) => Promise<{ requiresMfa: boolean; tempToken?: string }>;
  verifyMfaLogin: (tempToken: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
  resetMfaState: () => void;
  setUser: (user: User) => void;
  initializeAuth: () => Promise<void>;

  // Internal method to get access token (for API client)
  getAccessToken: () => string | null;
}

// API Base URL - Backend handles routing internally (no /api/v1 needed)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with credentials for httpOnly cookies
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: enables httpOnly cookie handling
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaRequired: false,
      mfaTempToken: null,

      getAccessToken: () => getAccessToken(),

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, mfaRequired: false, mfaTempToken: null });
        try {
          const response = await authAxios.post<{ data: AuthResponse | MfaRequiredResponse }>(
            '/auth/login',
            credentials
          );

          // Backend wraps response in 'data' object
          const data = response.data.data;

          // Check if MFA is required
          if ('requiresMfa' in data && data.requiresMfa) {
            set({
              mfaRequired: true,
              mfaTempToken: data.tempToken,
              isLoading: false,
            });
            return { requiresMfa: true, tempToken: data.tempToken };
          }

          // Regular login success
          const { user, accessToken, expiresIn } = data as AuthResponse & { expiresIn?: number };

          // Store access token in memory only (secure)
          // Refresh token is stored in httpOnly cookie by the server
          setAccessToken(accessToken, expiresIn || 3600);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mfaRequired: false,
            mfaTempToken: null,
          });

          return { requiresMfa: false };
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorMessage = extractErrorMessage(axiosError.response?.data, 'Login failed. Please try again.');
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            mfaRequired: false,
            mfaTempToken: null,
          });
          throw new Error(errorMessage);
        }
      },

      verifyMfaLogin: async (tempToken: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAxios.post<AuthResponse & { expiresIn?: number }>(
            '/auth/mfa/login',
            { tempToken, code }
          );

          const { user, accessToken, expiresIn } = response.data;

          // Store access token in memory only (secure)
          setAccessToken(accessToken, expiresIn || 3600);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mfaRequired: false,
            mfaTempToken: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorMessage = extractErrorMessage(axiosError.response?.data, 'Invalid verification code. Please try again.');
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          // Split fullName into firstName and lastName for the API
          const nameParts = data.fullName.trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const response = await authAxios.post<{ data: AuthResponse & { expiresIn?: number } }>(
            '/auth/register',
            {
              firstName,
              lastName,
              email: data.email,
              password: data.password,
            }
          );

          // Backend wraps response in 'data' object
          const { user, accessToken, expiresIn } = response.data.data;

          // Store access token in memory only (secure)
          setAccessToken(accessToken, expiresIn || 3600);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorMessage = extractErrorMessage(axiosError.response?.data, 'Registration failed. Please try again.');
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        // Clear tokens securely (memory + server httpOnly cookie)
        await performLogout(API_BASE_URL);

        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        try {
          const newToken = await refreshAccessToken(API_BASE_URL);

          if (!newToken) {
            // Refresh failed, logout user
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
          }
        } catch (error) {
          // Refresh failed, logout user
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        const token = getAccessToken();

        if (!token) {
          // Try to refresh token using httpOnly cookie
          try {
            const newToken = await refreshAccessToken(API_BASE_URL);
            if (!newToken) {
              set({ isLoading: false, isAuthenticated: false });
              return;
            }
          } catch {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }
        }

        set({ isLoading: true });

        try {
          const currentToken = getAccessToken();
          const response = await authAxios.get<{ user: User }>('/auth/me', {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          });

          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Try to refresh token
          try {
            const newToken = await refreshAccessToken(API_BASE_URL);
            if (newToken) {
              await get().checkAuth();
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } catch (refreshError) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      },

      initializeAuth: async () => {
        // Migrate from localStorage on first load (security upgrade)
        migrateFromLocalStorage();

        set({ isLoading: true });

        try {
          // Try to initialize auth using httpOnly refresh token cookie
          const success = await initializeAuth(API_BASE_URL);

          if (success) {
            // Token refreshed successfully, now get user data
            await get().checkAuth();
          } else {
            set({ isLoading: false, isAuthenticated: false });
          }
        } catch {
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      resetMfaState: () => {
        set({ mfaRequired: false, mfaTempToken: null, error: null });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Custom storage that only persists user data, NOT tokens
        return {
          getItem: (name: string) => {
            if (typeof window === 'undefined') return null;
            const item = localStorage.getItem(name);
            return item;
          },
          setItem: (name: string, value: string) => {
            if (typeof window === 'undefined') return;
            localStorage.setItem(name, value);
          },
          removeItem: (name: string) => {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(name);
          },
        };
      }),
      // Only persist user data and auth state, NOT tokens
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Note: accessToken and refreshToken are intentionally NOT persisted
        // Access token is in memory, refresh token is in httpOnly cookie
      }),
    }
  )
);

// Subscribe to session expired events to handle global logout
if (typeof window !== 'undefined') {
  onAuthEvent('sessionExpired', () => {
    const store = useAuthStore.getState();
    store.logout();
  });
}
