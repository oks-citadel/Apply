"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTracker = void 0;
exports.requestLoggingMiddleware = requestLoggingMiddleware;
exports.correlationMiddleware = correlationMiddleware;
exports.responseTimeMiddleware = responseTimeMiddleware;
exports.errorLoggingMiddleware = errorLoggingMiddleware;
exports.sanitizeLogData = sanitizeLogData;
exports.createUserContextMiddleware = createUserContextMiddleware;
const uuid_1 = require("uuid");
const context_1 = require("./context");
const formats_1 = require("./formats");
function requestLoggingMiddleware(options) {
    const { logger, excludePaths = ['/health', '/metrics'], includeBody = false, includeHeaders = false, maxBodyLength = 1000, } = options;
    return (req, res, next) => {
        if (excludePaths.some((path) => req.path.startsWith(path))) {
            return next();
        }
        return context_1.LoggerContext.run(() => {
            const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
            const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
            context_1.LoggerContext.setContext({
                correlationId,
                requestId,
            });
            res.setHeader('X-Correlation-ID', correlationId);
            res.setHeader('X-Request-ID', requestId);
            const startTime = Date.now();
            const { method, url, ip } = req;
            const requestMetadata = {
                method,
                url,
                ip,
                userAgent: req.headers['user-agent'],
                correlationId,
                requestId,
            };
            if (includeHeaders) {
                requestMetadata.headers = (0, formats_1.filterSensitiveData)(req.headers);
            }
            if (includeBody && req.body) {
                const bodyString = JSON.stringify(req.body);
                requestMetadata.body =
                    bodyString.length > maxBodyLength
                        ? `${bodyString.substring(0, maxBodyLength)}... (truncated)`
                        : (0, formats_1.filterSensitiveData)(req.body);
            }
            logger.info('Incoming HTTP request', requestMetadata);
            const originalEnd = res.end;
            let responseBody;
            res.end = function (chunk, ...args) {
                if (chunk) {
                    responseBody = chunk;
                }
                const duration = Date.now() - startTime;
                const { statusCode } = res;
                const responseMetadata = {
                    method,
                    url,
                    statusCode,
                    duration,
                    correlationId,
                    requestId,
                    contentLength: res.get('content-length'),
                };
                if (statusCode >= 500) {
                    logger.error('HTTP request failed (5xx)', undefined, responseMetadata);
                }
                else if (statusCode >= 400) {
                    logger.warn('HTTP request failed (4xx)', responseMetadata);
                }
                else {
                    logger.info('HTTP request completed', responseMetadata);
                }
                logger.trackMetric('http.request.duration', duration, {
                    method,
                    path: url,
                    statusCode: statusCode.toString(),
                });
                logger.trackMetric('http.response.status', 1, {
                    method,
                    path: url,
                    statusCode: statusCode.toString(),
                });
                return originalEnd.call(this, chunk, ...args);
            };
            next();
        });
    };
}
function correlationMiddleware() {
    return (req, res, next) => {
        return context_1.LoggerContext.run(() => {
            const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
            const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
            context_1.LoggerContext.setContext({
                correlationId,
                requestId,
            });
            res.setHeader('X-Correlation-ID', correlationId);
            res.setHeader('X-Request-ID', requestId);
            next();
        });
    };
}
function responseTimeMiddleware(logger) {
    return (req, res, next) => {
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            res.setHeader('X-Response-Time', `${duration}ms`);
            const slowRequestThreshold = 3000;
            if (duration > slowRequestThreshold) {
                logger.warn('Slow request detected', {
                    method: req.method,
                    url: req.url,
                    duration,
                    correlationId: context_1.LoggerContext.getCorrelationId(),
                });
            }
        });
        next();
    };
}
function errorLoggingMiddleware(logger) {
    return (err, req, res, next) => {
        const correlationId = context_1.LoggerContext.getCorrelationId();
        logger.error(`Unhandled error in request: ${err.message}`, err instanceof Error ? err : new Error(String(err)), {
            method: req.method,
            url: req.url,
            correlationId,
            statusCode: err.statusCode || 500,
        });
        if (correlationId) {
            res.setHeader('X-Correlation-ID', correlationId);
        }
        next(err);
    };
}
function sanitizeLogData(data, options = {}) {
    const { redactedValue = '[REDACTED]', customPatterns = [] } = options;
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data !== 'object') {
        return data;
    }
    const sanitized = Array.isArray(data) ? [] : {};
    for (const key in data) {
        if (!data.hasOwnProperty(key))
            continue;
        const isSensitive = isSensitiveKey(key) ||
            customPatterns.some((pattern) => pattern.test(key));
        if (isSensitive) {
            sanitized[key] = redactedValue;
        }
        else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = sanitizeLogData(data[key], options);
        }
        else {
            sanitized[key] = data[key];
        }
    }
    return sanitized;
}
function isSensitiveKey(key) {
    const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /api[_-]?key/i,
        /authorization/i,
        /credential/i,
        /private[_-]?key/i,
        /access[_-]?key/i,
        /session/i,
        /cookie/i,
        /ssn/i,
        /social[_-]?security/i,
        /credit[_-]?card/i,
        /cvv/i,
        /pin/i,
        /bearer/i,
    ];
    return sensitivePatterns.some((pattern) => pattern.test(key));
}
function createUserContextMiddleware(logger) {
    return (req, res, next) => {
        const user = req.user;
        if (user && user.id) {
            context_1.LoggerContext.setUserId(user.id);
            logger.debug('User context set', {
                userId: user.id,
                correlationId: context_1.LoggerContext.getCorrelationId(),
            });
        }
        next();
    };
}
class PerformanceTracker {
    constructor(logger) {
        this.logger = logger;
        this.markers = new Map();
    }
    start(name) {
        this.markers.set(name, {
            name,
            startTime: Date.now(),
        });
    }
    end(name, metadata) {
        const marker = this.markers.get(name);
        if (!marker) {
            this.logger.warn(`Performance marker not found: ${name}`);
            return;
        }
        const duration = Date.now() - marker.startTime;
        this.logger.trackMetric(`performance.${name}`, duration, metadata);
        this.logger.debug(`Performance: ${name}`, {
            duration,
            ...metadata,
        });
        this.markers.delete(name);
    }
    clear() {
        this.markers.clear();
    }
}
exports.PerformanceTracker = PerformanceTracker;
//# sourceMappingURL=middleware.js.map