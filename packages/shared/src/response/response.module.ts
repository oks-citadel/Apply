/**
 * Response Module
 *
 * NestJS module that provides standardized response handling
 */

import { Module, DynamicModule, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, Reflector } from '@nestjs/core';
import {
  StandardResponseInterceptor,
  ResponseInterceptorOptions,
} from './response.interceptor';
import {
  GlobalExceptionFilter,
  ExceptionFilterOptions,
} from './exception.filter';

/**
 * Configuration options for the Response Module
 */
export interface ResponseModuleOptions {
  /** Options for the response interceptor */
  interceptor?: ResponseInterceptorOptions;
  /** Options for the exception filter */
  exceptionFilter?: ExceptionFilterOptions;
  /** Whether to apply the interceptor globally */
  globalInterceptor?: boolean;
  /** Whether to apply the exception filter globally */
  globalExceptionFilter?: boolean;
}

/**
 * Response Module
 *
 * Provides standardized API response handling for NestJS applications.
 * Automatically wraps responses in the standard format and handles exceptions.
 *
 * @example
 * ```typescript
 * // Basic usage - apply globally
 * @Module({
 *   imports: [
 *     ResponseModule.forRoot({
 *       globalInterceptor: true,
 *       globalExceptionFilter: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // Advanced usage with options
 * @Module({
 *   imports: [
 *     ResponseModule.forRoot({
 *       interceptor: {
 *         apiVersion: '2.0',
 *         includeExecutionTime: true,
 *       },
 *       exceptionFilter: {
 *         includeStackTrace: false,
 *       },
 *       globalInterceptor: true,
 *       globalExceptionFilter: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class ResponseModule {
  /**
   * Register the module with configuration
   */
  static forRoot(options: ResponseModuleOptions = {}): DynamicModule {
    const {
      interceptor: interceptorOptions = {},
      exceptionFilter: filterOptions = {},
      globalInterceptor = true,
      globalExceptionFilter = true,
    } = options;

    const providers: any[] = [];

    // Add global interceptor if enabled
    if (globalInterceptor) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useFactory: (reflector: Reflector) => {
          return new StandardResponseInterceptor(reflector, interceptorOptions);
        },
        inject: [Reflector],
      });
    }

    // Add global exception filter if enabled
    if (globalExceptionFilter) {
      providers.push({
        provide: APP_FILTER,
        useFactory: () => {
          return new GlobalExceptionFilter(filterOptions);
        },
      });
    }

    // Export the interceptor and filter for manual use
    providers.push(
      {
        provide: StandardResponseInterceptor,
        useFactory: (reflector: Reflector) => {
          return new StandardResponseInterceptor(reflector, interceptorOptions);
        },
        inject: [Reflector],
      },
      {
        provide: GlobalExceptionFilter,
        useFactory: () => {
          return new GlobalExceptionFilter(filterOptions);
        },
      },
    );

    return {
      module: ResponseModule,
      providers,
      exports: [StandardResponseInterceptor, GlobalExceptionFilter],
      global: true,
    };
  }
}
