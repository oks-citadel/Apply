import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import type { UpdateProfileData, UpdatePreferencesData } from '@/types/user';
import { useToast } from './useToast';
import { useAuthStore } from '@/stores/authStore';

// Query keys
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  preferences: () => [...userKeys.all, 'preferences'] as const,
  subscription: () => [...userKeys.all, 'subscription'] as const,
  subscriptionPlans: () => [...userKeys.subscription(), 'plans'] as const,
  activityLogs: (params?: any) => [...userKeys.all, 'activity', params] as const,
  dashboardStats: () => [...userKeys.all, 'dashboard-stats'] as const,
};

/**
 * Get user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userApi.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      // Update cache
      queryClient.setQueryData(userKeys.profile(), updatedProfile);

      // Update auth store
      updateUser({
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        bio: updatedProfile.bio,
        avatarUrl: updatedProfile.avatarUrl,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update profile',
        description: error.message || 'An error occurred while updating your profile.',
        variant: 'error',
      });
    },
  });
}

/**
 * Upload profile photo
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (file: File) => userApi.uploadPhoto(file),
    onSuccess: (data) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      // Update auth store
      updateUser({ avatarUrl: data.avatarUrl });

      toast({
        title: 'Photo uploaded',
        description: 'Your profile photo has been updated.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred while uploading your photo.',
        variant: 'error',
      });
    },
  });
}

/**
 * Delete profile photo
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: () => userApi.deletePhoto(),
    onSuccess: () => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      // Update auth store
      updateUser({ avatarUrl: undefined });

      toast({
        title: 'Photo deleted',
        description: 'Your profile photo has been removed.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get user preferences
 */
export function usePreferences() {
  return useQuery({
    queryKey: userKeys.preferences(),
    queryFn: () => userApi.getPreferences(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdatePreferencesData) => userApi.updatePreferences(data),
    onSuccess: (updatedPreferences) => {
      // Update cache
      queryClient.setQueryData(userKeys.preferences(), updatedPreferences);

      toast({
        title: 'Preferences updated',
        description: 'Your preferences have been saved.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update preferences',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get subscription
 */
export function useSubscription() {
  return useQuery({
    queryKey: userKeys.subscription(),
    queryFn: () => userApi.getSubscription(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get subscription plans
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: userKeys.subscriptionPlans(),
    queryFn: () => userApi.getSubscriptionPlans(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Create checkout session
 */
export function useCreateCheckoutSession() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ plan, interval }: { plan: string; interval?: 'month' | 'year' }) =>
      userApi.createCheckoutSession(plan, interval),
    onSuccess: (data) => {
      // Redirect to checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: 'Checkout failed',
        description: error.message || 'An error occurred while creating checkout session.',
        variant: 'error',
      });
    },
  });
}

/**
 * Cancel subscription
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reason, feedback }: { reason?: string; feedback?: string }) =>
      userApi.cancelSubscription(reason, feedback),
    onSuccess: () => {
      // Invalidate subscription
      queryClient.invalidateQueries({ queryKey: userKeys.subscription() });

      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled. You will have access until the end of the billing period.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to cancel subscription',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Resume subscription
 */
export function useResumeSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => userApi.resumeSubscription(),
    onSuccess: (subscription) => {
      // Update cache
      queryClient.setQueryData(userKeys.subscription(), subscription);

      toast({
        title: 'Subscription resumed',
        description: 'Your subscription has been reactivated.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to resume subscription',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Update payment method
 */
export function useUpdatePaymentMethod() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => userApi.updatePaymentMethod(),
    onSuccess: (data) => {
      // Redirect to Stripe portal
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update payment method',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get activity logs
 */
export function useActivityLogs(params?: {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: userKeys.activityLogs(params),
    queryFn: () => userApi.getActivityLogs(params),
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
}

/**
 * Change password
 */
export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to change password',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Delete account
 */
export function useDeleteAccount() {
  const { toast } = useToast();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: ({ password, reason }: { password: string; reason?: string }) =>
      userApi.deleteAccount(password, reason),
    onSuccess: () => {
      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted successfully.',
        variant: 'success',
      });

      // Logout and redirect
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete account',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Export user data
 */
export function useExportData() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => userApi.exportData(),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Data exported',
        description: 'Your data has been exported successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred while exporting your data.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: userKeys.dashboardStats(),
    queryFn: () => userApi.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
