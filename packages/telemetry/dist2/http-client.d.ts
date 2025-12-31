/**
 * HTTP Client with automatic trace context propagation
 * Ensures distributed tracing works across service boundaries
 */
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
export declare class TracedHttpClient {
    private baseURL;
    private defaultTimeout;
    private defaultHeaders;
    private serviceName;
    constructor(config?: HttpClientConfig);
    /**
     * Perform HTTP GET request with tracing
     */
    get<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    /**
     * Perform HTTP POST request with tracing
     */
    post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    /**
     * Perform HTTP PUT request with tracing
     */
    put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    /**
     * Perform HTTP PATCH request with tracing
     */
    patch<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    /**
     * Perform HTTP DELETE request with tracing
     */
    delete<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
    /**
     * Perform HTTP request with automatic trace propagation
     */
    request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * Execute the actual HTTP request using native fetch
     */
    private executeRequest;
    /**
     * Prepare request headers by merging defaults with provided headers
     */
    private prepareHeaders;
    /**
     * Resolve full URL from base URL and path
     */
    private resolveURL;
    /**
     * Extract path from URL
     */
    private extractPath;
    /**
     * Extract scheme from URL
     */
    private extractScheme;
    /**
     * Extract host from URL
     */
    private extractHost;
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
export declare function createHttpClient(config?: HttpClientConfig): TracedHttpClient;
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
export declare function injectTraceContext(headers?: Record<string, string>): Record<string, string>;
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
export declare function extractTraceContext(headers: Record<string, string>): import("@opentelemetry/api").Context;
//# sourceMappingURL=http-client.d.ts.map