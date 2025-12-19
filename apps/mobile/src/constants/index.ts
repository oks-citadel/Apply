// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@applyforus/access_token',
  REFRESH_TOKEN: '@applyforus/refresh_token',
  USER: '@applyforus/user',
  THEME: '@applyforus/theme',
  LANGUAGE: '@applyforus/language',
};

// Application Status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  INTERVIEW: 'interview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

// Employment Types
export const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

// Location Types
export const LOCATION_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful',
  LOGOUT: 'Logout successful',
  REGISTER: 'Account created successfully',
  APPLICATION_SUBMITTED: 'Application submitted successfully',
  APPLICATION_WITHDRAWN: 'Application withdrawn successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
};

// Query Keys
export const QUERY_KEYS = {
  USER: 'user',
  JOBS: 'jobs',
  JOB_DETAILS: 'job-details',
  APPLICATIONS: 'applications',
  APPLICATION_DETAILS: 'application-details',
  DASHBOARD_STATS: 'dashboard-stats',
  RECENT_APPLICATIONS: 'recent-applications',
  RECOMMENDED_JOBS: 'recommended-jobs',
  SAVED_JOBS: 'saved-jobs',
  RESUMES: 'resumes',
  PROFILE: 'profile',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MESSAGE: 'Password must be at least 8 characters',
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    MESSAGE: 'Name must be between 2 and 50 characters',
  },
};

// Feature Flags
export const FEATURES = {
  OAUTH_LOGIN: true,
  PUSH_NOTIFICATIONS: true,
  DARK_MODE: false, // Not implemented yet
  BIOMETRIC_AUTH: false, // Not implemented yet
};
