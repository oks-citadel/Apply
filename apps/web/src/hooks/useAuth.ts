import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useToast } from './useToast';
import { useAuthStore } from '@/stores/authStore';
import { userKeys } from './useUser';

/**
 * Setup MFA (Multi-Factor Authentication)
 */
export function useSetupMfa() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => authApi.setupMfa(),
    onError: (error: any) => {
      toast({
        title: 'Failed to setup 2FA',
        description: error.message || 'An error occurred while setting up two-factor authentication.',
        variant: 'error',
      });
    },
  });
}

/**
 * Verify MFA code and enable MFA
 */
export function useVerifyMfa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (code: string) => authApi.verifyMfa(code),
    onSuccess: (data) => {
      // Update user profile to reflect MFA enabled
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      updateUser({ mfaEnabled: true });

      toast({
        title: '2FA enabled successfully',
        description: 'Two-factor authentication has been enabled for your account.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to verify code',
        description: error.message || 'The verification code is invalid or expired.',
        variant: 'error',
      });
    },
  });
}

/**
 * Disable MFA
 */
export function useDisableMfa() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (code: string) => authApi.disableMfa(code),
    onSuccess: () => {
      // Update user profile to reflect MFA disabled
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      updateUser({ mfaEnabled: false });

      toast({
        title: '2FA disabled',
        description: 'Two-factor authentication has been disabled for your account.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to disable 2FA',
        description: error.message || 'An error occurred. Please check your verification code.',
        variant: 'error',
      });
    },
  });
}

/**
 * Regenerate MFA backup codes
 */
export function useRegenerateBackupCodes() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (code: string) => authApi.regenerateBackupCodes(code),
    onSuccess: () => {
      toast({
        title: 'Backup codes regenerated',
        description: 'New backup codes have been generated. Please save them securely.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to regenerate codes',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}
