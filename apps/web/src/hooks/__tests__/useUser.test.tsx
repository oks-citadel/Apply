import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useProfile,
  useUpdateProfile,
  useUploadPhoto,
  useDeletePhoto,
  usePreferences,
  useUpdatePreferences,
  useSubscription,
  useSubscriptionPlans,
  useCreateCheckoutSession,
  useCancelSubscription,
  useResumeSubscription,
  useUpdatePaymentMethod,
  useActivityLogs,
  useChangePassword,
  useDeleteAccount,
  useExportData,
  useDashboardStats,
} from '../useUser';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// Mock the API
jest.mock('@/lib/api', () => ({
  userApi: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadPhoto: jest.fn(),
    deletePhoto: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    getSubscription: jest.fn(),
    getSubscriptionPlans: jest.fn(),
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
    resumeSubscription: jest.fn(),
    updatePaymentMethod: jest.fn(),
    getActivityLogs: jest.fn(),
    changePassword: jest.fn(),
    deleteAccount: jest.fn(),
    exportData: jest.fn(),
    getDashboardStats: jest.fn(),
  },
}));

// Mock useToast
jest.mock('../useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock authStore
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      updateUser: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('useProfile', () => {
    it('should fetch profile successfully', async () => {
      const mockProfile = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '1234567890',
      };

      (userApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfile);
      expect(userApi.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch profile');
      (userApi.getProfile as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateProfile', () => {
    it('should update profile successfully', async () => {
      const updatedProfile = {
        id: '1',
        email: 'updated@example.com',
        fullName: 'Updated User',
      };

      const mockUpdateUser = jest.fn();
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        updateUser: mockUpdateUser,
      });

      (userApi.updateProfile as jest.Mock).mockResolvedValue(updatedProfile);

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ fullName: 'Updated User' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.updateProfile).toHaveBeenCalledWith({
        fullName: 'Updated User',
      });
      expect(mockUpdateUser).toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      (userApi.updateProfile as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ fullName: 'New Name' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUploadPhoto', () => {
    it('should upload photo successfully', async () => {
      const mockData = { avatarUrl: 'https://example.com/avatar.jpg' };
      const mockUpdateUser = jest.fn();

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        updateUser: mockUpdateUser,
      });

      (userApi.uploadPhoto as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useUploadPhoto(), {
        wrapper: createWrapper(),
      });

      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      result.current.mutate(file);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.uploadPhoto).toHaveBeenCalledWith(file);
      expect(mockUpdateUser).toHaveBeenCalledWith({ avatarUrl: mockData.avatarUrl });
    });
  });

  describe('useDeletePhoto', () => {
    it('should delete photo successfully', async () => {
      const mockUpdateUser = jest.fn();

      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        updateUser: mockUpdateUser,
      });

      (userApi.deletePhoto as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeletePhoto(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.deletePhoto).toHaveBeenCalled();
      expect(mockUpdateUser).toHaveBeenCalledWith({ avatarUrl: undefined });
    });
  });

  describe('usePreferences', () => {
    it('should fetch preferences successfully', async () => {
      const mockPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        theme: 'light',
      };

      (userApi.getPreferences as jest.Mock).mockResolvedValue(mockPreferences);

      const { result } = renderHook(() => usePreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPreferences);
    });
  });

  describe('useUpdatePreferences', () => {
    it('should update preferences successfully', async () => {
      const updatedPreferences = { emailNotifications: false };

      (userApi.updatePreferences as jest.Mock).mockResolvedValue(
        updatedPreferences
      );

      const { result } = renderHook(() => useUpdatePreferences(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ emailNotifications: false });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.updatePreferences).toHaveBeenCalledWith({
        emailNotifications: false,
      });
    });
  });

  describe('useSubscription', () => {
    it('should fetch subscription successfully', async () => {
      const mockSubscription = {
        plan: 'premium',
        status: 'active',
        currentPeriodEnd: '2024-12-31',
      };

      (userApi.getSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSubscription);
    });
  });

  describe('useSubscriptionPlans', () => {
    it('should fetch subscription plans successfully', async () => {
      const mockPlans = [
        { id: 'free', name: 'Free', price: 0 },
        { id: 'premium', name: 'Premium', price: 29 },
      ];

      (userApi.getSubscriptionPlans as jest.Mock).mockResolvedValue(mockPlans);

      const { result } = renderHook(() => useSubscriptionPlans(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPlans);
    });
  });

  describe('useCreateCheckoutSession', () => {
    it('should create checkout session and redirect', async () => {
      const mockSession = { url: 'https://checkout.stripe.com/session' };
      (userApi.createCheckoutSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      const { result } = renderHook(() => useCreateCheckoutSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ plan: 'premium', interval: 'month' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.createCheckoutSession).toHaveBeenCalledWith(
        'premium',
        'month'
      );
      expect(window.location.href).toBe(mockSession.url);
    });
  });

  describe('useCancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      (userApi.cancelSubscription as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useCancelSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ reason: 'too expensive', feedback: 'Good service' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.cancelSubscription).toHaveBeenCalledWith(
        'too expensive',
        'Good service'
      );
    });
  });

  describe('useResumeSubscription', () => {
    it('should resume subscription successfully', async () => {
      const mockSubscription = { plan: 'premium', status: 'active' };
      (userApi.resumeSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const { result } = renderHook(() => useResumeSubscription(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.resumeSubscription).toHaveBeenCalled();
    });
  });

  describe('useUpdatePaymentMethod', () => {
    it('should update payment method and redirect', async () => {
      const mockData = { url: 'https://billing.stripe.com/portal' };
      (userApi.updatePaymentMethod as jest.Mock).mockResolvedValue(mockData);

      delete (window as any).location;
      window.location = { href: '' } as any;

      const { result } = renderHook(() => useUpdatePaymentMethod(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(window.location.href).toBe(mockData.url);
    });
  });

  describe('useActivityLogs', () => {
    it('should fetch activity logs successfully', async () => {
      const mockLogs = {
        data: [
          { id: '1', action: 'login', timestamp: '2024-01-01' },
          { id: '2', action: 'update_profile', timestamp: '2024-01-02' },
        ],
        meta: { page: 1, totalPages: 1 },
      };

      (userApi.getActivityLogs as jest.Mock).mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useActivityLogs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockLogs);
    });

    it('should fetch activity logs with params', async () => {
      const params = { page: 2, limit: 20 };
      const mockLogs = { data: [], meta: { page: 2, totalPages: 1 } };

      (userApi.getActivityLogs as jest.Mock).mockResolvedValue(mockLogs);

      const { result } = renderHook(() => useActivityLogs(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.getActivityLogs).toHaveBeenCalledWith(params);
    });
  });

  describe('useChangePassword', () => {
    it('should change password successfully', async () => {
      (userApi.changePassword as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        currentPassword: 'old123',
        newPassword: 'new456',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.changePassword).toHaveBeenCalledWith('old123', 'new456');
    });

    it('should handle password change error', async () => {
      const error = new Error('Incorrect password');
      (userApi.changePassword as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        currentPassword: 'wrong',
        newPassword: 'new456',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteAccount', () => {
    it('should delete account successfully', async () => {
      const mockLogout = jest.fn();
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        logout: mockLogout,
      });

      (userApi.deleteAccount as jest.Mock).mockResolvedValue({ success: true });

      delete (window as any).location;
      window.location = { href: '' } as any;

      const { result } = renderHook(() => useDeleteAccount(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ password: 'password123', reason: 'No longer needed' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.deleteAccount).toHaveBeenCalledWith(
        'password123',
        'No longer needed'
      );

      // Wait for the timeout
      await new Promise(resolve => setTimeout(resolve, 2100));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('useExportData', () => {
    it('should export user data successfully', async () => {
      const mockBlob = new Blob(['data'], { type: 'application/zip' });
      (userApi.exportData as jest.Mock).mockResolvedValue(mockBlob);

      // Mock URL and DOM methods
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();
      document.createElement = jest.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: jest.fn(),
          } as any;
        }
        return {} as any;
      });
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const { result } = renderHook(() => useExportData(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userApi.exportData).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });

  describe('useDashboardStats', () => {
    it('should fetch dashboard stats successfully', async () => {
      const mockStats = {
        totalApplications: 50,
        totalJobs: 100,
        totalResumes: 3,
        recentActivity: [],
      };

      (userApi.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
    });
  });
});
