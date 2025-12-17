/**
 * HTTP Client with automatic trace context propagation
 * Ensures distributed tracing works across service boundaries
 */

import { context, propagation, trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  serviceName?: string;
}

export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

/**
 * HTTP Client with OpenTelemetry tracing support
 *
 * Automatically propagates trace context to downstream services using W3C Trace Context
 *
 * @example
 * ```typescript
 * import { createTracedHttpClient } from '@applyforus/telemetry';
 *
 * const client = createTracedHttpClient({
 *   baseURL: 'https://api.example.com',
 *   serviceName: 'user-service',
 * });
 *
 * const response = await client.get<User>('/users/123');
 * ```
 */
export class TracedHttpClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultHeaders: Record<string, string>;
  private serviceName: string;

  constructor(config: HttpClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.defaultTimeout = config.timeout || 30000;
    this.defaultHeaders = config.headers || {};
    this.serviceName = config.serviceName || 'unknown-service';
  }

  /**
   * Perform HTTP GET request with tracing
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      headers,
    });
  }

  /**
   * Perform HTTP POST request with tracing
   */
  async post<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      body,
      headers,
    });
  }

  /**
   * Perform HTTP PUT request with tracing
   */
  async put<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      body,
      headers,
    });
  }

  /**
   * Perform HTTP PATCH request with tracing
   */
  async patch<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      body,
      headers,
    });
  }

  /**
   * Perform HTTP DELETE request with tracing
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      headers,
    });
  }

  /**
   * Perform HTTP request with automatic trace propagation
   */
  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const tracer = trace.getTracer('applyforus-tracer');
    const fullURL = this.resolveURL(config.url);

    return tracer.startActiveSpan(
      `HTTP ${config.method} ${this.extractPath(fullURL)}`,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'http.method': config.method,
          'http.url': fullURL,
          'http.target': this.extractPath(fullURL),
          'http.scheme': this.extractScheme(fullURL),
          'http.host': this.extractHost(fullURL),
          'service.name': this.serviceName,
        },
      },
      async (span: Span) => {
        try {
          // Merge headers and inject trace context
          const headers = this.prepareHeaders(config.headers);
          const carrier: Record<string, string> = {};

          // Inject current trace context into headers
          propagation.inject(context.active(), carrier);

          // Merge propagated headers with request headers
          Object.assign(headers, carrier);

          // Make the HTTP request
          const response = await this.executeRequest<T>({
            ...config,
            headers,
            url: fullURL,
            timeout: config.timeout || this.defaultTimeout,
          });

          // Record response details
          span.setAttribute('http.status_code', response.status);
          span.setAttribute('http.response.size', JSON.stringify(response.data).length);

          // Set span status based on HTTP status
          if (response.status >= 200 && response.status < 400) {
            span.setStatus({ code: SpanStatusCode.OK });
          } else if (response.status >= 400 && response.status < 500) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Client error: ${response.status}`,
            });
          } else {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Server error: ${response.status}`,
            });
          }

          return response;
        } catch (error) {
          // Record exception
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  /**
   * Execute the actual HTTP request using native fetch
   */
  private async executeRequest<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const fetchConfig: RequestInit = {
        method: config.method,
        headers: config.headers,
        signal: controller.signal,
      };

      if (config.body) {
        fetchConfig.body = JSON.stringify(config.body);
        if (!config.headers?.['Content-Type']) {
          config.headers = config.headers || {};
          config.headers['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(config.url, fetchConfig);

      // Parse response body
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      // Convert Headers to plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Prepare request headers by merging defaults with provided headers
   */
  private prepareHeaders(headers?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...headers,
    };
  }

  /**
   * Resolve full URL from base URL and path
   */
  private resolveURL(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (this.baseURL) {
      const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    }

    return url;
  }

  /**
   * Extract path from URL
   */
  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  }

  /**
   * Extract scheme from URL
   */
  private extractScheme(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol.replace(':', '');
    } catch {
      return 'http';
    }
  }

  /**
   * Extract host from URL
   */
  private extractHost(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.host;
    } catch {
      return 'unknown';
    }
  }
}

/**
 * Create a traced HTTP client instance with full OpenTelemetry integration
 *
 * @param config - HTTP client configuration
 * @returns TracedHttpClient instance
 *
 * @example
 * ```typescript
 * const client = createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   serviceName: 'user-service',
 *   timeout: 10000,
 *   headers: {
 *     'X-API-Key': 'my-api-key',
 *   },
 * });
 *
 * // Automatically propagates trace context
 * const user = await client.get<User>('/users/123');
 * ```
 */
export function createHttpClient(config?: HttpClientConfig): TracedHttpClient {
  return new TracedHttpClient(config);
}

/**
 * Inject trace context into headers for manual HTTP requests
 *
 * Use this when you need to manually add trace context to headers
 *
 * @param headers - Existing headers object
 * @returns Headers with trace context injected
 *
 * @example
 * ```typescript
 * const headers = injectTraceContext({
 *   'Content-Type': 'application/json',
 *   'Authorization': 'Bearer token',
 * });
 *
 * await fetch('https://api.example.com/users', { headers });
 * ```
 */
export function injectTraceContext(headers: Record<string, string> = {}): Record<string, string> {
  const carrier: Record<string, string> = { ...headers };
  propagation.inject(context.active(), carrier);
  return carrier;
}

/**
 * Extract trace context from headers for incoming requests
 *
 * Use this to continue a trace from an incoming request
 *
 * @param headers - Request headers
 * @returns Context with trace information
 *
 * @example
 * ```typescript
 * const ctx = extractTraceContext(request.headers);
 * context.with(ctx, () => {
 *   // Your code here will be part of the distributed trace
 * });
 * ```
 */
export function extractTraceContext(headers: Record<string, string>) {
  return propagation.extract(context.active(), headers);
}
