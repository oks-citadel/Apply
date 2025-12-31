import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  SERVICE_AUTH_HEADERS,
  SERVICE_AUTH_DEFAULTS,
  DEFAULT_SERVICE_URLS,
  InternalService,
} from './service-auth.constants';
import {
  ServiceAuthClientOptions,
  ServiceRequestOptions,
  ServiceResponse,
  ServiceHealthResponse,
  ServiceErrorResponse,
} from './service-auth.types';
import { ServiceAuthService } from './service-auth.service';

/**
 * ServiceAuthClient provides authenticated HTTP client functionality
 * for making service-to-service requests.
 *
 * Features:
 * - Automatic authentication header injection
 * - Retry logic with exponential backoff
 * - Request timeout handling
 * - Request correlation ID propagation
 * - Health check utilities
 *
 * @example
 * ```typescript
 * // Create a client for the user service
 * const client = new ServiceAuthClient({
 *   baseUrl: 'http://user-service:8002',
 *   targetService: InternalService.USER_SERVICE,
 *   serviceName: 'job-service',
 * }, serviceAuthService);
 *
 * // Make a GET request
 * const response = await client.get('/api/v1/users/123');
 *
 * // Make a POST request
 * const response = await client.post('/api/v1/users', { name: 'John' });
 * ```
 */
@Injectable()
export class ServiceAuthClient {
  private readonly logger = new Logger(ServiceAuthClient.name);
  private readonly baseUrl: string;
  private readonly targetService: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    options: ServiceAuthClientOptions,
    private readonly serviceAuthService: ServiceAuthService,
  ) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.targetService = options.targetService;
    this.timeout = options.timeout || SERVICE_AUTH_DEFAULTS.REQUEST_TIMEOUT_MS;
    this.maxRetries = options.retry?.maxAttempts || SERVICE_AUTH_DEFAULTS.MAX_RETRY_ATTEMPTS;
    this.retryDelay = options.retry?.delayMs || SERVICE_AUTH_DEFAULTS.RETRY_DELAY_MS;

    this.logger.log(`ServiceAuthClient initialized for ${this.targetService}`);
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(
    path: string,
    options?: Omit<ServiceRequestOptions, 'method' | 'body'>,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<ServiceRequestOptions, 'method' | 'body'>,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<ServiceRequestOptions, 'method' | 'body'>,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<ServiceRequestOptions, 'method' | 'body'>,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(
    path: string,
    options?: Omit<ServiceRequestOptions, 'method' | 'body'>,
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Make a generic HTTP request
   */
  async request<T = unknown>(
    path: string,
    options: ServiceRequestOptions = {},
  ): Promise<ServiceResponse<T>> {
    const method = options.method || 'GET';
    const url = this.buildUrl(path, options.params);
    const headers = this.buildHeaders(options.headers);
    const timeout = options.timeout || this.timeout;
    const shouldRetry = options.retry !== false;

    let lastError: Error | null = null;
    const maxAttempts = shouldRetry ? this.maxRetries : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(url, {
          method,
          headers,
          body: options.body,
          timeout,
        });

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error;
        const isRetryable = this.isRetryableError(error);

        if (attempt < maxAttempts && isRetryable && shouldRetry) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          this.logger.warn(
            `Request to ${url} failed (attempt ${attempt}/${maxAttempts}). ` +
            `Retrying in ${delay}ms: ${error.message}`,
          );
          await this.sleep(delay);
        } else {
          this.logger.error(`Request to ${url} failed after ${attempt} attempts: ${error.message}`);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check the health of the target service
   */
  async healthCheck(): Promise<ServiceHealthResponse> {
    try {
      const response = await this.get<ServiceHealthResponse>('/health', { retry: false });
      return {
        ...response.data,
        status: response.data.status || 'ok',
        service: response.data.service || this.targetService,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        status: 'error',
        service: this.targetService,
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * Check if the target service is reachable
   */
  async isHealthy(): Promise<boolean> {
    const health = await this.healthCheck();
    return health.status === 'ok';
  }

  /**
   * Execute the HTTP request using fetch
   */
  private async executeRequest<T>(
    url: string,
    config: {
      method: string;
      headers: Record<string, string>;
      body?: unknown;
      timeout: number;
    },
  ): Promise<ServiceResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const fetchOptions: RequestInit = {
        method: config.method,
        headers: config.headers,
        signal: controller.signal,
      };

      if (config.body !== undefined) {
        fetchOptions.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse response body
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json() as T;
      } else {
        data = await response.text() as unknown as T;
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = data as Record<string, unknown>;
        const errorResponse: ServiceErrorResponse = {
          message: (errorData?.message as string) || response.statusText,
          code: errorData?.code as string,
          statusCode: response.status,
          details: errorData,
        };
        throw new ServiceRequestError(errorResponse);
      }

      // Convert headers to object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Build the full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${this.baseUrl}${normalizedPath}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        searchParams.append(key, String(value));
      }
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const authHeaders = this.serviceAuthService.createAuthHeaders();

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      [SERVICE_AUTH_HEADERS.CORRELATION_ID]: randomUUID(),
      ...authHeaders,
      ...customHeaders,
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    if (error instanceof ServiceRequestError) {
      // Retry on server errors (5xx) and specific client errors
      const status = error.statusCode;
      return status >= 500 || status === 408 || status === 429;
    }

    // Retry on network errors
    return error.name === 'AbortError' ||
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('ENOTFOUND') ||
           error.message.includes('ETIMEDOUT');
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error class for service request failures
 */
export class ServiceRequestError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(response: ServiceErrorResponse) {
    super(response.message);
    this.name = 'ServiceRequestError';
    this.statusCode = response.statusCode || 500;
    this.code = response.code;
    this.details = response.details;
  }
}

/**
 * Factory function to create a ServiceAuthClient for a specific service
 */
export function createServiceClient(
  targetService: InternalService,
  serviceAuthService: ServiceAuthService,
  options?: Partial<ServiceAuthClientOptions>,
): ServiceAuthClient {
  const baseUrl = options?.baseUrl ||
    process.env[`${targetService.toUpperCase().replace(/-/g, '_')}_URL`] ||
    DEFAULT_SERVICE_URLS[targetService];

  const serviceName = options?.serviceName ||
    process.env.SERVICE_NAME ||
    'unknown-service';

  return new ServiceAuthClient(
    {
      baseUrl,
      targetService,
      serviceName,
      ...options,
    },
    serviceAuthService,
  );
}
