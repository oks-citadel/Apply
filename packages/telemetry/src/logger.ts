/**
 * Structured logging with correlation IDs and JSON formatting
 */

import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { trace } from '@opentelemetry/api';

export interface LoggerOptions {
  serviceName: string;
  environment?: string;
  logLevel?: string;
  prettyPrint?: boolean;
}

export interface LogContext {
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: any;
}

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
export function createLogger(options: LoggerOptions) {
  const {
    serviceName,
    environment = process.env.NODE_ENV || 'development',
    logLevel = process.env.LOG_LEVEL || 'info',
    prettyPrint = environment === 'development',
  } = options;

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

  const logger = pino(
    {
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
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: serviceName,
        environment,
      },
      // Add trace context mixin
      mixin() {
        const span = trace.getActiveSpan();
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
    },
    transport ? pino.transport(transport) : undefined,
  );

  return logger;
}

/**
 * Logger class with correlation ID support
 */
export class StructuredLogger {
  private logger: pino.Logger;
  private context: LogContext;

  constructor(options: LoggerOptions, context: LogContext = {}) {
    this.logger = createLogger(options);
    this.context = {
      correlationId: uuidv4(),
      ...context,
    };
  }

  /**
   * Set correlation ID for this logger instance
   */
  setCorrelationId(correlationId: string): void {
    this.context.correlationId = correlationId;
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | undefined {
    return this.context.correlationId;
  }

  /**
   * Add context to logger
   */
  addContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger(
      {
        serviceName: this.logger.bindings().service,
        environment: this.logger.bindings().environment,
        logLevel: this.logger.level,
      },
      { ...this.context, ...context },
    );
    return childLogger;
  }

  /**
   * Log with trace context
   */
  private logWithContext(level: string, message: string, ...args: any[]): void {
    const span = trace.getActiveSpan();
    const traceContext: LogContext = {};

    if (span) {
      const spanContext = span.spanContext();
      traceContext.traceId = spanContext.traceId;
      traceContext.spanId = spanContext.spanId;
    }

    const mergedContext = { ...this.context, ...traceContext };

    if (args.length > 0 && typeof args[0] === 'object') {
      this.logger[level]({ ...mergedContext, ...args[0] }, message);
    } else {
      this.logger[level](mergedContext, message, ...args);
    }
  }

  /**
   * Log trace level message
   */
  trace(message: string, ...args: any[]): void {
    this.logWithContext('trace', message, ...args);
  }

  /**
   * Log debug level message
   */
  debug(message: string, ...args: any[]): void {
    this.logWithContext('debug', message, ...args);
  }

  /**
   * Log info level message
   */
  info(message: string, ...args: any[]): void {
    this.logWithContext('info', message, ...args);
  }

  /**
   * Log warn level message
   */
  warn(message: string, ...args: any[]): void {
    this.logWithContext('warn', message, ...args);
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error, ...args: any[]): void {
    if (error) {
      this.logWithContext('error', message, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...args,
      });
    } else {
      this.logWithContext('error', message, ...args);
    }
  }

  /**
   * Log fatal level message
   */
  fatal(message: string, error?: Error, ...args: any[]): void {
    if (error) {
      this.logWithContext('fatal', message, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...args,
      });
    } else {
      this.logWithContext('fatal', message, ...args);
    }
  }
}

/**
 * Create a request logger middleware for Express/NestJS
 */
export function createRequestLogger(logger: StructuredLogger) {
  return (req: any, res: any, next: any) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    const childLogger = logger.child({
      correlationId,
      requestId: req.id || uuidv4(),
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

/**
 * Export logger instance creator
 */
export { createLogger as default };
