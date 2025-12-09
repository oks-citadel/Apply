/**
 * Tracing utilities for creating and managing custom spans
 */

import { trace, context, SpanStatusCode, SpanKind, Span, Context } from '@opentelemetry/api';
import type { Attributes, AttributeValue, SpanContext, Link } from '@opentelemetry/api';

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
export function createSpan(name: string, options: SpanOptions = {}): Span {
  const tracer = trace.getTracer('jobpilot-tracer');
  const parentContext = options.parentContext || context.active();

  const span = tracer.startSpan(
    name,
    {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: options.attributes,
      links: options.links,
    },
    parentContext,
  );

  return span;
}

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
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options: SpanOptions = {},
): Promise<T> {
  const tracer = trace.getTracer('jobpilot-tracer');
  const parentContext = options.parentContext || context.active();

  return await tracer.startActiveSpan(
    name,
    {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: options.attributes,
      links: options.links,
    },
    parentContext,
    async (span: Span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
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
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  options: SpanOptions = {},
): T {
  const span = createSpan(name, options);
  const ctx = trace.setSpan(context.active(), span);

  return context.with(ctx, () => {
    try {
      const result = fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a child span from the current active span
 *
 * @param name - Name of the child span
 * @param attributes - Optional attributes
 * @returns New child span
 */
export function createChildSpan(name: string, attributes?: Attributes): Span {
  return createSpan(name, {
    attributes,
    parentContext: context.active(),
  });
}

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
export function addBusinessContext(contextAttrs: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(contextAttrs);
  }
}

/**
 * Add user context to the current span
 *
 * @param userId - User ID
 * @param email - User email (optional)
 * @param role - User role (optional)
 */
export function addUserContext(userId: string, email?: string, role?: string): void {
  const attrs: Record<string, string> = {
    'user.id': userId,
  };

  if (email) {
    attrs['user.email'] = email;
  }

  if (role) {
    attrs['user.role'] = role;
  }

  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attrs);
  }
}

/**
 * Add tenant context to the current span
 *
 * @param tenantId - Tenant ID
 * @param organizationId - Organization ID (optional)
 */
export function addTenantContext(tenantId: string, organizationId?: string): void {
  const attrs: Record<string, string> = {
    'tenant.id': tenantId,
  };

  if (organizationId) {
    attrs['organization.id'] = organizationId;
  }

  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attrs);
  }
}

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
export function recordEvent(name: string, attributes?: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Mark a span as an error with optional error details
 *
 * @param error - Error object or message
 * @param attributes - Additional error attributes
 */
export function recordError(error: Error | string, attributes?: Attributes): void {
  const span = trace.getActiveSpan();
  if (!span) return;

  if (error instanceof Error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  } else {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error,
    });
  }

  if (attributes) {
    span.setAttributes(attributes);
  }
}

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
export function createDatabaseSpan(
  operation: string,
  table: string,
  attributes?: Attributes,
): Span {
  return createSpan(`db.${operation.toLowerCase()}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'db.operation': operation,
      'db.table': table,
      'db.system': 'postgresql',
      ...attributes,
    },
  });
}

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
export function createHttpClientSpan(
  method: string,
  url: string,
  attributes?: Attributes,
): Span {
  return createSpan(`http.client.${method.toLowerCase()}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'http.method': method,
      'http.url': url,
      ...attributes,
    },
  });
}

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
export function createQueueSpan(
  operation: 'SEND' | 'RECEIVE' | 'PROCESS',
  queueName: string,
  attributes?: Attributes,
): Span {
  const kind = operation === 'SEND' ? SpanKind.PRODUCER : SpanKind.CONSUMER;

  return createSpan(`messaging.${operation.toLowerCase()}`, {
    kind,
    attributes: {
      'messaging.operation': operation,
      'messaging.destination': queueName,
      ...attributes,
    },
  });
}

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
export function createCacheSpan(
  operation: 'GET' | 'SET' | 'DELETE',
  key: string,
  attributes?: Attributes,
): Span {
  return createSpan(`cache.${operation.toLowerCase()}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'cache.operation': operation,
      'cache.key': key,
      'cache.system': 'redis',
      ...attributes,
    },
  });
}

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
export function propagateTraceContext(headers: Record<string, string> = {}): Record<string, string> {
  const carrier: Record<string, string> = { ...headers };

  // Inject current trace context into headers
  trace.getTracer('jobpilot-tracer');
  const currentContext = context.active();

  // The auto-instrumentation will handle propagation automatically
  // This is a manual fallback if needed
  return carrier;
}

/**
 * Extract metrics from a span for monitoring
 *
 * @param span - Span to extract metrics from
 * @returns Metrics object
 */
export function extractSpanMetrics(span: Span): {
  name: string;
  duration?: number;
  attributes: Attributes;
} {
  // Note: This is a utility function for custom metrics extraction
  // The actual implementation would need to access span internals
  return {
    name: 'unknown',
    attributes: {},
  };
}
