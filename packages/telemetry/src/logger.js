"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredLogger = void 0;
exports.createLogger = createLogger;
exports.default = createLogger;
exports.createRequestLogger = createRequestLogger;
const pino_1 = require("pino");
const uuid_1 = require("uuid");
const api_1 = require("@opentelemetry/api");
function createLogger(options) {
    const { serviceName, environment = process.env.NODE_ENV || 'development', logLevel = process.env.LOG_LEVEL || 'info', prettyPrint = environment === 'development', } = options;
    const transport = prettyPrint
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined;
    const logger = (0, pino_1.default)({
        name: serviceName,
        level: logLevel,
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
            bindings: (bindings) => {
                return {
                    service: serviceName,
                    environment,
                    pid: bindings.pid,
                    hostname: bindings.hostname,
                };
            },
        },
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
        base: {
            service: serviceName,
            environment,
        },
        mixin() {
            const span = api_1.trace.getActiveSpan();
            if (span) {
                const spanContext = span.spanContext();
                return {
                    traceId: spanContext.traceId,
                    spanId: spanContext.spanId,
                    traceFlags: spanContext.traceFlags,
                };
            }
            return {};
        },
    }, transport ? pino_1.default.transport(transport) : undefined);
    return logger;
}
class StructuredLogger {
    constructor(options, context = {}) {
        this.logger = createLogger(options);
        this.context = {
            correlationId: (0, uuid_1.v4)(),
            ...context,
        };
    }
    setCorrelationId(correlationId) {
        this.context.correlationId = correlationId;
    }
    getCorrelationId() {
        return this.context.correlationId;
    }
    addContext(context) {
        this.context = { ...this.context, ...context };
    }
    child(context) {
        const childLogger = new StructuredLogger({
            serviceName: this.logger.bindings().service,
            environment: this.logger.bindings().environment,
            logLevel: this.logger.level,
        }, { ...this.context, ...context });
        return childLogger;
    }
    logWithContext(level, message, ...args) {
        const span = api_1.trace.getActiveSpan();
        const traceContext = {};
        if (span) {
            const spanContext = span.spanContext();
            traceContext.traceId = spanContext.traceId;
            traceContext.spanId = spanContext.spanId;
        }
        const mergedContext = { ...this.context, ...traceContext };
        if (args.length > 0 && typeof args[0] === 'object') {
            this.logger[level]({ ...mergedContext, ...args[0] }, message);
        }
        else {
            this.logger[level](mergedContext, message, ...args);
        }
    }
    trace(message, ...args) {
        this.logWithContext('trace', message, ...args);
    }
    debug(message, ...args) {
        this.logWithContext('debug', message, ...args);
    }
    info(message, ...args) {
        this.logWithContext('info', message, ...args);
    }
    warn(message, ...args) {
        this.logWithContext('warn', message, ...args);
    }
    error(message, error, ...args) {
        if (error) {
            this.logWithContext('error', message, {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                ...args,
            });
        }
        else {
            this.logWithContext('error', message, ...args);
        }
    }
    fatal(message, error, ...args) {
        if (error) {
            this.logWithContext('fatal', message, {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                ...args,
            });
        }
        else {
            this.logWithContext('fatal', message, ...args);
        }
    }
}
exports.StructuredLogger = StructuredLogger;
function createRequestLogger(logger) {
    return (req, res, next) => {
        const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
        req.correlationId = correlationId;
        res.setHeader('X-Correlation-ID', correlationId);
        const childLogger = logger.child({
            correlationId,
            requestId: req.id || (0, uuid_1.v4)(),
            method: req.method,
            path: req.path,
            userAgent: req.headers['user-agent'],
        });
        req.logger = childLogger;
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            childLogger.info('HTTP Request completed', {
                statusCode: res.statusCode,
                duration,
                contentLength: res.get('content-length'),
            });
        });
        next();
    };
}
//# sourceMappingURL=logger.js.map