import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import type { JobSearchFilters } from '@/types/job';
import { useToast } from './useToast';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters?: JobSearchFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  recommended: () => [...jobKeys.all, 'recommended'] as const,
  saved: () => [...jobKeys.all, 'saved'] as const,
  matchScore: (jobId: string, resumeId: string) =>
    [...jobKeys.detail(jobId), 'match', resumeId] as const,
  similar: (jobId: string) => [...jobKeys.detail(jobId), 'similar'] as const,
  interviewQuestions: (jobId: string) => [...jobKeys.detail(jobId), 'interview'] as const,
};

/**
 * Search jobs with filters
 */
export function useJobs(filters?: JobSearchFilters) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => jobsApi.searchJobs(filters || {}),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
  });
}

/**
 * Get single job by ID
 */
export function useJob(id: string, enabled = true) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobsApi.getJob(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get recommended jobs
 */
export function useRecommendedJobs(params?: { limit?: number; resumeId?: string }) {
  return useQuery({
    queryKey: [...jobKeys.recommended(), params],
    queryFn: () => jobsApi.getRecommendedJobs(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get saved jobs
 */
export function useSavedJobs(params?: { page?: number; limit?: number; tags?: string[] }) {
  return useQuery({
    queryKey: [...jobKeys.saved(), params],
    queryFn: () => jobsApi.getSavedJobs(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Save job
 */
export function useSaveJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data?: { notes?: string; tags?: string[] } }) =>
      jobsApi.saveJob(jobId, data),
    onSuccess: () => {
      // Invalidate saved jobs and job lists
      queryClient.invalidateQueries({ queryKey: jobKeys.saved() });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });

      toast({
        title: 'Job saved',
        description: 'The job has been added to your saved jobs.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save job',
        description: error.message || 'An error occurred while saving the job.',
        variant: 'error',
      });
    },
  });
}

/**
 * Unsave job
 */
export function useUnsaveJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (jobId: string) => jobsApi.unsaveJob(jobId),
    onSuccess: () => {
      // Invalidate saved jobs and job lists
      queryClient.invalidateQueries({ queryKey: jobKeys.saved() });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });

      toast({
        title: 'Job removed',
        description: 'The job has been removed from your saved jobs.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove job',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Update saved job
 */
export function useUpdateSavedJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: { notes?: string; tags?: string[] } }) =>
      jobsApi.updateSavedJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.saved() });

      toast({
        title: 'Saved job updated',
        description: 'Your changes have been saved.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Get match score between job and resume
 */
export function useMatchScore(jobId: string, resumeId: string, enabled = false) {
  return useQuery({
    queryKey: jobKeys.matchScore(jobId, resumeId),
    queryFn: () => jobsApi.getMatchScore(jobId, resumeId),
    enabled: enabled && !!jobId && !!resumeId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get similar jobs
 */
export function useSimilarJobs(jobId: string, limit?: number, enabled = true) {
  return useQuery({
    queryKey: [...jobKeys.similar(jobId), limit],
    queryFn: () => jobsApi.getSimilarJobs(jobId, limit),
    enabled: enabled && !!jobId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get interview questions for job
 */
export function useInterviewQuestions(jobId: string, enabled = false) {
  return useQuery({
    queryKey: jobKeys.interviewQuestions(jobId),
    queryFn: () => jobsApi.getInterviewQuestions(jobId),
    enabled: enabled && !!jobId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get salary prediction
 */
export function useSalaryPrediction() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      jobTitle: string;
      location: string;
      experienceYears: number;
      skills: string[];
      education?: string;
    }) => jobsApi.getSalaryPrediction(data),
    onError: (error: any) => {
      toast({
        title: 'Failed to get salary prediction',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}

/**
 * Report job posting
 */
export function useReportJob() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ jobId, reason, details }: { jobId: string; reason: string; details?: string }) =>
      jobsApi.reportJob(jobId, reason, details),
    onSuccess: () => {
      toast({
        title: 'Report submitted',
        description: 'Thank you for reporting this job. We will review it shortly.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit report',
        description: error.message || 'An error occurred.',
        variant: 'error',
      });
    },
  });
}
