import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import type { CreateJobAlertInput, UpdateJobAlertInput } from '@/types/alert';
import { useToast } from './useToast';

// Query keys
export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  details: () => [...alertKeys.all, 'detail'] as const,
  detail: (id: string) => [...alertKeys.details(), id] as const,
};

/**
 * Get all job alerts for the current user
 */
export function useJobAlerts() {
  return useQuery({
    queryKey: alertKeys.lists(),
    queryFn: () => alertsApi.getAlerts(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get a single job alert by ID
 */
export function useJobAlert(id: string, enabled = true) {
  return useQuery({
    queryKey: alertKeys.detail(id),
    queryFn: () => alertsApi.getAlert(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new job alert
 */
export function useCreateJobAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateJobAlertInput) => alertsApi.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });

      toast({
        title: 'Alert created',
        description: 'Your job alert has been created successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create alert',
        description: error.message || 'An error occurred while creating the alert.',
        variant: 'error',
      });
    },
  });
}

/**
 * Update an existing job alert
 */
export function useUpdateJobAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobAlertInput }) =>
      alertsApi.updateAlert(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertKeys.detail(variables.id) });

      toast({
        title: 'Alert updated',
        description: 'Your job alert has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update alert',
        description: error.message || 'An error occurred while updating the alert.',
        variant: 'error',
      });
    },
  });
}

/**
 * Delete a job alert
 */
export function useDeleteJobAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => alertsApi.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });

      toast({
        title: 'Alert deleted',
        description: 'Your job alert has been deleted.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete alert',
        description: error.message || 'An error occurred while deleting the alert.',
        variant: 'error',
      });
    },
  });
}

/**
 * Toggle alert active status
 */
export function useToggleJobAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      alertsApi.toggleAlert(id, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertKeys.detail(data.id) });

      toast({
        title: data.isActive ? 'Alert enabled' : 'Alert disabled',
        description: data.isActive
          ? 'You will receive notifications for this alert.'
          : 'Notifications have been paused for this alert.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to toggle alert',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}
