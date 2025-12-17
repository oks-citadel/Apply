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
export declare function createLogger(options: LoggerOptions): pino.Logger<never, boolean>;
export declare class StructuredLogger {
    private logger;
    private context;
    constructor(options: LoggerOptions, context?: LogContext);
    setCorrelationId(correlationId: string): void;
    getCorrelationId(): string | undefined;
    addContext(context: LogContext): void;
    child(context: LogContext): StructuredLogger;
    private logWithContext;
    trace(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: Error, ...args: any[]): void;
    fatal(message: string, error?: Error, ...args: any[]): void;
}
export declare function createRequestLogger(logger: StructuredLogger): (req: any, res: any, next: any) => void;
export { createLogger as default };
