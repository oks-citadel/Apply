"use strict";
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
function createChildSpan(name, attributes) {
    return createSpan(name, {
        attributes,
        parentContext: api_1.context.active(),
    });
}
function addBusinessContext(contextAttrs) {
    const span = api_1.trace.getActiveSpan();
    if (span) {
        span.setAttributes(contextAttrs);
    }
}
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
function recordEvent(name, attributes) {
    const span = api_1.trace.getActiveSpan();
    if (span) {
        span.addEvent(name, attributes);
    }
}
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
function propagateTraceContext(headers = {}) {
    const carrier = { ...headers };
    api_1.trace.getTracer('applyforus-tracer');
    const currentContext = api_1.context.active();
    return carrier;
}
function extractSpanMetrics(span) {
    return {
        name: 'unknown',
        attributes: {},
    };
}
//# sourceMappingURL=tracing.js.map