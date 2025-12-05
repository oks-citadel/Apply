import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resumesApi } from '@/lib/api';
import type {
  Resume,
  CreateResumeData,
  UpdateResumeData,
  ResumeExportFormat,
} from '@/types/resume';
import { useToast } from './useToast';

// Query keys
export const resumeKeys = {
  all: ['resumes'] as const,
  lists: () => [...resumeKeys.all, 'list'] as const,
  list: (params?: any) => [...resumeKeys.lists(), params] as const,
  details: () => [...resumeKeys.all, 'detail'] as const,
  detail: (id: string) => [...resumeKeys.details(), id] as const,
  atsScore: (id: string, jobDescription: string) =>
    [...resumeKeys.detail(id), 'ats-score', jobDescription] as const,
};

/**
 * Get all resumes with pagination
 */
export function useResumes(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: resumeKeys.list(params),
    queryFn: () => resumesApi.getResumes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single resume by ID
 */
export function useResume(id: string, enabled = true) {
  return useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: () => resumesApi.getResume(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create new resume
 */
export function useCreateResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateResumeData) => resumesApi.createResume(data),
    onSuccess: (newResume) => {
      // Invalidate and refetch resumes list
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });

      // Add new resume to cache
      queryClient.setQueryData(resumeKeys.detail(newResume.id), newResume);

      toast({
        title: 'Resume created',
        description: 'Your resume has been created successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create resume',
        description: error.message || 'An error occurred while creating the resume.',
        variant: 'error',
      });
    },
  });
}

/**
 * Update resume
 */
export function useUpdateResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResumeData }) =>
      resumesApi.updateResume(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: resumeKeys.detail(id) });

      // Snapshot previous value
      const previousResume = queryClient.getQueryData<Resume>(resumeKeys.detail(id));

      // Optimistically update
      if (previousResume) {
        queryClient.setQueryData<Resume>(resumeKeys.detail(id), {
          ...previousResume,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousResume };
    },
    onSuccess: (updatedResume) => {
      // Update cache
      queryClient.setQueryData(resumeKeys.detail(updatedResume.id), updatedResume);

      // Invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });

      toast({
        title: 'Resume updated',
        description: 'Your changes have been saved.',
        variant: 'success',
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousResume) {
        queryClient.setQueryData(resumeKeys.detail(variables.id), context.previousResume);
      }

      toast({
        title: 'Failed to update resume',
        description: error.message || 'An error occurred while updating the resume.',
        variant: 'error',
      });
    },
  });
}

/**
 * Delete resume
 */
export function useDeleteResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => resumesApi.deleteResume(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: resumeKeys.detail(deletedId) });

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });

      toast({
        title: 'Resume deleted',
        description: 'The resume has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete resume',
        description: error.message || 'An error occurred while deleting the resume.',
        variant: 'error',
      });
    },
  });
}

/**
 * Duplicate resume
 */
export function useDuplicateResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => resumesApi.duplicateResume(id),
    onSuccess: (newResume) => {
      // Add to cache
      queryClient.setQueryData(resumeKeys.detail(newResume.id), newResume);

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });

      toast({
        title: 'Resume duplicated',
        description: 'A copy of your resume has been created.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to duplicate resume',
        description: error.message || 'An error occurred while duplicating the resume.',
        variant: 'error',
      });
    },
  });
}

/**
 * Set resume as default
 */
export function useSetDefaultResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => resumesApi.setDefaultResume(id),
    onSuccess: () => {
      // Invalidate all resume queries to refresh default status
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });

      toast({
        title: 'Default resume updated',
        description: 'This resume is now your default.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to set default resume',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Export resume
 */
export function useExportResume() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: ResumeExportFormat['format'] }) =>
      resumesApi.exportResume(id, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Resume exported',
        description: `Your resume has been exported as ${variables.format.toUpperCase()}.`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred while exporting the resume.',
        variant: 'error',
      });
    },
  });
}

/**
 * Import resume
 */
export function useImportResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ file, parseFormat }: { file: File; parseFormat?: string }) =>
      resumesApi.importResume(file, parseFormat),
    onSuccess: (newResume) => {
      // Add to cache
      queryClient.setQueryData(resumeKeys.detail(newResume.id), newResume);

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });

      toast({
        title: 'Resume imported',
        description: 'Your resume has been imported successfully.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred while importing the resume.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get ATS score
 */
export function useATSScore(resumeId: string, jobDescription: string, enabled = false) {
  return useQuery({
    queryKey: resumeKeys.atsScore(resumeId, jobDescription),
    queryFn: () => resumesApi.getATSScore(resumeId, jobDescription),
    enabled: enabled && !!resumeId && !!jobDescription,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
