import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Base API URL - Update this to your actual API URL
// @ts-ignore - process.env is available in React Native via babel transform
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_URL) || 'http://localhost:3000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('@applyforus/access_token');
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
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@applyforus/refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        await AsyncStorage.setItem('@applyforus/access_token', accessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect to login
        await AsyncStorage.multiRemove([
          '@applyforus/access_token',
          '@applyforus/refresh_token',
          '@applyforus/user',
        ]);
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

  loginWithOAuth: (provider: 'google' | 'linkedin', token: string) =>
    apiClient.post<{ user: User } & AuthTokens>(`/auth/oauth/${provider}`, {
      token,
    }),

  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),

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

  searchJobs: (query: string, filters?: Record<string, any>) =>
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
