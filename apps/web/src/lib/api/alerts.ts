import { apiClient, handleApiError } from './client';
import type {
  JobAlert,
  CreateJobAlertInput,
  UpdateJobAlertInput,
  JobAlertListResponse,
} from '@/types/alert';

export const alertsApi = {
  /**
   * Get all job alerts for the current user
   */
  getAlerts: async (): Promise<JobAlertListResponse> => {
    try {
      const response = await apiClient.get<JobAlertListResponse>('/jobs/alerts');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get a single job alert by ID
   */
  getAlert: async (id: string): Promise<JobAlert> => {
    try {
      const response = await apiClient.get<JobAlert>(`/jobs/alerts/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create a new job alert
   */
  createAlert: async (data: CreateJobAlertInput): Promise<JobAlert> => {
    try {
      const response = await apiClient.post<JobAlert>('/jobs/alerts', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update an existing job alert
   */
  updateAlert: async (id: string, data: UpdateJobAlertInput): Promise<JobAlert> => {
    try {
      const response = await apiClient.put<JobAlert>(`/jobs/alerts/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete a job alert
   */
  deleteAlert: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>(`/jobs/alerts/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Toggle alert active status
   */
  toggleAlert: async (id: string, isActive: boolean): Promise<JobAlert> => {
    try {
      const response = await apiClient.patch<JobAlert>(`/jobs/alerts/${id}`, { isActive });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
