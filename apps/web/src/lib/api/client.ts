import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  refreshAccessToken as refreshToken,
  isTokenRefreshing,
  subscribeToTokenRefresh,
} from '@/lib/auth/secureTokenManager';

// Extended config interface to track request metadata and retry state
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
  retryCount?: number;
  _retry?: boolean;
  _csrfRetry?: boolean;
}

// API response data type with potential error fields
interface ApiResponseData {
  message?: string;
  errors?: Record<string, string[]>;
}

// API Base URL - Backend services handle /api/v1 routing internally
// Production: https://api.applyforus.com (gateway routes to /auth/*, /jobs/*, etc.)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Configuration
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_ERROR_CODES = ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'];

// CSRF Configuration
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Get CSRF token from cookie
 * The server sets this cookie and we read it to include in the header
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch a new CSRF token from the server
 * This sets the cookie and returns the token
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf/token`, {
      withCredentials: true,
    });
    return response.data?.token || getCsrfTokenFromCookie();
  } catch (error) {
    console.error('[CSRF] Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * Ensure we have a valid CSRF token
 * Returns the token from cookie or fetches a new one if needed
 */
async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfTokenFromCookie();
  if (!token) {
    token = await fetchCsrfToken();
  }
  return token;
}

/**
 * Initialize CSRF protection by fetching a token on app load
 * Call this on app initialization
 */
export async function initializeCsrf(): Promise<void> {
  await fetchCsrfToken();
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for httpOnly refresh token
});

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

// Request interceptor to add JWT token, CSRF token, and logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from secure memory storage (not localStorage)
    const token = getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests (Double-Submit Cookie Pattern)
    const method = config.method?.toUpperCase() || '';
    if (STATE_CHANGING_METHODS.includes(method) && config.headers) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        config.headers[CSRF_HEADER_NAME] = csrfToken;
      }
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

    // Handle CSRF token errors - retry with fresh token
    const errorMessage = error.response?.data?.message || '';
    const isCsrfError = error.response?.status === 401 &&
      (errorMessage.includes('CSRF') || errorMessage.includes('csrf'));

    if (isCsrfError && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;

      if (process.env.NODE_ENV === 'development') {
        console.log('[CSRF] Token error, fetching new token and retrying...');
      }

      try {
        // Fetch a new CSRF token
        await fetchCsrfToken();

        // Get the new token and add it to the request
        const newCsrfToken = getCsrfTokenFromCookie();
        if (newCsrfToken && originalRequest.headers) {
          originalRequest.headers[CSRF_HEADER_NAME] = newCsrfToken;
        }

        // Retry the request
        return apiClient(originalRequest);
      } catch (csrfError) {
        console.error('[CSRF] Failed to refresh CSRF token:', csrfError);
        return Promise.reject(error);
      }
    }

    // Handle 401 errors (unauthorized) - Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry && !isCsrfError) {
      // Check if already refreshing
      if (isTokenRefreshing()) {
        // Wait for token refresh to complete
        return new Promise((resolve, reject) => {
          subscribeToTokenRefresh((token: string | null) => {
            if (token) {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            } else {
              reject(new Error('Token refresh failed'));
            }
          });
        });
      }

      originalRequest._retry = true;

      try {
        // Refresh token using httpOnly cookie
        const newToken = await refreshToken(API_BASE_URL);

        if (!newToken) {
          throw new Error('Token refresh failed');
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, tokens are already cleared by refreshToken function
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Error class with enhanced categorization
export class ApiError extends Error {
  public readonly isApiError = true;

  constructor(
    public message: string,
    public status?: number,
    public errors?: Record<string, string[]>,
    public code?: string,
    public type?: ErrorType
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  CSRF = 'CSRF',
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
    case ErrorType.CSRF:
      return 'Security validation failed. Please refresh the page and try again.';
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
  const errorMessage = error.response?.data?.message || '';

  // Network errors
  if (!error.response) {
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return ErrorType.TIMEOUT;
    }
    return ErrorType.NETWORK;
  }

  // Check for CSRF errors (can be 401 or 403)
  if ((status === 401 || status === 403) &&
      (errorMessage.toLowerCase().includes('csrf') || errorMessage.toLowerCase().includes('xsrf'))) {
    return ErrorType.CSRF;
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

// Export getAccessToken for components that need direct access
export { getAccessToken };
