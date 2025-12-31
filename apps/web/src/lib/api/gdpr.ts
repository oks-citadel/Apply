/**
 * GDPR API Client
 * Handles GDPR-related API calls for data export, deletion, and privacy requests
 */

import { apiClient, handleApiError } from './client';

// Types for GDPR requests
export interface GdprRequest {
  id: string;
  userId: string;
  type: 'data_export' | 'account_deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reason?: string;
  downloadUrl?: string;
  downloadExpiry?: string;
  scheduledDeletionDate?: string;
  processedServices?: string[];
  createdAt: string;
  completedAt?: string;
}

export interface DataExportResponse {
  requestId: string;
  message: string;
  estimatedCompletionMinutes: number;
}

export interface DeletionResponse {
  requestId: string;
  message: string;
  scheduledDeletionDate: string;
  gracePeriodDays: number;
}

export interface PrivacyRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  state: string;
  requestType: 'do-not-sell' | 'know' | 'delete' | 'correct' | 'limit';
  additionalInfo?: string;
}

export interface RetentionPolicy {
  dataType: string;
  reason: string;
  retentionPeriod: string;
  legalBasis: string;
}

export interface DeletionCertificate {
  certificateId: string;
  userId: string;
  deletionDate: string;
  retainedData: RetentionPolicy[];
  verificationHash: string;
  message: string;
}

export interface AnonymizationResult {
  success: boolean;
  anonymizedFields: number;
  dataCategories: string[];
}

export interface PaginatedGdprRequests {
  items: GdprRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * GDPR API Functions
 */

/**
 * Export user data (GET /gdpr/export)
 * Downloads user data in JSON or CSV format
 */
export const exportUserData = async (format: 'json' | 'csv' = 'json'): Promise<Blob> => {
  try {
    const response = await apiClient.get('/auth/gdpr/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Request asynchronous data export (POST /gdpr/export)
 * For large datasets that require processing time
 */
export const requestDataExport = async (reason?: string): Promise<DataExportResponse> => {
  try {
    const response = await apiClient.post('/auth/gdpr/export', { reason });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Request account deletion (DELETE /gdpr/delete)
 * Implements GDPR Article 17 - Right to Erasure
 */
export const requestAccountDeletion = async (
  reason: string,
  confirmationPhrase?: string
): Promise<DeletionResponse> => {
  try {
    const response = await apiClient.delete('/auth/gdpr/delete', {
      data: { reason, confirmationPhrase },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get list of GDPR requests
 */
export const getGdprRequests = async (
  type?: 'data_export' | 'account_deletion',
  page = 1,
  limit = 10
): Promise<PaginatedGdprRequests> => {
  try {
    const response = await apiClient.get('/auth/gdpr/requests', {
      params: { type, page, limit },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get a specific GDPR request
 */
export const getGdprRequest = async (requestId: string): Promise<GdprRequest> => {
  try {
    const response = await apiClient.get(`/auth/gdpr/requests/${requestId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Cancel a pending GDPR request
 */
export const cancelGdprRequest = async (
  requestId: string,
  reason?: string
): Promise<GdprRequest> => {
  try {
    const response = await apiClient.post(`/auth/gdpr/requests/${requestId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get deletion certificate for a completed deletion request
 */
export const getDeletionCertificate = async (requestId: string): Promise<DeletionCertificate> => {
  try {
    const response = await apiClient.get(`/auth/gdpr/requests/${requestId}/certificate`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Anonymize user data (alternative to full deletion)
 */
export const anonymizeUserData = async (): Promise<AnonymizationResult> => {
  try {
    const response = await apiClient.post('/auth/gdpr/anonymize');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get data retention policies
 */
export const getRetentionPolicies = async (): Promise<RetentionPolicy[]> => {
  try {
    const response = await apiClient.get('/auth/gdpr/retention-policies');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Submit a privacy request (from Do Not Sell page)
 * This endpoint handles CCPA/CPRA requests
 */
export const submitPrivacyRequest = async (
  payload: PrivacyRequestPayload
): Promise<{ success: boolean; requestId: string; message: string }> => {
  try {
    const response = await apiClient.post('/auth/gdpr/privacy-request', payload);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Download a data export file
 */
export const downloadExport = async (exportId: string, token: string): Promise<Blob> => {
  try {
    const response = await apiClient.get(`/auth/gdpr/downloads/${exportId}`, {
      params: { token },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
