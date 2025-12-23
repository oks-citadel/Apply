/**
 * Structured logging with correlation IDs and JSON formatting
 */
import pino from 'pino';
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
export declare function createLogger(options: LoggerOptions): pino.Logger<never, boolean>;
/**
 * Logger class with correlation ID support
 */
export declare class StructuredLogger {
    private logger;
    private context;
    constructor(options: LoggerOptions, context?: LogContext);
    /**
     * Set correlation ID for this logger instance
     */
    setCorrelationId(correlationId: string): void;
    /**
     * Get current correlation ID
     */
    getCorrelationId(): string | undefined;
    /**
     * Add context to logger
     */
    addContext(context: LogContext): void;
    /**
     * Create a child logger with additional context
     */
    child(context: LogContext): StructuredLogger;
    /**
     * Log with trace context
     */
    private logWithContext;
    /**
     * Log trace level message
     */
    trace(message: string, ...args: any[]): void;
    /**
     * Log debug level message
     */
    debug(message: string, ...args: any[]): void;
    /**
     * Log info level message
     */
    info(message: string, ...args: any[]): void;
    /**
     * Log warn level message
     */
    warn(message: string, ...args: any[]): void;
    /**
     * Log error level message
     */
    error(message: string, error?: Error, ...args: any[]): void;
    /**
     * Log fatal level message
     */
    fatal(message: string, error?: Error, ...args: any[]): void;
}
/**
 * Create a request logger middleware for Express/NestJS
 */
export declare function createRequestLogger(logger: StructuredLogger): (req: any, res: any, next: any) => void;
/**
 * Export logger instance creator
 */
export { createLogger as default };
//# sourceMappingURL=logger.d.ts.map