import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import type { User, LoginCredentials, RegisterData, AuthResponse, MfaRequiredResponse } from '@/types/auth';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  mfaRequired: boolean;
  mfaTempToken: string | null;

  login: (credentials: LoginCredentials) => Promise<{ requiresMfa: boolean; tempToken?: string }>;
  verifyMfaLogin: (tempToken: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
  resetMfaState: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessToken: null,
      refreshToken: null,
      mfaRequired: false,
      mfaTempToken: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, mfaRequired: false, mfaTempToken: null });
        try {
          const response = await axios.post<AuthResponse | MfaRequiredResponse>(
            `${API_BASE_URL}/auth/login`,
            credentials
          );

          const data = response.data;

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
          const { user, accessToken, refreshToken } = data as AuthResponse;

          set({
            user,
            isAuthenticated: true,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
            mfaRequired: false,
            mfaTempToken: null,
          });

          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          return { requiresMfa: false };
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
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
          const response = await axios.post<AuthResponse>(
            `${API_BASE_URL}/auth/mfa/login`,
            { tempToken, code }
          );

          const { user, accessToken, refreshToken } = response.data;

          set({
            user,
            isAuthenticated: true,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
            mfaRequired: false,
            mfaTempToken: null,
          });

          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Invalid verification code. Please try again.';
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
          const response = await axios.post<AuthResponse>(
            `${API_BASE_URL}/auth/register`,
            {
              fullName: data.fullName,
              email: data.email,
              password: data.password,
            }
          );

          const { user, accessToken, refreshToken } = response.data;

          set({
            user,
            isAuthenticated: true,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
          });

          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        // Clear axios authorization header
        delete axios.defaults.headers.common['Authorization'];

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await axios.post<{ accessToken: string }>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken } = response.data;

          set({ accessToken });
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error) {
          get().logout();
        }
      },

      checkAuth: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        try {
          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          const response = await axios.get<{ user: User }>(
            `${API_BASE_URL}/auth/me`
          );

          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Try to refresh token
          try {
            await get().refreshAccessToken();
            await get().checkAuth();
          } catch (refreshError) {
            get().logout();
            set({ isLoading: false });
          }
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
