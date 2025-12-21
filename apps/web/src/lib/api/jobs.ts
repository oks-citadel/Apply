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
  JobReport,
  JobReportsResponse,
  UpdateReportStatusDto,
} from '@/types/job';

// Transform backend response to frontend format
interface BackendJobsResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

const transformJobsResponse = (response: BackendJobsResponse): JobSearchResponse => ({
  jobs: response.data.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company_name || job.company?.name || 'Unknown Company',
    location: job.location || 'Remote',
    locationType: job.remote_type === 'full_remote' ? 'remote' : job.remote_type === 'hybrid' ? 'hybrid' : 'onsite',
    salary: job.salary_min || job.salary_max ? {
      min: job.salary_min || 0,
      max: job.salary_max || 0,
      currency: job.salary_currency || 'USD',
      period: job.salary_period || 'yearly',
    } : undefined,
    description: job.description || '',
    requirements: job.requirements || [],
    responsibilities: [],
    benefits: job.benefits || [],
    skills: job.skills || [],
    experienceLevel: job.experience_level || 'mid',
    employmentType: job.employment_type || 'full-time',
    industry: job.industry || 'Technology',
    companyLogo: job.company_logo_url || job.company?.logo_url,
    companyWebsite: job.company?.website,
    applyUrl: job.application_url,
    source: job.source || 'direct',
    postedAt: job.posted_at || job.created_at,
    expiresAt: job.expires_at,
    isSaved: job.saved || false,
    isReported: false,
    matchScore: job.match_score,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  })),
  total: response.pagination.total,
  page: response.pagination.page,
  limit: response.pagination.limit,
  hasMore: response.pagination.has_next,
});

export const jobsApi = {
  /**
   * Search jobs with filters
   */
  searchJobs: async (filters: JobSearchFilters): Promise<JobSearchResponse> => {
    try {
      // Transform frontend filter names to backend parameter names
      // Backend expects 'keywords' but frontend uses 'query'
      const params: Record<string, any> = {};

      // Map query -> keywords (frontend uses 'query', backend expects 'keywords')
      if (filters.query && filters.query.trim()) {
        params.keywords = filters.query.trim();
      }

      // Pass through other parameters, filtering out empty values
      if (filters.location && filters.location.trim()) {
        params.location = filters.location.trim();
      }
      if (filters.locationType && filters.locationType.length > 0) {
        // Map frontend locationType to backend remote_type
        const remoteTypeMap: Record<string, string> = {
          'remote': 'full_remote',
          'hybrid': 'hybrid',
          'onsite': 'onsite',
        };
        params.remote_type = filters.locationType.map(lt => remoteTypeMap[lt] || lt);
      }
      if (filters.employmentType && filters.employmentType.length > 0) {
        params.employment_type = filters.employmentType;
      }
      if (filters.experienceLevel && filters.experienceLevel.length > 0) {
        params.experience_level = filters.experienceLevel;
      }
      if (filters.industry && filters.industry.length > 0) {
        params.industry = filters.industry;
      }
      if (filters.salaryMin !== undefined && filters.salaryMin > 0) {
        params.salary_min = filters.salaryMin;
      }
      if (filters.salaryMax !== undefined && filters.salaryMax > 0) {
        params.salary_max = filters.salaryMax;
      }
      if (filters.skills && filters.skills.length > 0) {
        params.skills = filters.skills;
      }
      if (filters.postedWithin) {
        params.posted_within = filters.postedWithin;
      }

      // Pagination
      params.page = filters.page || 1;
      params.limit = filters.limit || 10;

      const response = await apiClient.get<BackendJobsResponse>('/jobs/search', { params });
      return transformJobsResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get single job by ID
   */
  getJob: async (id: string): Promise<Job> => {
    try {
      const response = await apiClient.get<any>(`/jobs/${id}`);
      const job = response.data;
      // Transform single job from backend format
      return {
        id: job.id,
        title: job.title,
        company: job.company_name || job.company?.name || 'Unknown Company',
        location: job.location || 'Remote',
        locationType: job.remote_type === 'full_remote' ? 'remote' : job.remote_type === 'hybrid' ? 'hybrid' : 'onsite',
        salary: job.salary_min || job.salary_max ? {
          min: job.salary_min || 0,
          max: job.salary_max || 0,
          currency: job.salary_currency || 'USD',
          period: job.salary_period || 'yearly',
        } : undefined,
        description: job.description || '',
        requirements: job.requirements || [],
        responsibilities: [],
        benefits: job.benefits || [],
        skills: job.skills || [],
        experienceLevel: job.experience_level || 'mid',
        employmentType: job.employment_type || 'full-time',
        industry: job.industry || 'Technology',
        companyLogo: job.company_logo_url || job.company?.logo_url,
        companyWebsite: job.company?.website,
        applyUrl: job.application_url,
        source: job.source || 'direct',
        postedAt: job.posted_at || job.created_at,
        expiresAt: job.expires_at,
        isSaved: job.saved || false,
        isReported: false,
        matchScore: job.match_score,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
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
      const response = await apiClient.get<BackendJobsResponse>('/jobs/recommended', {
        params,
      });
      // Transform backend response to RecommendedJobsResponse format
      const transformed = transformJobsResponse(response.data);
      return {
        jobs: transformed.jobs,
        reasons: {},
      };
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
      const response = await apiClient.get<BackendJobsResponse>('/jobs/saved', { params });
      // Transform backend response
      const transformed = transformJobsResponse(response.data);
      return {
        savedJobs: transformed.jobs.map(job => ({
          id: job.id,
          jobId: job.id,
          userId: '',
          job,
          savedAt: job.createdAt,
        })),
        total: transformed.total,
        page: transformed.page,
        limit: transformed.limit,
      };
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

  /**
   * Get all job reports (Admin only)
   */
  getJobReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    reason?: string;
  }): Promise<JobReportsResponse> => {
    try {
      const response = await apiClient.get<JobReportsResponse>('/jobs/reports', {
        params,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update job report status (Admin only)
   */
  updateReportStatus: async (
    reportId: string,
    data: UpdateReportStatusDto
  ): Promise<JobReport> => {
    try {
      const response = await apiClient.put<JobReport>(`/jobs/reports/${reportId}/status`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
