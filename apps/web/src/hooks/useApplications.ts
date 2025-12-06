import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/lib/api';
import type {
  ApplicationFilters,
  CreateApplicationData,
  UpdateApplicationData,
  AutoApplySettings,
} from '@/types/application';
import { useToast } from './useToast';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (filters?: ApplicationFilters) => [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  analytics: () => [...applicationKeys.all, 'analytics'] as const,
  autoApply: () => [...applicationKeys.all, 'auto-apply'] as const,
  autoApplySettings: () => [...applicationKeys.autoApply(), 'settings'] as const,
  autoApplyStatus: () => [...applicationKeys.autoApply(), 'status'] as const,
};

/**
 * Get all applications with filters
 */
export function useApplications(filters?: ApplicationFilters) {
  return useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () => applicationsApi.getApplications(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Get single application by ID
 */
export function useApplication(id: string, enabled = true) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsApi.getApplication(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create new application
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateApplicationData) => applicationsApi.createApplication(data),
    onSuccess: (newApplication) => {
      // Add to cache
      queryClient.setQueryData(applicationKeys.detail(newApplication.id), newApplication);

      // Invalidate lists and analytics
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.analytics() });

      toast({
        title: 'Application created',
        description: 'Your application has been submitted successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create application',
        description: error.message || 'An error occurred while submitting the application.',
        variant: 'error',
      });
    },
  });
}

/**
 * Update application
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationData }) =>
      applicationsApi.updateApplication(id, data),
    onSuccess: (updatedApplication) => {
      // Update cache
      queryClient.setQueryData(applicationKeys.detail(updatedApplication.id), updatedApplication);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });

      toast({
        title: 'Application updated',
        description: 'Your changes have been saved.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update application',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Update application status
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: UpdateApplicationData['status'];
      note?: string;
    }) => applicationsApi.updateApplicationStatus(id, status, note),
    onSuccess: (updatedApplication) => {
      // Update cache
      queryClient.setQueryData(applicationKeys.detail(updatedApplication.id), updatedApplication);

      // Invalidate lists and analytics
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.analytics() });

      toast({
        title: 'Status updated',
        description: 'The application status has been updated.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update status',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Delete application
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.deleteApplication(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: applicationKeys.detail(deletedId) });

      // Invalidate lists and analytics
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.analytics() });

      toast({
        title: 'Application deleted',
        description: 'The application has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete application',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Withdraw application
 */
export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      applicationsApi.withdrawApplication(id, reason),
    onSuccess: (updatedApplication) => {
      // Update cache
      queryClient.setQueryData(applicationKeys.detail(updatedApplication.id), updatedApplication);

      // Invalidate lists and analytics
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.analytics() });

      toast({
        title: 'Application withdrawn',
        description: 'Your application has been withdrawn.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to withdraw application',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get application analytics
 */
export function useApplicationAnalytics(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: [...applicationKeys.analytics(), params],
    queryFn: () => applicationsApi.getAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get auto-apply settings
 */
export function useAutoApplySettings() {
  return useQuery({
    queryKey: applicationKeys.autoApplySettings(),
    queryFn: () => applicationsApi.getAutoApplySettings(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update auto-apply settings
 */
export function useUpdateAutoApplySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: AutoApplySettings) =>
      applicationsApi.updateAutoApplySettings(settings),
    onSuccess: (updatedSettings) => {
      // Update cache
      queryClient.setQueryData(applicationKeys.autoApplySettings(), updatedSettings);

      toast({
        title: 'Settings updated',
        description: 'Auto-apply settings have been saved.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update settings',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Start auto-apply
 */
export function useStartAutoApply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings?: Partial<AutoApplySettings>) =>
      applicationsApi.startAutoApply(settings),
    onSuccess: (status) => {
      // Update status cache
      queryClient.setQueryData(applicationKeys.autoApplyStatus(), status);

      // Invalidate applications
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });

      toast({
        title: 'Auto-apply started',
        description: 'The system will automatically apply to matching jobs.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to start auto-apply',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Stop auto-apply
 */
export function useStopAutoApply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => applicationsApi.stopAutoApply(),
    onSuccess: (status) => {
      // Update status cache
      queryClient.setQueryData(applicationKeys.autoApplyStatus(), status);

      toast({
        title: 'Auto-apply stopped',
        description: 'The automatic job application process has been stopped.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to stop auto-apply',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get auto-apply status
 */
export function useAutoApplyStatus() {
  return useQuery({
    queryKey: applicationKeys.autoApplyStatus(),
    queryFn: () => applicationsApi.getAutoApplyStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute when active
  });
}

/**
 * Export applications
 */
export function useExportApplications() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      format,
      filters,
    }: {
      format: 'csv' | 'xlsx' | 'json';
      filters?: ApplicationFilters;
    }) => applicationsApi.exportApplications(format, filters),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Applications exported',
        description: `Your applications have been exported as ${variables.format.toUpperCase()}.`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred while exporting applications.',
        variant: 'error',
      });
    },
  });
}
