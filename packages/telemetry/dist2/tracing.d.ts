/**
 * Tracing utilities for creating and managing custom spans
 */
import { SpanKind, Span, Context } from '@opentelemetry/api';
import type { Attributes, Link } from '@opentelemetry/api';
/**
 * Options for creating a span
 */
export interface SpanOptions {
    /**
     * Span kind (CLIENT, SERVER, INTERNAL, PRODUCER, CONSUMER)
     */
    kind?: SpanKind;
    /**
     * Initial attributes for the span
     */
    attributes?: Attributes;
    /**
     * Parent context (defaults to current active context)
     */
    parentContext?: Context;
    /**
     * Links to other spans
     */
    links?: Link[];
}
/**
 * Create and start a new span
 *
 * @param name - Name of the span (should be descriptive, e.g., "process_job_application")
 * @param options - Span configuration options
 * @returns Active span
 *
 * @example
 * ```typescript
 * const span = createSpan('process_payment', {
 *   kind: SpanKind.INTERNAL,
 *   attributes: {
 *     'payment.amount': 100,
 *     'payment.currency': 'USD',
 *     'user.id': userId
 *   }
 * });
 *
 * try {
 *   // Your code here
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (error) {
 *   span.recordException(error);
 *   span.setStatus({ code: SpanStatusCode.ERROR });
 * } finally {
 *   span.end();
 * }
 * ```
 */
export declare function createSpan(name: string, options?: SpanOptions): Span;
/**
 * Execute a function within a new span context
 *
 * Automatically handles span lifecycle (start, end, error recording)
 *
 * @param name - Name of the span
 * @param fn - Async function to execute within the span
 * @param options - Span configuration options
 * @returns Result of the function execution
 *
 * @example
 * ```typescript
 * const result = await withSpan('fetch_user_data', async (span) => {
 *   span.setAttribute('user.id', userId);
 *   const user = await userRepository.findOne(userId);
 *   span.setAttribute('user.email', user.email);
 *   return user;
 * }, { kind: SpanKind.INTERNAL });
 * ```
 */
export declare function withSpan<T>(name: string, fn: (span: Span) => Promise<T>, options?: SpanOptions): Promise<T>;
/**
 * Execute a synchronous function within a new span context
 *
 * @param name - Name of the span
 * @param fn - Synchronous function to execute within the span
 * @param options - Span configuration options
 * @returns Result of the function execution
 *
 * @example
 * ```typescript
 * const result = withSpanSync('validate_input', (span) => {
 *   span.setAttribute('input.length', input.length);
 *   return validateInput(input);
 * });
 * ```
 */
export declare function withSpanSync<T>(name: string, fn: (span: Span) => T, options?: SpanOptions): T;
/**
 * Create a child span from the current active span
 *
 * @param name - Name of the child span
 * @param attributes - Optional attributes
 * @returns New child span
 */
export declare function createChildSpan(name: string, attributes?: Attributes): Span;
/**
 * Add business context attributes to the current span
 *
 * @param context - Business context (tenant ID, user ID, etc.)
 *
 * @example
 * ```typescript
 * addBusinessContext({
 *   'tenant.id': 'tenant-123',
 *   'user.id': 'user-456',
 *   'user.email': 'user@example.com',
 *   'organization.id': 'org-789'
 * });
 * ```
 */
export declare function addBusinessContext(contextAttrs: Attributes): void;
/**
 * Add user context to the current span
 *
 * @param userId - User ID
 * @param email - User email (optional)
 * @param role - User role (optional)
 */
export declare function addUserContext(userId: string, email?: string, role?: string): void;
/**
 * Add tenant context to the current span
 *
 * @param tenantId - Tenant ID
 * @param organizationId - Organization ID (optional)
 */
export declare function addTenantContext(tenantId: string, organizationId?: string): void;
/**
 * Record a custom event in the current span
 *
 * @param name - Event name
 * @param attributes - Event attributes
 *
 * @example
 * ```typescript
 * recordEvent('job_application_submitted', {
 *   'job.id': jobId,
 *   'application.status': 'pending',
 *   'resume.uploaded': true
 * });
 * ```
 */
export declare function recordEvent(name: string, attributes?: Attributes): void;
/**
 * Mark a span as an error with optional error details
 *
 * @param error - Error object or message
 * @param attributes - Additional error attributes
 */
export declare function recordError(error: Error | string, attributes?: Attributes): void;
/**
 * Create a span for database operations
 *
 * @param operation - Database operation (SELECT, INSERT, UPDATE, DELETE)
 * @param table - Table name
 * @param attributes - Additional attributes
 * @returns Database operation span
 *
 * @example
 * ```typescript
 * const span = createDatabaseSpan('SELECT', 'users', {
 *   'db.sql.query': 'SELECT * FROM users WHERE id = $1',
 *   'db.parameters': JSON.stringify([userId])
 * });
 * ```
 */
export declare function createDatabaseSpan(operation: string, table: string, attributes?: Attributes): Span;
/**
 * Create a span for HTTP client requests
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - Request URL
 * @param attributes - Additional attributes
 * @returns HTTP client span
 *
 * @example
 * ```typescript
 * const span = createHttpClientSpan('POST', 'https://api.example.com/users', {
 *   'http.request.body.size': bodySize,
 *   'http.request.header.content-type': 'application/json'
 * });
 * ```
 */
export declare function createHttpClientSpan(method: string, url: string, attributes?: Attributes): Span;
/**
 * Create a span for message queue operations
 *
 * @param operation - Operation type (SEND, RECEIVE, PROCESS)
 * @param queueName - Queue name
 * @param attributes - Additional attributes
 * @returns Message queue span
 *
 * @example
 * ```typescript
 * const span = createQueueSpan('SEND', 'email-notifications', {
 *   'messaging.message_id': messageId,
 *   'messaging.destination': 'email-notifications',
 *   'messaging.system': 'redis'
 * });
 * ```
 */
export declare function createQueueSpan(operation: 'SEND' | 'RECEIVE' | 'PROCESS', queueName: string, attributes?: Attributes): Span;
/**
 * Create a span for cache operations
 *
 * @param operation - Cache operation (GET, SET, DELETE)
 * @param key - Cache key
 * @param attributes - Additional attributes
 * @returns Cache operation span
 *
 * @example
 * ```typescript
 * const span = createCacheSpan('GET', 'user:123', {
 *   'cache.hit': true,
 *   'cache.system': 'redis'
 * });
 * ```
 */
export declare function createCacheSpan(operation: 'GET' | 'SET' | 'DELETE', key: string, attributes?: Attributes): Span;
/**
 * Propagate trace context to external service calls
 *
 * @param headers - HTTP headers object to inject trace context into
 * @returns Headers with trace context
 *
 * @example
 * ```typescript
 * const headers = propagateTraceContext({
 *   'Content-Type': 'application/json',
 *   'Authorization': 'Bearer token'
 * });
 *
 * await fetch('https://api.example.com', { headers });
 * ```
 */
export declare function propagateTraceContext(headers?: Record<string, string>): Record<string, string>;
/**
 * Extract metrics from a span for monitoring
 *
 * @param span - Span to extract metrics from
 * @returns Metrics object
 */
export declare function extractSpanMetrics(span: Span): {
    name: string;
    duration?: number;
    attributes: Attributes;
};
//# sourceMappingURL=tracing.d.ts.map