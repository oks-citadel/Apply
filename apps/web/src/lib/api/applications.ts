import { apiClient, handleApiError } from './client';
import type {
  Application,
  ApplicationFilters,
  ApplicationListResponse,
  ApplicationAnalytics,
  CreateApplicationData,
  UpdateApplicationData,
  AutoApplySettings,
  AutoApplyStatus,
} from '@/types/application';

export const applicationsApi = {
  /**
   * Get all applications with filters
   */
  getApplications: async (filters?: ApplicationFilters): Promise<ApplicationListResponse> => {
    try {
      const response = await apiClient.get<ApplicationListResponse>('/applications', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get single application by ID
   */
  getApplication: async (id: string): Promise<Application> => {
    try {
      const response = await apiClient.get<Application>(`/applications/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create new application
   */
  createApplication: async (data: CreateApplicationData): Promise<Application> => {
    try {
      const response = await apiClient.post<Application>('/applications', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update application
   */
  updateApplication: async (id: string, data: UpdateApplicationData): Promise<Application> => {
    try {
      const response = await apiClient.patch<Application>(`/applications/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update application status
   */
  updateApplicationStatus: async (
    id: string,
    status: UpdateApplicationData['status'],
    note?: string
  ): Promise<Application> => {
    try {
      const response = await apiClient.patch<Application>(`/applications/${id}/status`, {
        status,
        note,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete application
   */
  deleteApplication: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>(`/applications/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Withdraw application
   */
  withdrawApplication: async (id: string, reason?: string): Promise<Application> => {
    try {
      const response = await apiClient.post<Application>(`/applications/${id}/withdraw`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get application analytics
   */
  getAnalytics: async (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApplicationAnalytics> => {
    try {
      const response = await apiClient.get<ApplicationAnalytics>('/applications/analytics', {
        params,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get auto-apply settings
   */
  getAutoApplySettings: async (): Promise<AutoApplySettings> => {
    try {
      const response = await apiClient.get<AutoApplySettings>('/applications/auto-apply/settings');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update auto-apply settings
   */
  updateAutoApplySettings: async (settings: AutoApplySettings): Promise<AutoApplySettings> => {
    try {
      const response = await apiClient.put<AutoApplySettings>(
        '/applications/auto-apply/settings',
        settings
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Start auto-apply
   */
  startAutoApply: async (settings?: Partial<AutoApplySettings>): Promise<AutoApplyStatus> => {
    try {
      const response = await apiClient.post<AutoApplyStatus>(
        '/applications/auto-apply/start',
        settings
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Stop auto-apply
   */
  stopAutoApply: async (): Promise<AutoApplyStatus> => {
    try {
      const response = await apiClient.post<AutoApplyStatus>('/applications/auto-apply/stop');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get auto-apply status
   */
  getAutoApplyStatus: async (): Promise<AutoApplyStatus> => {
    try {
      const response = await apiClient.get<AutoApplyStatus>('/applications/auto-apply/status');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Export applications
   */
  exportApplications: async (
    format: 'csv' | 'xlsx' | 'json',
    filters?: ApplicationFilters
  ): Promise<Blob> => {
    try {
      const response = await apiClient.get('/applications/export', {
        params: { format, ...filters },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
