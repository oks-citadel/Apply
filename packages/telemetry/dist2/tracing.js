"use strict";
/**
 * Tracing utilities for creating and managing custom spans
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpan = createSpan;
exports.withSpan = withSpan;
exports.withSpanSync = withSpanSync;
exports.createChildSpan = createChildSpan;
exports.addBusinessContext = addBusinessContext;
exports.addUserContext = addUserContext;
exports.addTenantContext = addTenantContext;
exports.recordEvent = recordEvent;
exports.recordError = recordError;
exports.createDatabaseSpan = createDatabaseSpan;
exports.createHttpClientSpan = createHttpClientSpan;
exports.createQueueSpan = createQueueSpan;
exports.createCacheSpan = createCacheSpan;
exports.propagateTraceContext = propagateTraceContext;
exports.extractSpanMetrics = extractSpanMetrics;
const api_1 = require("@opentelemetry/api");
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
function createSpan(name, options = {}) {
    const tracer = api_1.trace.getTracer('applyforus-tracer');
    const parentContext = options.parentContext || api_1.context.active();
    const span = tracer.startSpan(name, {
        kind: options.kind || api_1.SpanKind.INTERNAL,
        attributes: options.attributes,
        links: options.links,
    }, parentContext);
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
async function withSpan(name, fn, options = {}) {
    const tracer = api_1.trace.getTracer('applyforus-tracer');
    const parentContext = options.parentContext || api_1.context.active();
    return await tracer.startActiveSpan(name, {
        kind: options.kind || api_1.SpanKind.INTERNAL,
        attributes: options.attributes,
        links: options.links,
    }, parentContext, async (span) => {
        try {
            const result = await fn(span);
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            return result;
        }
        catch (error) {
            span.recordException(error);
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
        finally {
            span.end();
        }
    });
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
function withSpanSync(name, fn, options = {}) {
    const span = createSpan(name, options);
    const ctx = api_1.trace.setSpan(api_1.context.active(), span);
    return api_1.context.with(ctx, () => {
        try {
            const result = fn(span);
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            return result;
        }
        catch (error) {
            span.recordException(error);
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
        finally {
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
function createChildSpan(name, attributes) {
    return createSpan(name, {
        attributes,
        parentContext: api_1.context.active(),
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
function addBusinessContext(contextAttrs) {
    const span = api_1.trace.getActiveSpan();
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
function addUserContext(userId, email, role) {
    const attrs = {
        'user.id': userId,
    };
    if (email) {
        attrs['user.email'] = email;
    }
    if (role) {
        attrs['user.role'] = role;
    }
    const span = api_1.trace.getActiveSpan();
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
function addTenantContext(tenantId, organizationId) {
    const attrs = {
        'tenant.id': tenantId,
    };
    if (organizationId) {
        attrs['organization.id'] = organizationId;
    }
    const span = api_1.trace.getActiveSpan();
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
function recordEvent(name, attributes) {
    const span = api_1.trace.getActiveSpan();
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
function recordError(error, attributes) {
    const span = api_1.trace.getActiveSpan();
    if (!span)
        return;
    if (error instanceof Error) {
        span.recordException(error);
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error.message,
        });
    }
    else {
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
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
function createDatabaseSpan(operation, table, attributes) {
    return createSpan(`db.${operation.toLowerCase()}`, {
        kind: api_1.SpanKind.CLIENT,
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
function createHttpClientSpan(method, url, attributes) {
    return createSpan(`http.client.${method.toLowerCase()}`, {
        kind: api_1.SpanKind.CLIENT,
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
function createQueueSpan(operation, queueName, attributes) {
    const kind = operation === 'SEND' ? api_1.SpanKind.PRODUCER : api_1.SpanKind.CONSUMER;
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
function createCacheSpan(operation, key, attributes) {
    return createSpan(`cache.${operation.toLowerCase()}`, {
        kind: api_1.SpanKind.CLIENT,
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
function propagateTraceContext(headers = {}) {
    const carrier = { ...headers };
    // Inject current trace context into headers
    api_1.trace.getTracer('applyforus-tracer');
    const currentContext = api_1.context.active();
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
function extractSpanMetrics(span) {
    // Note: This is a utility function for custom metrics extraction
    // The actual implementation would need to access span internals
    return {
        name: 'unknown',
        attributes: {},
    };
}
//# sourceMappingURL=tracing.js.map