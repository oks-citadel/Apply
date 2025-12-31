/**
 * Standardized API Response Module
 *
 * Provides consistent response formatting across all microservices.
 *
 * @module @applyforus/shared/response
 */

// Types and interfaces
export * from './types';

// Response builder utilities
export * from './response.builder';

// Response interceptor
export {
  StandardResponseInterceptor,
  SkipResponseTransform,
  SetPagination,
  SKIP_RESPONSE_TRANSFORM_KEY,
  PAGINATION_META_KEY,
  type ResponseInterceptorOptions,
  type PaginatedControllerResponse,
} from './response.interceptor';

// Exception filter
export {
  GlobalExceptionFilter,
  createExceptionFilter,
  type ExceptionFilterOptions,
} from './exception.filter';

// Custom exceptions
export * from './exceptions';

// NestJS module
export { ResponseModule, type ResponseModuleOptions } from './response.module';
