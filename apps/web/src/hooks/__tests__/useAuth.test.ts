import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useSetupMfa,
  useVerifyMfa,
  useDisableMfa,
  useRegenerateBackupCodes,
} from '../useAuth';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// Mock the API
jest.mock('@/lib/api', () => ({
  authApi: {
    setupMfa: jest.fn(),
    verifyMfa: jest.fn(),
    disableMfa: jest.fn(),
    regenerateBackupCodes: jest.fn(),
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

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      updateUser: jest.fn(),
    });
  });

  describe('useSetupMfa', () => {
    it('should setup MFA successfully', async () => {
      const mockMfaData = {
        qrCode: 'data:image/png;base64,...',
        secret: 'JBSWY3DPEHPK3PXP',
        backupCodes: ['123456', '789012'],
      };

      (authApi.setupMfa as jest.Mock).mockResolvedValue(mockMfaData);

      const { result } = renderHook(() => useSetupMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMfaData);
      expect(authApi.setupMfa).toHaveBeenCalledTimes(1);
    });

    it('should handle setup error', async () => {
      const error = new Error('Setup failed');
      (authApi.setupMfa as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useSetupMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useVerifyMfa', () => {
    it('should verify MFA code successfully', async () => {
      const mockUpdateUser = jest.fn();
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        updateUser: mockUpdateUser,
      });

      const mockData = {
        success: true,
        backupCodes: ['111111', '222222'],
      };

      (authApi.verifyMfa as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useVerifyMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123456');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authApi.verifyMfa).toHaveBeenCalledWith('123456');
      expect(mockUpdateUser).toHaveBeenCalledWith({ mfaEnabled: true });
    });

    it('should handle invalid verification code', async () => {
      const error = new Error('Invalid code');
      (authApi.verifyMfa as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useVerifyMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('000000');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDisableMfa', () => {
    it('should disable MFA successfully', async () => {
      const mockUpdateUser = jest.fn();
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        updateUser: mockUpdateUser,
      });

      (authApi.disableMfa as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDisableMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123456');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authApi.disableMfa).toHaveBeenCalledWith('123456');
      expect(mockUpdateUser).toHaveBeenCalledWith({ mfaEnabled: false });
    });

    it('should handle disable error', async () => {
      const error = new Error('Failed to disable MFA');
      (authApi.disableMfa as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useDisableMfa(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123456');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useRegenerateBackupCodes', () => {
    it('should regenerate backup codes successfully', async () => {
      const mockBackupCodes = {
        backupCodes: ['AAAA1111', 'BBBB2222', 'CCCC3333'],
      };

      (authApi.regenerateBackupCodes as jest.Mock).mockResolvedValue(
        mockBackupCodes
      );

      const { result } = renderHook(() => useRegenerateBackupCodes(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123456');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockBackupCodes);
      expect(authApi.regenerateBackupCodes).toHaveBeenCalledWith('123456');
    });

    it('should handle regeneration error', async () => {
      const error = new Error('Failed to regenerate codes');
      (authApi.regenerateBackupCodes as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useRegenerateBackupCodes(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('123456');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});
