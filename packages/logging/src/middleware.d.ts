import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger';
export interface RequestLoggingOptions {
    logger: Logger;
    excludePaths?: string[];
    includeBody?: boolean;
    includeHeaders?: boolean;
    maxBodyLength?: number;
}
export declare function requestLoggingMiddleware(options: RequestLoggingOptions): (req: Request, res: Response, next: NextFunction) => void;
export declare function correlationMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
export declare function responseTimeMiddleware(logger: Logger): (req: Request, res: Response, next: NextFunction) => void;
export declare function errorLoggingMiddleware(logger: Logger): (err: any, req: Request, res: Response, next: NextFunction) => void;
export interface SanitizationOptions {
    redactedValue?: string;
    customPatterns?: RegExp[];
}
export declare function sanitizeLogData(data: any, options?: SanitizationOptions): any;
export declare function createUserContextMiddleware(logger: Logger): (req: Request, res: Response, next: NextFunction) => void;
export interface PerformanceMarker {
    name: string;
    startTime: number;
}
export declare class PerformanceTracker {
    private logger;
    private markers;
    constructor(logger: Logger);
    start(name: string): void;
    end(name: string, metadata?: any): void;
    clear(): void;
}
