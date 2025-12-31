/**
 * Standardized API Response Types
 *
 * This module provides consistent response types for all API responses
 * across the platform's microservices.
 */

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages */
  hasNextPage: boolean;
  /** Whether there are previous pages */
  hasPreviousPage: boolean;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** ISO 8601 timestamp of when the response was generated */
  timestamp: string;
  /** Unique request identifier for tracing and debugging */
  requestId: string;
  /** Optional pagination information for list responses */
  pagination?: PaginationMeta;
  /** Optional execution time in milliseconds */
  executionTimeMs?: number;
  /** Optional API version */
  apiVersion?: string;
}

/**
 * Standard error codes used across the platform
 */
export enum ErrorCode {
  // Generic errors (1xxx)
  UNKNOWN_ERROR = 'ERR_UNKNOWN',
  INTERNAL_SERVER_ERROR = 'ERR_INTERNAL_SERVER',
  SERVICE_UNAVAILABLE = 'ERR_SERVICE_UNAVAILABLE',

  // Validation errors (2xxx)
  VALIDATION_ERROR = 'ERR_VALIDATION',
  INVALID_INPUT = 'ERR_INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'ERR_MISSING_FIELD',
  INVALID_FORMAT = 'ERR_INVALID_FORMAT',

  // Authentication errors (3xxx)
  UNAUTHORIZED = 'ERR_UNAUTHORIZED',
  INVALID_CREDENTIALS = 'ERR_INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'ERR_TOKEN_EXPIRED',
  TOKEN_INVALID = 'ERR_TOKEN_INVALID',
  SESSION_EXPIRED = 'ERR_SESSION_EXPIRED',

  // Authorization errors (4xxx)
  FORBIDDEN = 'ERR_FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'ERR_INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED = 'ERR_RESOURCE_ACCESS_DENIED',

  // Resource errors (5xxx)
  NOT_FOUND = 'ERR_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'ERR_RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'ERR_RESOURCE_EXISTS',
  RESOURCE_CONFLICT = 'ERR_RESOURCE_CONFLICT',

  // Rate limiting errors (6xxx)
  RATE_LIMIT_EXCEEDED = 'ERR_RATE_LIMIT',
  TOO_MANY_REQUESTS = 'ERR_TOO_MANY_REQUESTS',

  // Business logic errors (7xxx)
  BUSINESS_RULE_VIOLATION = 'ERR_BUSINESS_RULE',
  OPERATION_NOT_ALLOWED = 'ERR_OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'ERR_QUOTA_EXCEEDED',
  PAYMENT_REQUIRED = 'ERR_PAYMENT_REQUIRED',

  // External service errors (8xxx)
  EXTERNAL_SERVICE_ERROR = 'ERR_EXTERNAL_SERVICE',
  DEPENDENCY_FAILURE = 'ERR_DEPENDENCY_FAILURE',
  TIMEOUT_ERROR = 'ERR_TIMEOUT',
}

/**
 * Validation error detail for a specific field
 */
export interface FieldValidationError {
  /** The field that failed validation */
  field: string;
  /** The validation error message */
  message: string;
  /** The value that failed validation (sanitized) */
  value?: any;
  /** The validation constraint that failed */
  constraint?: string;
}

/**
 * Error details structure
 */
export interface ErrorDetails {
  /** Machine-readable error code */
  code: ErrorCode | string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: any;
  /** Field-level validation errors */
  validationErrors?: FieldValidationError[];
  /** Stack trace (only in development) */
  stack?: string;
  /** Error path (for GraphQL or nested errors) */
  path?: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Indicates if the request was successful */
  success: boolean;
  /** The response data (only present on success) */
  data?: T;
  /** Error details (only present on failure) */
  error?: ErrorDetails;
  /** Response metadata */
  meta: ResponseMeta;
}

/**
 * Successful API response type
 */
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
  error?: never;
}

/**
 * Error API response type
 */
export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  data?: never;
  error: ErrorDetails;
}

/**
 * Paginated list response data
 */
export interface PaginatedData<T> {
  items: T[];
}

/**
 * Options for creating a success response
 */
export interface SuccessResponseOptions<T> {
  data: T;
  requestId?: string;
  pagination?: Omit<PaginationMeta, 'totalPages' | 'hasNextPage' | 'hasPreviousPage'>;
  executionTimeMs?: number;
  apiVersion?: string;
}

/**
 * Options for creating an error response
 */
export interface ErrorResponseOptions {
  code: ErrorCode | string;
  message: string;
  details?: any;
  validationErrors?: FieldValidationError[];
  requestId?: string;
  includeStack?: boolean;
  stack?: string;
}
