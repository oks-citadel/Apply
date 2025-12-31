import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Extended config interface to track request metadata and retry state
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
  retryCount?: number;
  _retry?: boolean;
}

// API response data type with potential error fields
interface ApiResponseData {
  message?: string;
  errors?: Record<string, string[]>;
}

// API Base URL - Points to auth-service in development
// NOTE: Port standardized to 8081 as per PORT_STANDARDIZATION_SUMMARY.md
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Configuration
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_ERROR_CODES = ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'];

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for OAuth authentication
});

// Token storage helpers
let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export const setTokens = (access: string | null, refresh: string | null) => {
  accessToken = access;
  refreshToken = refresh;

  // Store in localStorage for persistence across page reloads
  if (typeof window !== 'undefined') {
    if (access) {
      localStorage.setItem('accessToken', access);
    } else {
      localStorage.removeItem('accessToken');
    }

    if (refresh) {
      localStorage.setItem('refreshToken', refresh);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
};

export const getAccessToken = () => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

export const getRefreshToken = () => {
  if (!refreshToken && typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('refreshToken');
  }
  return refreshToken;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;

  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers when token is refreshed
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Retry helper function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error: AxiosError, retryCount: number): boolean => {
  if (retryCount >= MAX_RETRIES) return false;

  // Retry on network errors
  if (!error.response && error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }

  // Retry on specific status codes
  if (error.response && RETRYABLE_STATUS_CODES.includes(error.response.status)) {
    return true;
  }

  return false;
};

// Request interceptor to add JWT token and logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for performance tracking
    const extendedConfig = config as ExtendedAxiosRequestConfig;
    extendedConfig.metadata = { startTime: new Date().getTime() };

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    // Initialize retry count
    extendedConfig.retryCount = extendedConfig.retryCount || 0;

    return config;
  },
  (error: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh, retry logic, and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      const extendedConfig = response.config as ExtendedAxiosRequestConfig;
      const duration = new Date().getTime() - (extendedConfig.metadata?.startTime || 0);
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError<ApiResponseData>) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle retry logic for transient errors
    const retryCount = originalRequest.retryCount || 0;
    if (shouldRetry(error, retryCount)) {
      originalRequest.retryCount = retryCount + 1;

      // Exponential backoff: 1s, 2s, 4s
      const delay = RETRY_DELAY * Math.pow(2, retryCount);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Retry] Attempt ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`);
      }

      await sleep(delay);
      return apiClient(originalRequest);
    }

    // Handle 401 errors (unauthorized) - Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refresh = getRefreshToken();

        if (!refresh) {
          throw new Error('No refresh token available');
        }

        // Call refresh token endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refresh,
        });

        const { accessToken: newAccessToken } = response.data;

        setTokens(newAccessToken, refresh);
        onTokenRefreshed(newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();

        // Only redirect if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API Error class with enhanced categorization
export class ApiError extends Error {
  public readonly isApiError = true;
  public status?: number;
  public errors?: Record<string, string[]>;
  public code?: string;
  public type?: ErrorType;

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]>,
    code?: string,
    type?: ErrorType
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.code = code;
    this.type = type;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

// User-friendly error messages
const getUserFriendlyMessage = (error: AxiosError<ApiResponseData>, type: ErrorType): string => {
  const defaultMessage = error.response?.data?.message || error.message;

  switch (type) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Your session has expired. Please log in again.';
    case ErrorType.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    case ErrorType.VALIDATION:
      return defaultMessage || 'The information provided is invalid. Please check your input and try again.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.TIMEOUT:
      return 'The request took too long to complete. Please try again.';
    case ErrorType.RATE_LIMIT:
      return 'Too many requests. Please wait a moment and try again.';
    case ErrorType.SERVER:
      return 'A server error occurred. Our team has been notified. Please try again later.';
    default:
      return defaultMessage || 'An unexpected error occurred. Please try again.';
  }
};

// Determine error type from response
const getErrorType = (error: AxiosError<ApiResponseData>): ErrorType => {
  const status = error.response?.status;
  const code = error.code;

  // Network errors
  if (!error.response) {
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return ErrorType.TIMEOUT;
    }
    return ErrorType.NETWORK;
  }

  // HTTP status-based categorization
  switch (status) {
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 422:
    case 400:
      return ErrorType.VALIDATION;
    case 429:
      return ErrorType.RATE_LIMIT;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
};

// Enhanced error handler utility
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError<ApiResponseData>(error)) {
    const status = error.response?.status;
    const errors = error.response?.data?.errors;
    const code = error.code;
    const type = getErrorType(error);
    const message = getUserFriendlyMessage(error, type);

    return new ApiError(message, status, errors, code, type);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, undefined, undefined, undefined, ErrorType.UNKNOWN);
  }

  return new ApiError('An unexpected error occurred', undefined, undefined, undefined, ErrorType.UNKNOWN);
};

// Helper to check if error is of specific type
export const isErrorType = (error: unknown, type: ErrorType): boolean => {
  return error instanceof ApiError && error.type === type;
};

// Network status detection
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// Add network status listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Network] Connection restored');
  });

  window.addEventListener('offline', () => {
    console.warn('[Network] Connection lost');
  });
}
