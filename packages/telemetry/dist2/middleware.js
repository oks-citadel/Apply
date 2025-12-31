"use strict";
/**
 * Middleware for trace context propagation and correlation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserContextMiddleware = exports.TraceContextMiddleware = void 0;
exports.traceContextMiddleware = traceContextMiddleware;
exports.userContextMiddleware = userContextMiddleware;
exports.customContextMiddleware = customContextMiddleware;
exports.getCorrelationId = getCorrelationId;
exports.injectCorrelationId = injectCorrelationId;
exports.propagateContext = propagateContext;
exports.extractContext = extractContext;
exports.createTracedHttpClient = createTracedHttpClient;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
const uuid_1 = require("uuid");
/**
 * NestJS middleware for trace context and correlation ID handling
 *
 * This middleware:
 * - Extracts trace context from incoming requests (W3C Trace Context)
 * - Generates or forwards correlation IDs (X-Request-ID)
 * - Adds correlation IDs to response headers
 * - Creates a span for the entire request lifecycle
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
 * import { TraceContextMiddleware } from '@applyforus/telemetry';
 *
 * @Module({
 *   // ...
 * })
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(TraceContextMiddleware).forRoutes('*');
 *   }
 * }
 * ```
 */
let TraceContextMiddleware = class TraceContextMiddleware {
    use(req, res, next) {
        // Generate or extract correlation ID
        const correlationId = req.headers['x-request-id'] || (0, uuid_1.v4)();
        // Store correlation ID in request for later use
        req.correlationId = correlationId;
        // Add correlation ID to response headers
        res.setHeader('X-Request-ID', correlationId);
        // Extract trace context from incoming request headers
        const extractedContext = api_1.propagation.extract(api_1.context.active(), req.headers);
        // Get current tracer
        const tracer = api_1.trace.getTracer('applyforus-tracer');
        // Create a span for this request
        const span = tracer.startSpan(`${req.method} ${req.path}`, {
            attributes: {
                'http.method': req.method,
                'http.url': req.url,
                'http.target': req.path,
                'http.host': req.hostname,
                'http.scheme': req.protocol,
                'http.user_agent': req.headers['user-agent'] || 'unknown',
                'http.request_id': correlationId,
                'http.route': req.route?.path || req.path,
            },
        }, extractedContext);
        // Execute the request within the span context
        api_1.context.with(api_1.trace.setSpan(extractedContext, span), () => {
            // Track response
            res.on('finish', () => {
                span.setAttribute('http.status_code', res.statusCode);
                // Set span status based on HTTP status code
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                }
                else if (res.statusCode >= 400 && res.statusCode < 500) {
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: `Client error: ${res.statusCode}`,
                    });
                }
                else if (res.statusCode >= 500) {
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: `Server error: ${res.statusCode}`,
                    });
                }
                span.end();
            });
            // Handle request errors
            res.on('error', (error) => {
                span.recordException(error);
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error.message,
                });
                span.end();
            });
            next();
        });
    }
};
exports.TraceContextMiddleware = TraceContextMiddleware;
exports.TraceContextMiddleware = TraceContextMiddleware = tslib_1.__decorate([
    (0, common_1.Injectable)()
], TraceContextMiddleware);
/**
 * Express middleware for trace context propagation
 *
 * Use this for Express applications or non-NestJS services
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { traceContextMiddleware } from '@applyforus/telemetry';
 *
 * const app = express();
 * app.use(traceContextMiddleware);
 * ```
 */
function traceContextMiddleware(req, res, next) {
    const middleware = new TraceContextMiddleware();
    middleware.use(req, res, next);
}
/**
 * Middleware to extract and store user context in trace
 *
 * This should be applied AFTER authentication middleware
 *
 * @example
 * ```typescript
 * // app.module.ts
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(TraceContextMiddleware)
 *       .forRoutes('*')
 *       .apply(UserContextMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 */
