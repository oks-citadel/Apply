import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';

import { SERVICE_AUTH_HEADERS } from './service-auth.constants';
import { ServiceAuthService } from './service-auth.service';

/**
 * ServiceAuthInterceptor injects service authentication headers
 * into outgoing requests made through NestJS HttpService.
 *
 * This interceptor should be applied globally or to controllers
 * that make outgoing HTTP requests to other services.
 *
 * @example
 * ```typescript
 * // Apply globally in main.ts
 * app.useGlobalInterceptors(new ServiceAuthInterceptor(serviceAuthService));
 *
 * // Or apply to a specific controller
 * @UseInterceptors(ServiceAuthInterceptor)
 * @Controller('jobs')
 * export class JobsController {}
 * ```
 */
@Injectable()
export class ServiceAuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ServiceAuthInterceptor.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly serviceAuthService: ServiceAuthService) {
    // ServiceAuthService is injected for future use in request enrichment
    // Keeping reference for potential future header enrichment
    void this.serviceAuthService;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Ensure request has correlation ID
    if (!request.headers[SERVICE_AUTH_HEADERS.CORRELATION_ID.toLowerCase()]) {
      request.headers[SERVICE_AUTH_HEADERS.CORRELATION_ID.toLowerCase()] = randomUUID();
    }

    const correlationId = request.headers[SERVICE_AUTH_HEADERS.CORRELATION_ID.toLowerCase()];

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.debug(
            `Request completed [${correlationId}] in ${duration}ms`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `Request failed [${correlationId}] in ${duration}ms: ${error.message}`,
          );
        },
      }),
    );
  }
}

/**
 * ServiceRequestLoggingInterceptor logs incoming service requests
 * with authentication context.
 *
 * @example
 * ```typescript
 * @UseInterceptors(ServiceRequestLoggingInterceptor)
 * @Controller('internal')
 * export class InternalController {}
 * ```
 */
@Injectable()
export class ServiceRequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ServiceRequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const serviceAuth = request.serviceAuth;

    const caller = serviceAuth?.serviceName || 'anonymous';
    const authMethod = serviceAuth?.authMethod || 'none';
    const correlationId = request.headers[SERVICE_AUTH_HEADERS.CORRELATION_ID.toLowerCase()] ||
                         request.headers['x-request-id'] ||
                         'unknown';

    this.logger.log(
      `[${correlationId}] Incoming ${method} ${url} from ${caller} (auth: ${authMethod})`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${correlationId}] Completed ${method} ${url} in ${duration}ms`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${correlationId}] Failed ${method} ${url} in ${duration}ms: ${error.message}`,
          );
        },
      }),
    );
  }
}

/**
 * AxiosServiceAuthInterceptor is designed to work with NestJS HttpModule
 * to automatically inject service authentication headers into outgoing requests.
 *
 * This should be configured when registering HttpModule:
 *
 * @example
 * ```typescript
 * HttpModule.registerAsync({
 *   imports: [ServiceAuthModule],
 *   useFactory: (serviceAuthService: ServiceAuthService) => ({
 *     timeout: 10000,
 *     headers: serviceAuthService.createAuthHeaders(),
 *   }),
 *   inject: [ServiceAuthService],
 * })
 * ```
 */
export function createAxiosInterceptor(serviceAuthService: ServiceAuthService) {
  return {
    /**
     * Request interceptor to add service auth headers
     */
    requestInterceptor: (config: Record<string, unknown>) => {
      const authHeaders = serviceAuthService.createAuthHeaders();

      // Merge auth headers with existing headers
      config.headers = {
        ...(config.headers as Record<string, string>),
        ...authHeaders,
      };

      return config;
    },

    /**
     * Response interceptor for logging
     */
    responseInterceptor: <T>(response: T): T => {
      return response;
    },

    /**
     * Error interceptor for handling auth failures
     */
    errorInterceptor: (error: { response?: { status?: number; data?: { message?: string } }; message?: string }) => {
      // Log authentication failures
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error(
          `Service authentication failed: ${error.response?.data?.message || error.message}`,
        );
      }
      return Promise.reject(error);
    },
  };
}
