import { apiClient, handleApiError } from './client';
import type {
  UserProfile,
  UpdateProfileData,
  UpdatePreferencesData,
  UserPreferences,
  Subscription,
  SubscriptionPlanDetails,
  UploadPhotoResponse,
  CheckoutSession,
  ActivityLog,
} from '@/types/user';

export const userApi = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get<UserProfile>('/user/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    try {
      const response = await apiClient.patch<UserProfile>('/user/profile', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload profile photo
   */
  uploadPhoto: async (file: File): Promise<UploadPhotoResponse> => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await apiClient.post<UploadPhotoResponse>('/user/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete profile photo
   */
  deletePhoto: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>('/user/profile/photo');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user preferences
   */
  getPreferences: async (): Promise<UserPreferences> => {
    try {
      const response = await apiClient.get<UserPreferences>('/user/preferences');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (data: UpdatePreferencesData): Promise<UserPreferences> => {
    try {
      const response = await apiClient.patch<UserPreferences>('/user/preferences', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get subscription
   */
  getSubscription: async (): Promise<Subscription> => {
    try {
      const response = await apiClient.get<Subscription>('/user/subscription');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans: async (): Promise<SubscriptionPlanDetails[]> => {
    try {
      const response = await apiClient.get<SubscriptionPlanDetails[]>('/user/subscription/plans');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create checkout session for subscription
   */
  createCheckoutSession: async (
    plan: string,
    interval?: 'month' | 'year'
  ): Promise<CheckoutSession> => {
    try {
      const response = await apiClient.post<CheckoutSession>('/user/subscription/checkout', {
        plan,
        interval,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (
    reason?: string,
    feedback?: string
  ): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/user/subscription/cancel', {
        reason,
        feedback,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Resume subscription
   */
  resumeSubscription: async (): Promise<Subscription> => {
    try {
      const response = await apiClient.post<Subscription>('/user/subscription/resume');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update payment method
   */
  updatePaymentMethod: async (): Promise<{ url: string }> => {
    try {
      const response = await apiClient.post<{ url: string }>('/user/subscription/payment-method');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get activity logs
   */
  getActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ logs: ActivityLog[]; total: number; page: number; limit: number }> => {
    try {
      const response = await apiClient.get<{
        logs: ActivityLog[];
        total: number;
        page: number;
        limit: number;
      }>('/user/activity', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Change password
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/user/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete account
   */
  deleteAccount: async (password: string, reason?: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/user/delete-account', {
        password,
        reason,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Export user data
   */
  exportData: async (): Promise<Blob> => {
    try {
      const response = await apiClient.get('/user/export-data', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<{
    totalResumes: number;
    jobsSaved: number;
    applicationsSent: number;
    responseRate: number;
    recentApplications: Array<{
      id: string;
      jobTitle: string;
      company: string;
      status: string;
      appliedAt: string;
    }>;
    recommendedJobs: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      salary?: string;
    }>;
  }> => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
