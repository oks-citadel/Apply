import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class TraceContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
export declare function traceContextMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare class UserContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
export declare function userContextMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function customContextMiddleware(contextExtractor: (req: Request) => Record<string, string | number | boolean>): (req: Request, res: Response, next: NextFunction) => void;
export declare function getCorrelationId(req: Request): string;
export declare function injectCorrelationId(req: Request, headers?: Record<string, string>): Record<string, string>;
export declare function propagateContext(headers?: Record<string, string>): Record<string, string>;
export declare function extractContext(headers: Record<string, string>): import("@opentelemetry/api").Context;
export declare function createTracedHttpClient(baseURL?: string): {
    baseURL: string;
    headers: Record<string, string>;
};