let UserContextMiddleware = class UserContextMiddleware {
    use(req, res, next) {
        const span = api_1.trace.getActiveSpan();
        if (span && req.user) {
            const user = req.user;
            // Add user context to span
            span.setAttributes({
                'user.id': user.id || user.userId || 'unknown',
                'user.email': user.email || 'unknown',
                'user.role': user.role || 'unknown',
            });
            // Add tenant context if available
            if (user.tenantId) {
                span.setAttribute('tenant.id', user.tenantId);
            }
            if (user.organizationId) {
                span.setAttribute('organization.id', user.organizationId);
            }
        }
        next();
    }
};
exports.UserContextMiddleware = UserContextMiddleware;
exports.UserContextMiddleware = UserContextMiddleware = tslib_1.__decorate([
    (0, common_1.Injectable)()
], UserContextMiddleware);
/**
 * Express middleware for user context
 */
function userContextMiddleware(req, res, next) {
    const middleware = new UserContextMiddleware();
    middleware.use(req, res, next);
}
/**
 * Middleware to add custom business context to traces
 *
 * @param contextExtractor - Function to extract context from request
 * @returns Express middleware
 *
 * @example
 * ```typescript
 * app.use(customContextMiddleware((req) => ({
 *   'application.feature': req.headers['x-feature-flag'],
 *   'application.client': req.headers['x-client-id'],
 * })));
 * ```
 */
function customContextMiddleware(contextExtractor) {
    return (req, res, next) => {
        const span = api_1.trace.getActiveSpan();
        if (span) {
            try {
                const customContext = contextExtractor(req);
                span.setAttributes(customContext);
            }
            catch (error) {
                console.error('[Telemetry] Error extracting custom context:', error);
            }
        }
        next();
    };
}
/**
 * Get correlation ID from request
 *
 * @param req - Express request object
 * @returns Correlation ID
 */
function getCorrelationId(req) {
    return req.correlationId || req.headers['x-request-id'] || 'unknown';
}
/**
 * Inject correlation ID into headers for outgoing requests
 *
 * @param req - Current request
 * @param headers - Headers object to inject into
 * @returns Headers with correlation ID
 *
 * @example
 * ```typescript
 * const headers = injectCorrelationId(req, {
 *   'Content-Type': 'application/json'
 * });
 *
 * await fetch('https://api.example.com', { headers });
 * ```
 */
function injectCorrelationId(req, headers = {}) {
    const correlationId = getCorrelationId(req);
    return {
        ...headers,
        'X-Request-ID': correlationId,
    };
}
/**
 * Propagate trace context to outgoing HTTP requests
 *
 * @param headers - Headers object to inject trace context into
 * @returns Headers with trace context
 *
 * @example
 * ```typescript
 * const headers = propagateContext({
 *   'Content-Type': 'application/json'
 * });
 *
 * await httpClient.get('https://api.example.com', { headers });
 * ```
 */
function propagateContext(headers = {}) {
    const carrier = { ...headers };
    // Inject current context into headers
    api_1.propagation.inject(api_1.context.active(), carrier);
    return carrier;
}
/**
 * Extract trace context from incoming message headers
 *
 * Useful for message queue consumers
 *
 * @param headers - Message headers
 * @returns Extracted context
 *
 * @example
 * ```typescript
 * const extractedContext = extractContext(message.headers);
 *
 * context.with(extractedContext, () => {
 *   // Process message within trace context
 *   processMessage(message);
 * });
 * ```
 */
function extractContext(headers) {
    return api_1.propagation.extract(api_1.context.active(), headers);
}
/**
 * Create HTTP client with automatic trace propagation
 *
 * @param baseURL - Base URL for HTTP client
 * @returns HTTP client configuration with interceptors
 *
 * @example
 * ```typescript
 * import axios from 'axios';
 * import { createTracedHttpClient } from '@applyforus/telemetry';
 *
 * const client = axios.create(createTracedHttpClient('https://api.example.com'));
 * ```
 */
function createTracedHttpClient(baseURL) {
    return {
        baseURL,
        headers: propagateContext(),
    };
}
//# sourceMappingURL=middleware.js.map