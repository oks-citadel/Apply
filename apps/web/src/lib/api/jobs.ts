import { apiClient, handleApiError } from './client';
import type {
  Job,
  JobSearchFilters,
  JobSearchResponse,
  SavedJob,
  JobMatchScore,
  RecommendedJobsResponse,
  InterviewQuestions,
  SalaryPrediction,
} from '@/types/job';

export const jobsApi = {
  /**
   * Search jobs with filters
   */
  searchJobs: async (filters: JobSearchFilters): Promise<JobSearchResponse> => {
    try {
      const response = await apiClient.get<JobSearchResponse>('/jobs/search', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get single job by ID
   */
  getJob: async (id: string): Promise<Job> => {
    try {
      const response = await apiClient.get<Job>(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get recommended jobs for user
   */
  getRecommendedJobs: async (params?: {
    limit?: number;
    resumeId?: string;
  }): Promise<RecommendedJobsResponse> => {
    try {
      const response = await apiClient.get<RecommendedJobsResponse>('/jobs/recommended', {
        params,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Save job
   */
  saveJob: async (jobId: string, data?: { notes?: string; tags?: string[] }): Promise<SavedJob> => {
    try {
      const response = await apiClient.post<SavedJob>('/jobs/saved', {
        jobId,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Unsave job
   */
  unsaveJob: async (jobId: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>(`/jobs/saved/${jobId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all saved jobs
   */
  getSavedJobs: async (params?: {
    page?: number;
    limit?: number;
    tags?: string[];
  }): Promise<{ savedJobs: SavedJob[]; total: number; page: number; limit: number }> => {
    try {
      const response = await apiClient.get<{
        savedJobs: SavedJob[];
        total: number;
        page: number;
        limit: number;
      }>('/jobs/saved', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update saved job
   */
  updateSavedJob: async (
    jobId: string,
    data: { notes?: string; tags?: string[] }
  ): Promise<SavedJob> => {
    try {
      const response = await apiClient.patch<SavedJob>(`/jobs/saved/${jobId}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get match score between job and resume
   */
  getMatchScore: async (jobId: string, resumeId: string): Promise<JobMatchScore> => {
    try {
      const response = await apiClient.post<JobMatchScore>('/jobs/match-score', {
        jobId,
        resumeId,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get similar jobs
   */
  getSimilarJobs: async (jobId: string, limit?: number): Promise<Job[]> => {
    try {
      const response = await apiClient.get<Job[]>(`/jobs/${jobId}/similar`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get interview questions for job
   */
  getInterviewQuestions: async (jobId: string): Promise<InterviewQuestions> => {
    try {
      const response = await apiClient.get<InterviewQuestions>(`/jobs/${jobId}/interview-questions`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get salary prediction
   */
  getSalaryPrediction: async (data: {
    jobTitle: string;
    location: string;
    experienceYears: number;
    skills: string[];
    education?: string;
  }): Promise<SalaryPrediction> => {
    try {
      const response = await apiClient.post<SalaryPrediction>('/jobs/salary-prediction', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Report job posting
   */
  reportJob: async (
    jobId: string,
    reason: string,
    details?: string
  ): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>(`/jobs/${jobId}/report`, {
        reason,
        details,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
