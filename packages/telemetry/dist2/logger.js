"use strict";
/**
 * Structured logging with correlation IDs and JSON formatting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredLogger = void 0;
exports.createLogger = createLogger;
exports.default = createLogger;
exports.createRequestLogger = createRequestLogger;
const tslib_1 = require("tslib");
const pino_1 = tslib_1.__importDefault(require("pino"));
const uuid_1 = require("uuid");
const api_1 = require("@opentelemetry/api");
/**
 * Create a structured logger instance with OpenTelemetry integration
 *
 * @param options - Logger configuration options
 * @returns Pino logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({
 *   serviceName: 'auth-service',
 *   environment: 'production',
 *   logLevel: 'info'
 * });
 *
 * logger.info({ userId: '123' }, 'User authenticated successfully');
 * ```
 */
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
        // Add trace context mixin
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
/**
 * Logger class with correlation ID support
 */
class StructuredLogger {
    constructor(options, context = {}) {
        this.logger = createLogger(options);
        this.context = {
            correlationId: (0, uuid_1.v4)(),
            ...context,
        };
    }
    /**
     * Set correlation ID for this logger instance
     */
    setCorrelationId(correlationId) {
        this.context.correlationId = correlationId;
    }
    /**
     * Get current correlation ID
     */
    getCorrelationId() {
        return this.context.correlationId;
    }
    /**
     * Add context to logger
     */
    addContext(context) {
        this.context = { ...this.context, ...context };
    }
    /**
     * Create a child logger with additional context
     */
    child(context) {
        const childLogger = new StructuredLogger({
            serviceName: this.logger.bindings().service,
            environment: this.logger.bindings().environment,
            logLevel: this.logger.level,
        }, { ...this.context, ...context });
        return childLogger;
    }
    /**
     * Log with trace context
     */
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
    /**
     * Log trace level message
     */
    trace(message, ...args) {
        this.logWithContext('trace', message, ...args);
    }
    /**
     * Log debug level message
     */
    debug(message, ...args) {
        this.logWithContext('debug', message, ...args);
    }
    /**
     * Log info level message
     */
    info(message, ...args) {
        this.logWithContext('info', message, ...args);
    }
    /**
     * Log warn level message
     */
    warn(message, ...args) {
        this.logWithContext('warn', message, ...args);
    }
    /**
     * Log error level message
     */
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
    /**
     * Log fatal level message
     */
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
/**
 * Create a request logger middleware for Express/NestJS
 */
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