import { apiClient, handleApiError } from './client';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';
import type { MfaSetup, MfaVerification } from '@/types/user';

export const authApi = {
  /**
   * Login user with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Register new user
   */
  register: async (data: Omit<RegisterData, 'confirmPassword' | 'acceptTerms'>): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    try {
      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<{ user: User }> => {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', {
        email,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
        token,
        password,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/verify-email', {
        token,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Resend verification email
   */
  resendVerification: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/resend-verification');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Setup MFA (Multi-Factor Authentication)
   */
  setupMfa: async (): Promise<MfaSetup> => {
    try {
      const response = await apiClient.post<MfaSetup>('/auth/mfa/setup');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Verify MFA code and enable MFA
   */
  verifyMfa: async (code: string): Promise<{ message: string; backupCodes: string[] }> => {
    try {
      const response = await apiClient.post<{ message: string; backupCodes: string[] }>(
        '/auth/mfa/verify',
        { code }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Disable MFA
   */
  disableMfa: async (code: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/mfa/disable', {
        code,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Generate new MFA backup codes
   */
  regenerateBackupCodes: async (code: string): Promise<{ backupCodes: string[] }> => {
    try {
      const response = await apiClient.post<{ backupCodes: string[] }>(
        '/auth/mfa/backup-codes',
        { code }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
