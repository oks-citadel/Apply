/**
 * Global Exception Filter
 *
 * Catches all exceptions and transforms them into standardized error responses
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ErrorResponse, ErrorCode, ErrorDetails } from './types';
import { ApiException } from './exceptions';

/**
 * Extended request interface with request ID
 */
interface ExtendedRequest extends Request {
  id?: string;
  requestId?: string;
}

/**
 * Configuration options for the exception filter
 */
export interface ExceptionFilterOptions {
  /** Whether to include stack traces in development */
  includeStackTrace?: boolean;
  /** Custom logger instance */
  logger?: Logger;
  /** API version to include in responses */
  apiVersion?: string;
  /** Custom request ID header name */
  requestIdHeader?: string;
}

/**
 * Global Exception Filter
 *
 * Transforms all exceptions into standardized error responses:
 * {
 *   success: false,
 *   error: {
 *     code: "ERR_xxx",
 *     message: "Error message",
 *     details?: { ... },
 *     validationErrors?: [ ... ],
 *     stack?: "..." (development only)
 *   },
 *   meta: {
 *     timestamp: "2024-01-01T00:00:00.000Z",
 *     requestId: "uuid"
 *   }
 * }
 *
 * @example
 * ```typescript
 * // Apply globally in main.ts
 * app.useGlobalFilters(new GlobalExceptionFilter());
 *
 * // Or in module
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_FILTER,
 *       useClass: GlobalExceptionFilter,
 *     },
 *   ],
 * })
 * ```
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger;
  private readonly options: ExceptionFilterOptions;

  constructor(options: ExceptionFilterOptions = {}) {
    this.options = {
      includeStackTrace: options.includeStackTrace ?? process.env.NODE_ENV !== 'production',
      apiVersion: options.apiVersion || '1.0',
      requestIdHeader: options.requestIdHeader || 'x-request-id',
      ...options,
    };
    this.logger = options.logger || new Logger(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<ExtendedRequest>();

    // Get or generate request ID
    const requestId = this.getRequestId(request);

    // Set request ID header
    response.setHeader(this.options.requestIdHeader!, requestId);

    // Build error response
    const { statusCode, errorResponse } = this.buildErrorResponse(
      exception,
      requestId,
    );

    // Log the error
    this.logError(exception, request, requestId, statusCode);

    // Send response
    response.status(statusCode).json(errorResponse);
  }

  /**
   * Build error response from exception
   */
  private buildErrorResponse(
    exception: unknown,
    requestId: string,
  ): { statusCode: number; errorResponse: ErrorResponse } {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorDetails: ErrorDetails;

    if (exception instanceof ApiException) {
      // Handle custom API exceptions
      statusCode = exception.getStatus();
      errorDetails = exception.getErrorDetails();

      // Add stack trace in development
      if (this.options.includeStackTrace && exception.stack) {
        errorDetails.stack = exception.stack;
      }
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorDetails = this.parseHttpExceptionResponse(
        exceptionResponse,
        statusCode,
        exception.stack,
      );
    } else if (exception instanceof Error) {
      // Handle generic errors
      errorDetails = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: this.getSafeErrorMessage(exception),
      };

      if (this.options.includeStackTrace && exception.stack) {
        errorDetails.stack = exception.stack;
      }
    } else {
      // Handle unknown exceptions
      errorDetails = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
      };
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: errorDetails,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        apiVersion: this.options.apiVersion,
      },
    };

    return { statusCode, errorResponse };
  }

  /**
   * Parse HTTP exception response to error details
   */
  private parseHttpExceptionResponse(
    response: string | object,
    statusCode: number,
    stack?: string,
  ): ErrorDetails {
    const errorCode = this.getErrorCodeFromStatus(statusCode);

    if (typeof response === 'string') {
      return {
        code: errorCode,
        message: response,
        stack: this.options.includeStackTrace ? stack : undefined,
      };
    }

    const responseObj = response as Record<string, any>;

    // Handle NestJS validation pipe errors
    if (Array.isArray(responseObj.message)) {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        validationErrors: responseObj.message.map((msg: string) => {
          // Parse validation message format: "property constraint"
          const [field, ...messageParts] = msg.split(' ');
          return {
            field: field || 'unknown',
            message: msg,
          };
        }),
        stack: this.options.includeStackTrace ? stack : undefined,
      };
    }

    return {
      code: responseObj.errorCode || responseObj.code || errorCode,
      message: responseObj.message || 'An error occurred',
      details: responseObj.details,
      validationErrors: responseObj.validationErrors,
      stack: this.options.includeStackTrace ? stack : undefined,
    };
  }

  /**
   * Map HTTP status code to error code
   */
  private getErrorCodeFromStatus(statusCode: number): ErrorCode {
    const statusCodeMap: Record<number, ErrorCode> = {
      [HttpStatus.BAD_REQUEST]: ErrorCode.INVALID_INPUT,
      [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
      [HttpStatus.CONFLICT]: ErrorCode.RESOURCE_CONFLICT,
      [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
      [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
      [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_SERVER_ERROR,
      [HttpStatus.BAD_GATEWAY]: ErrorCode.EXTERNAL_SERVICE_ERROR,
      [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
      [HttpStatus.GATEWAY_TIMEOUT]: ErrorCode.TIMEOUT_ERROR,
    };

    return statusCodeMap[statusCode] || ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Get safe error message (hide internal details in production)
   */
  private getSafeErrorMessage(error: Error): string {
    if (process.env.NODE_ENV === 'production') {
      // Hide internal error details in production
      return 'An internal error occurred';
    }
    return error.message;
  }

  /**
   * Get or generate request ID
   */
  private getRequestId(request: ExtendedRequest): string {
    return (
      request.requestId ||
      request.id ||
      (request.headers[this.options.requestIdHeader!] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      uuidv4()
    );
  }

  /**
   * Log error with context
   */
  private logError(
    exception: unknown,
    request: ExtendedRequest,
    requestId: string,
    statusCode: number,
  ): void {
    const errorContext = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (statusCode >= 500) {
      // Log server errors as errors
      if (exception instanceof Error) {
        this.logger.error(
          `[${requestId}] ${exception.message}`,
          exception.stack,
          JSON.stringify(errorContext),
        );
      } else {
        this.logger.error(
          `[${requestId}] Unknown error`,
          JSON.stringify(errorContext),
        );
      }
    } else if (statusCode >= 400) {
      // Log client errors as warnings
      if (exception instanceof Error) {
        this.logger.warn(
          `[${requestId}] ${exception.message}`,
          JSON.stringify(errorContext),
        );
      } else {
        this.logger.warn(
          `[${requestId}] Client error`,
          JSON.stringify(errorContext),
        );
      }
    }
  }
}

/**
 * Factory function to create exception filter with options
 */
export function createExceptionFilter(
  options?: ExceptionFilterOptions,
): GlobalExceptionFilter {
  return new GlobalExceptionFilter(options);
}
