/**
 * Custom Exceptions for Standardized Error Responses
 *
 * These exceptions work with the GlobalExceptionFilter to produce
 * consistent error responses across all services.
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, FieldValidationError, ErrorDetails } from './types';

/**
 * Base API Exception class
 *
 * All custom exceptions should extend this class for consistent error handling
 */
export class ApiException extends HttpException {
  public readonly errorCode: ErrorCode | string;
  public readonly errorDetails?: any;
  public readonly validationErrors?: FieldValidationError[];

  constructor(
    message: string,
    errorCode: ErrorCode | string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any,
    validationErrors?: FieldValidationError[],
  ) {
    super(message, statusCode);
    this.errorCode = errorCode;
    this.errorDetails = details;
    this.validationErrors = validationErrors;
  }

  /**
   * Get structured error details
   */
  getErrorDetails(): ErrorDetails {
    return {
      code: this.errorCode,
      message: this.message,
      details: this.errorDetails,
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Validation Exception
 *
 * Thrown when request validation fails
 */
export class ValidationException extends ApiException {
  constructor(
    validationErrors: FieldValidationError[],
    message = 'Validation failed',
  ) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      undefined,
      validationErrors,
    );
  }

  /**
   * Create from class-validator errors
   */
  static fromClassValidatorErrors(errors: any[]): ValidationException {
    const validationErrors: FieldValidationError[] = errors.map((error) => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      value: error.value,
      constraint: Object.keys(error.constraints || {})[0],
    }));

    return new ValidationException(validationErrors);
  }
}

/**
 * Resource Not Found Exception
 */
export class ResourceNotFoundException extends ApiException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;

    super(
      message,
      ErrorCode.RESOURCE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
      { resource, identifier },
    );
  }
}

/**
 * Resource Already Exists Exception
 */
export class ResourceExistsException extends ApiException {
  constructor(resource: string, field?: string, value?: any) {
    const message = field
      ? `${resource} with ${field} '${value}' already exists`
      : `${resource} already exists`;

    super(
      message,
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      { resource, field, value },
    );
  }
}

/**
 * Unauthorized Exception
 */
export class UnauthorizedException extends ApiException {
  constructor(message = 'Unauthorized') {
    super(message, ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Token Expired Exception
 */
export class TokenExpiredException extends ApiException {
  constructor(message = 'Token has expired') {
    super(message, ErrorCode.TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Invalid Token Exception
 */
export class InvalidTokenException extends ApiException {
  constructor(message = 'Invalid token') {
    super(message, ErrorCode.TOKEN_INVALID, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Forbidden Exception
 */
export class ForbiddenException extends ApiException {
  constructor(
    message = 'Access denied',
    resource?: string,
    action?: string,
  ) {
    super(
      message,
      ErrorCode.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      { resource, action },
    );
  }
}

/**
 * Insufficient Permissions Exception
 */
export class InsufficientPermissionsException extends ApiException {
  constructor(requiredPermission: string, message?: string) {
    super(
      message || `Insufficient permissions. Required: ${requiredPermission}`,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      HttpStatus.FORBIDDEN,
      { requiredPermission },
    );
  }
}

/**
 * Rate Limit Exceeded Exception
 */
export class RateLimitException extends ApiException {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, message = 'Rate limit exceeded') {
    super(
      message,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      HttpStatus.TOO_MANY_REQUESTS,
      { retryAfter },
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * Business Rule Violation Exception
 */
export class BusinessRuleException extends ApiException {
  constructor(message: string, ruleCode?: string) {
    super(
      message,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { ruleCode },
    );
  }
}

/**
 * Operation Not Allowed Exception
 */
export class OperationNotAllowedException extends ApiException {
  constructor(operation: string, reason: string) {
    super(
      `Operation '${operation}' is not allowed: ${reason}`,
      ErrorCode.OPERATION_NOT_ALLOWED,
      HttpStatus.FORBIDDEN,
      { operation, reason },
    );
  }
}

/**
 * Quota Exceeded Exception
 */
export class QuotaExceededException extends ApiException {
  constructor(
    resource: string,
    limit: number,
    current: number,
    message?: string,
  ) {
    super(
      message || `${resource} quota exceeded. Limit: ${limit}, Current: ${current}`,
      ErrorCode.QUOTA_EXCEEDED,
      HttpStatus.PAYMENT_REQUIRED,
      { resource, limit, current },
    );
  }
}

/**
 * Payment Required Exception
 */
export class PaymentRequiredException extends ApiException {
  constructor(message = 'Payment required', details?: any) {
    super(
      message,
      ErrorCode.PAYMENT_REQUIRED,
      HttpStatus.PAYMENT_REQUIRED,
      details,
    );
  }
}

/**
 * External Service Error Exception
 */
export class ExternalServiceException extends ApiException {
  constructor(
    serviceName: string,
    originalError?: Error,
    message?: string,
  ) {
    super(
      message || `External service '${serviceName}' error`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      HttpStatus.BAD_GATEWAY,
      {
        serviceName,
        originalError: originalError?.message,
      },
    );
  }
}

/**
 * Service Timeout Exception
 */
export class TimeoutException extends ApiException {
  constructor(serviceName: string, timeoutMs: number) {
    super(
      `Service '${serviceName}' timed out after ${timeoutMs}ms`,
      ErrorCode.TIMEOUT_ERROR,
      HttpStatus.GATEWAY_TIMEOUT,
      { serviceName, timeoutMs },
    );
  }
}

/**
 * Dependency Failure Exception
 */
export class DependencyFailureException extends ApiException {
  constructor(dependency: string, reason: string) {
    super(
      `Dependency '${dependency}' failed: ${reason}`,
      ErrorCode.DEPENDENCY_FAILURE,
      HttpStatus.SERVICE_UNAVAILABLE,
      { dependency, reason },
    );
  }
}

/**
 * Service Unavailable Exception
 */
export class ServiceUnavailableException extends ApiException {
  constructor(message = 'Service temporarily unavailable', retryAfter?: number) {
    super(
      message,
      ErrorCode.SERVICE_UNAVAILABLE,
      HttpStatus.SERVICE_UNAVAILABLE,
      { retryAfter },
    );
  }
}

/**
 * Bad Request Exception
 */
export class BadRequestException extends ApiException {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorCode.INVALID_INPUT,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}

/**
 * Conflict Exception
 */
export class ConflictException extends ApiException {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorCode.RESOURCE_CONFLICT,
      HttpStatus.CONFLICT,
      details,
    );
  }
}
