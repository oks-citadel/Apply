/**
 * Response Builder Utility
 *
 * Helper functions to create standardized API responses
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  PaginationMeta,
  ErrorCode,
  SuccessResponseOptions,
  ErrorResponseOptions,
  FieldValidationError,
} from './types';

/**
 * API Response Builder Class
 *
 * Provides static methods to create standardized API responses
 */
export class ApiResponseBuilder {
  private static readonly API_VERSION = '1.0';

  /**
   * Create a successful API response
   */
  static success<T>(options: SuccessResponseOptions<T>): SuccessResponse<T> {
    const { data, requestId, pagination, executionTimeMs, apiVersion } = options;

    const paginationMeta = pagination
      ? ApiResponseBuilder.buildPaginationMeta(pagination)
      : undefined;

    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || uuidv4(),
        pagination: paginationMeta,
        executionTimeMs,
        apiVersion: apiVersion || this.API_VERSION,
      },
    };
  }

  /**
   * Create a simple success response without additional options
   */
  static ok<T>(data: T, requestId?: string): SuccessResponse<T> {
    return ApiResponseBuilder.success({ data, requestId });
  }

  /**
   * Create a paginated success response
   */
  static paginated<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number,
    requestId?: string,
  ): SuccessResponse<{ items: T[] }> {
    return ApiResponseBuilder.success({
      data: { items },
      requestId,
      pagination: { page, pageSize, total },
    });
  }

  /**
   * Create an error response
   */
  static error(options: ErrorResponseOptions): ErrorResponse {
    const {
      code,
      message,
      details,
      validationErrors,
      requestId,
      includeStack = false,
      stack,
    } = options;

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        validationErrors,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || uuidv4(),
        apiVersion: this.API_VERSION,
      },
    };

    // Only include stack trace in development
    if (includeStack && stack && process.env.NODE_ENV !== 'production') {
      errorResponse.error.stack = stack;
    }

    return errorResponse;
  }

  /**
   * Create a validation error response
   */
  static validationError(
    validationErrors: FieldValidationError[],
    requestId?: string,
    message = 'Validation failed',
  ): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      validationErrors,
      requestId,
    });
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized(message = 'Unauthorized', requestId?: string): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.UNAUTHORIZED,
      message,
      requestId,
    });
  }

  /**
   * Create a forbidden error response
   */
  static forbidden(message = 'Access denied', requestId?: string): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.FORBIDDEN,
      message,
      requestId,
    });
  }

  /**
   * Create a not found error response
   */
  static notFound(resource = 'Resource', requestId?: string): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.NOT_FOUND,
      message: `${resource} not found`,
      requestId,
    });
  }

  /**
   * Create an internal server error response
   */
  static internalError(
    message = 'An internal error occurred',
    requestId?: string,
    stack?: string,
  ): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      requestId,
      stack,
      includeStack: true,
    });
  }

  /**
   * Create a rate limit exceeded error response
   */
  static rateLimitExceeded(
    retryAfter?: number,
    requestId?: string,
  ): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Rate limit exceeded. Please try again later.',
      details: retryAfter ? { retryAfter } : undefined,
      requestId,
    });
  }

  /**
   * Create a conflict error response
   */
  static conflict(message: string, requestId?: string): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.RESOURCE_CONFLICT,
      message,
      requestId,
    });
  }

  /**
   * Create a bad request error response
   */
  static badRequest(message: string, requestId?: string): ErrorResponse {
    return ApiResponseBuilder.error({
      code: ErrorCode.INVALID_INPUT,
      message,
      requestId,
    });
  }

  /**
   * Build pagination metadata with calculated fields
   */
  private static buildPaginationMeta(
    pagination: Omit<PaginationMeta, 'totalPages' | 'hasNextPage' | 'hasPreviousPage'>,
  ): PaginationMeta {
    const { page, pageSize, total } = pagination;
    const totalPages = Math.ceil(total / pageSize);

    return {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

/**
 * Convenience function exports for direct use
 */
export const createSuccessResponse = ApiResponseBuilder.success.bind(ApiResponseBuilder);
export const createErrorResponse = ApiResponseBuilder.error.bind(ApiResponseBuilder);
export const createPaginatedResponse = ApiResponseBuilder.paginated.bind(ApiResponseBuilder);
export const createValidationErrorResponse = ApiResponseBuilder.validationError.bind(ApiResponseBuilder);
