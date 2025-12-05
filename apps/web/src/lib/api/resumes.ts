import { apiClient, handleApiError } from './client';
import type {
  Resume,
  ResumeListResponse,
  CreateResumeData,
  UpdateResumeData,
  ResumeExportFormat,
  ATSScore,
} from '@/types/resume';

export const resumesApi = {
  /**
   * Get all resumes for current user
   */
  getResumes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ResumeListResponse> => {
    try {
      const response = await apiClient.get<ResumeListResponse>('/resumes', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get single resume by ID
   */
  getResume: async (id: string): Promise<Resume> => {
    try {
      const response = await apiClient.get<Resume>(`/resumes/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create new resume
   */
  createResume: async (data: CreateResumeData): Promise<Resume> => {
    try {
      const response = await apiClient.post<Resume>('/resumes', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update resume
   */
  updateResume: async (id: string, data: UpdateResumeData): Promise<Resume> => {
    try {
      const response = await apiClient.put<Resume>(`/resumes/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete resume
   */
  deleteResume: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>(`/resumes/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Duplicate resume
   */
  duplicateResume: async (id: string): Promise<Resume> => {
    try {
      const response = await apiClient.post<Resume>(`/resumes/${id}/duplicate`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Set resume as default
   */
  setDefaultResume: async (id: string): Promise<Resume> => {
    try {
      const response = await apiClient.patch<Resume>(`/resumes/${id}/set-default`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Export resume in specified format
   */
  exportResume: async (id: string, format: ResumeExportFormat['format']): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/resumes/${id}/export`, {
        params: { format },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Import resume from file
   */
  importResume: async (file: File, parseFormat?: string): Promise<Resume> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (parseFormat) {
        formData.append('parseFormat', parseFormat);
      }

      const response = await apiClient.post<Resume>('/resumes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get ATS score for resume against job description
   */
  getATSScore: async (resumeId: string, jobDescription: string): Promise<ATSScore> => {
    try {
      const response = await apiClient.post<ATSScore>(`/resumes/${resumeId}/ats-score`, {
        jobDescription,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Parse resume from text or file
   */
  parseResume: async (data: { text?: string; file?: File }): Promise<Partial<Resume>> => {
    try {
      let requestData: FormData | { text: string };

      if (data.file) {
        const formData = new FormData();
        formData.append('file', data.file);
        requestData = formData;
      } else if (data.text) {
        requestData = { text: data.text };
      } else {
        throw new Error('Either text or file must be provided');
      }

      const response = await apiClient.post<Partial<Resume>>('/resumes/parse', requestData, {
        headers: data.file ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
