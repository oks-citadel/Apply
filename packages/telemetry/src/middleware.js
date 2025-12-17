"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
const uuid_1 = require("uuid");
let TraceContextMiddleware = class TraceContextMiddleware {
    use(req, res, next) {
        const correlationId = req.headers['x-request-id'] || (0, uuid_1.v4)();
        req.correlationId = correlationId;
        res.setHeader('X-Request-ID', correlationId);
        const extractedContext = api_1.propagation.extract(api_1.context.active(), req.headers);
        const tracer = api_1.trace.getTracer('applyforus-tracer');
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
        api_1.context.with(api_1.trace.setSpan(extractedContext, span), () => {
            res.on('finish', () => {
                span.setAttribute('http.status_code', res.statusCode);
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
exports.TraceContextMiddleware = TraceContextMiddleware = __decorate([
    (0, common_1.Injectable)()
], TraceContextMiddleware);
function traceContextMiddleware(req, res, next) {
    const middleware = new TraceContextMiddleware();
    middleware.use(req, res, next);
}
let UserContextMiddleware = class UserContextMiddleware {
    use(req, res, next) {
        const span = api_1.trace.getActiveSpan();
        if (span && req.user) {
            const user = req.user;
            span.setAttributes({
                'user.id': user.id || user.userId || 'unknown',
                'user.email': user.email || 'unknown',
                'user.role': user.role || 'unknown',
            });
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
exports.UserContextMiddleware = UserContextMiddleware = __decorate([
    (0, common_1.Injectable)()
], UserContextMiddleware);
function userContextMiddleware(req, res, next) {
    const middleware = new UserContextMiddleware();
    middleware.use(req, res, next);
}
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
function getCorrelationId(req) {
    return req.correlationId || req.headers['x-request-id'] || 'unknown';
}
function injectCorrelationId(req, headers = {}) {
    const correlationId = getCorrelationId(req);
    return {
        ...headers,
        'X-Request-ID': correlationId,
    };
}
function propagateContext(headers = {}) {
    const carrier = { ...headers };
    api_1.propagation.inject(api_1.context.active(), carrier);
    return carrier;
}
function extractContext(headers) {
    return api_1.propagation.extract(api_1.context.active(), headers);
}
function createTracedHttpClient(baseURL) {
    return {
        baseURL,
        headers: propagateContext(),
    };
}
//# sourceMappingURL=middleware.js.map