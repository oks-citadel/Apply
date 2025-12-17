export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    TRACE = "trace"
}
export interface LogMetadata {
    [key: string]: any;
}
export interface LoggerOptions {
    serviceName: string;
    environment: string;
    version: string;
    appInsightsKey?: string;
    enableConsole?: boolean;
    logLevel?: LogLevel;
}
export declare class Logger {
    private winstonLogger;
    private appInsightsClient?;
    private serviceName;
    private environment;
    private version;
    constructor(options: LoggerOptions);
    private initializeAppInsights;
    private createWinstonLogger;
    private getCorrelationId;
    private getOperationId;
    private enrichMetadata;
    private logToAppInsights;
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, error?: Error, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
    trace(message: string, metadata?: LogMetadata): void;
    trackEvent(name: string, properties?: LogMetadata, measurements?: {
        [key: string]: number;
    }): void;
    trackMetric(name: string, value: number, properties?: LogMetadata): void;
    trackDependency(dependencyTypeName: string, name: string, data: string, duration: number, success: boolean, resultCode?: number, properties?: LogMetadata): void;
    startOperation(operationName: string): string;
    endOperation(operationId: string, success?: boolean, metadata?: LogMetadata): void;
    flush(): Promise<void>;
}
