import * as winston from 'winston';
export interface StructuredLogEntry {
    timestamp: string;
    level: string;
    message: string;
    serviceName: string;
    environment: string;
    correlationId?: string;
    operationId?: string;
    [key: string]: any;
}
export declare function createStructuredFormat(serviceName: string, environment: string): winston.Logform.Format;
export declare function filterSensitiveData(obj: any): any;
export declare function isSensitiveField(fieldName: string): boolean;
export declare function createRequestLogFormat(): string;
export declare function formatDuration(milliseconds: number): string;
export declare function formatBytes(bytes: number): string;
export interface RequestLogMetadata {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userAgent?: string;
    ip?: string;
    userId?: string;
    requestId?: string;
    correlationId?: string;
    contentLength?: number;
}
export declare function formatRequestLog(metadata: RequestLogMetadata): string;
export interface ErrorLogMetadata {
    errorName: string;
    errorMessage: string;
    errorStack?: string;
    statusCode?: number;
    path?: string;
    method?: string;
    userId?: string;
    correlationId?: string;
}
export declare function formatErrorLog(metadata: ErrorLogMetadata): string;
