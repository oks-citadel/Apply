import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  Job,
  Application,
  DashboardStats,
  PaginatedResponse,
  ApiError,
} from '../types';

// Declare React Native's global __DEV__ variable
declare const __DEV__: boolean | undefined;

// Extended config interface for retry tracking
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Job search filters type
interface JobSearchFilters {
  location?: string;
  employmentType?: string;
  locationType?: string;
  experienceLevel?: string;
  salary?: {
    min?: number;
    max?: number;
  };
}
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAllAuthData,
  isTokenRefreshing,
  subscribeToTokenRefresh,
  refreshAccessToken,
} from '../lib/secureTokenManager';

// Base API URL - Update this to your actual API URL
// Note: In React Native, environment variables are accessed via expo-constants or react-native-config
// Using a fallback pattern that works across different build configurations
const API_BASE_URL = (() => {
  // Check for global __DEV__ which is available in React Native
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'http://localhost:3000/api';
  }
  // Production URL - should be configured via build-time environment
  return 'https://api.applyforus.com/api';
})();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token from secure storage
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from secure memory storage
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if already refreshing
      if (isTokenRefreshing()) {
        // Wait for token refresh to complete
        return new Promise((resolve, reject) => {
          subscribeToTokenRefresh((token: string | null) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(new Error('Token refresh failed'));
            }
          });
        });
      }

      originalRequest._retry = true;

      try {
        // Refresh token using secure storage
        const newToken = await refreshAccessToken(API_BASE_URL);

        if (!newToken) {
          throw new Error('Token refresh failed');
        }

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear secure storage
        await clearAllAuthData();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{ user: User } & AuthTokens>('/auth/login', credentials),

  register: (data: RegisterData) =>
    apiClient.post<{ user: User } & AuthTokens>('/auth/register', data),

  loginWithOAuth: (provider: 'google' | 'linkedin' | 'github', token: string) =>
    apiClient.post<{ user: User } & AuthTokens>(`/auth/oauth/${provider}`, {
      token,
    }),

  logout: async (refreshToken: string) => {
    return apiClient.post('/auth/logout', { refreshToken });
  },

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  getCurrentUser: () => apiClient.get<User>('/auth/me'),
};

// Jobs API
export const jobsApi = {
  getJobs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    employmentType?: string;
    locationType?: string;
  }) => apiClient.get<PaginatedResponse<Job>>('/jobs', { params }),

  getJobById: (id: string) => apiClient.get<Job>(`/jobs/${id}`),

  searchJobs: (query: string, filters?: JobSearchFilters) =>
    apiClient.post<PaginatedResponse<Job>>('/jobs/search', { query, filters }),

  getSavedJobs: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Job>>('/jobs/saved', { params }),

  saveJob: (jobId: string) => apiClient.post(`/jobs/${jobId}/save`),

  unsaveJob: (jobId: string) => apiClient.delete(`/jobs/${jobId}/save`),
};

// Applications API
export const applicationsApi = {
  getApplications: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Application>>('/applications', { params }),

  getApplicationById: (id: string) => apiClient.get<Application>(`/applications/${id}`),

  createApplication: (data: { jobId: string; resumeId?: string; coverLetter?: string }) =>
    apiClient.post<Application>('/applications', data),

  updateApplication: (id: string, data: Partial<Application>) =>
    apiClient.patch<Application>(`/applications/${id}`, data),

  withdrawApplication: (id: string) => apiClient.post(`/applications/${id}/withdraw`),

  getApplicationStats: () => apiClient.get<DashboardStats>('/applications/stats'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),

  getRecentApplications: (limit: number = 5) =>
    apiClient.get<Application[]>('/dashboard/recent-applications', {
      params: { limit },
    }),

  getRecommendedJobs: (limit: number = 10) =>
    apiClient.get<Job[]>('/dashboard/recommended-jobs', { params: { limit } }),
};

// User Profile API
export const profileApi = {
  getProfile: () => apiClient.get<User>('/profile'),

  updateProfile: (data: Partial<User>) => apiClient.patch<User>('/profile', data),

  uploadAvatar: (formData: FormData) =>
    apiClient.post<{ avatarUrl: string }>('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAccount: () => apiClient.delete('/profile'),
};

// Resume API
export const resumeApi = {
  getResumes: () =>
    apiClient.get<Array<{ id: string; fileName: string; fileUrl: string }>>('/resumes'),

  uploadResume: (formData: FormData) =>
    apiClient.post<{ id: string; fileName: string; fileUrl: string }>(
      '/resumes',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    ),

  deleteResume: (id: string) => apiClient.delete(`/resumes/${id}`),
};

export default apiClient;
