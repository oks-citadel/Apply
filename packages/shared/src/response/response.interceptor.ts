/**
 * Standardized Response Interceptor
 *
 * NestJS interceptor that wraps all API responses in the standard format
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, PaginationMeta, SuccessResponse } from './types';

/**
 * Metadata key for skipping response transformation
 */
export const SKIP_RESPONSE_TRANSFORM_KEY = 'skipResponseTransform';

/**
 * Metadata key for pagination information
 */
export const PAGINATION_META_KEY = 'paginationMeta';

/**
 * Decorator to skip response transformation for specific endpoints
 * Useful for health checks, metrics, or streaming responses
 */
export const SkipResponseTransform = () =>
  SetMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true);

/**
 * Decorator to set pagination metadata on a response
 */
export const SetPagination = (pagination: Omit<PaginationMeta, 'totalPages' | 'hasNextPage' | 'hasPreviousPage'>) =>
  SetMetadata(PAGINATION_META_KEY, pagination);

/**
 * Extended request interface with request ID
 */
interface ExtendedRequest extends Request {
  id?: string;
  requestId?: string;
  startTime?: number;
}

/**
 * Response format returned by controllers before transformation
 */
export interface PaginatedControllerResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Type guard to check if response is paginated
 */
function isPaginatedResponse<T>(data: any): data is PaginatedControllerResponse<T> {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.items) &&
    data.pagination &&
    typeof data.pagination.page === 'number' &&
    typeof data.pagination.pageSize === 'number' &&
    typeof data.pagination.total === 'number'
  );
}

/**
 * Configuration options for the response interceptor
 */
export interface ResponseInterceptorOptions {
  /** API version to include in responses */
  apiVersion?: string;
  /** Whether to include execution time in responses */
  includeExecutionTime?: boolean;
  /** Custom request ID header name */
  requestIdHeader?: string;
  /** Custom correlation ID header name */
  correlationIdHeader?: string;
}

/**
 * Standardized Response Interceptor
 *
 * Wraps all successful API responses in the standard format:
 * {
 *   success: true,
 *   data: <response data>,
 *   meta: {
 *     timestamp: <ISO string>,
 *     requestId: <uuid>,
 *     pagination?: { ... },
 *     executionTimeMs?: <number>
 *   }
 * }
 *
 * @example
 * ```typescript
 * // Apply globally in main.ts
 * app.useGlobalInterceptors(new StandardResponseInterceptor(reflector));
 *
 * // Or in module
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: StandardResponseInterceptor,
 *     },
 *   ],
 * })
 * ```
 */
@Injectable()
export class StandardResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  private readonly logger = new Logger(StandardResponseInterceptor.name);
  private readonly options: ResponseInterceptorOptions;

  constructor(
    private readonly reflector?: Reflector,
    options: ResponseInterceptorOptions = {},
  ) {
    this.options = {
      apiVersion: options.apiVersion || '1.0',
      includeExecutionTime: options.includeExecutionTime ?? true,
      requestIdHeader: options.requestIdHeader || 'x-request-id',
      correlationIdHeader: options.correlationIdHeader || 'x-correlation-id',
    };
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // Only process HTTP requests
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<ExtendedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if transformation should be skipped
    const shouldSkip = this.reflector?.get<boolean>(
      SKIP_RESPONSE_TRANSFORM_KEY,
      context.getHandler(),
    );

    if (shouldSkip) {
      return next.handle();
    }

    // Get or generate request ID
    const requestId = this.getRequestId(request);

    // Store request ID on the request object for use elsewhere
    request.requestId = requestId;

    // Set request ID header on response
    response.setHeader(this.options.requestIdHeader!, requestId);

    // Record start time for execution time calculation
    const startTime = request.startTime || Date.now();
    request.startTime = startTime;

    return next.handle().pipe(
      map((data) => {
        // Handle null/undefined responses
        if (data === null || data === undefined) {
          return this.buildSuccessResponse(null as any, requestId, startTime);
        }

        // Check if response is already in standard format
        if (this.isStandardResponse(data)) {
          // Update metadata if needed
          if (!data.meta.requestId) {
            data.meta.requestId = requestId;
          }
          return data;
        }

        // Handle paginated responses
        if (isPaginatedResponse(data)) {
          return this.buildPaginatedResponse(
            data.items as any,
            data.pagination,
            requestId,
            startTime,
          );
        }

        // Check for pagination metadata from decorator
        const paginationMeta = this.reflector?.get<PaginationMeta>(
          PAGINATION_META_KEY,
          context.getHandler(),
        );

        if (paginationMeta && Array.isArray(data)) {
          return this.buildPaginatedResponse(
            data as any,
            paginationMeta,
            requestId,
            startTime,
          );
        }

        // Standard response
        return this.buildSuccessResponse(data, requestId, startTime);
      }),
    );
  }

  /**
   * Get or generate request ID from request headers
   */
  private getRequestId(request: ExtendedRequest): string {
    return (
      request.id ||
      request.requestId ||
      (request.headers[this.options.requestIdHeader!] as string) ||
      (request.headers[this.options.correlationIdHeader!] as string) ||
      uuidv4()
    );
  }

  /**
   * Build a standard success response
   */
  private buildSuccessResponse(
    data: T,
    requestId: string,
    startTime: number,
  ): SuccessResponse<T> {
    const executionTimeMs = this.options.includeExecutionTime
      ? Date.now() - startTime
      : undefined;

    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        executionTimeMs,
        apiVersion: this.options.apiVersion,
      },
    };
  }

  /**
   * Build a paginated success response
   */
  private buildPaginatedResponse(
    items: T[],
    pagination: { page: number; pageSize: number; total: number },
    requestId: string,
    startTime: number,
  ): SuccessResponse<{ items: T[] }> {
    const { page, pageSize, total } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const executionTimeMs = this.options.includeExecutionTime
      ? Date.now() - startTime
      : undefined;

    return {
      success: true,
      data: { items },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        executionTimeMs,
        apiVersion: this.options.apiVersion,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    };
  }

  /**
   * Check if the response is already in standard format
   */
  private isStandardResponse(data: any): data is ApiResponse {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.success === 'boolean' &&
      data.meta &&
      typeof data.meta === 'object' &&
      typeof data.meta.timestamp === 'string'
    );
  }
}
