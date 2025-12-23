/**
 * Middleware for trace context propagation and correlation
 */
import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
/**
 * NestJS middleware for trace context and correlation ID handling
 *
 * This middleware:
 * - Extracts trace context from incoming requests (W3C Trace Context)
 * - Generates or forwards correlation IDs (X-Request-ID)
 * - Adds correlation IDs to response headers
 * - Creates a span for the entire request lifecycle
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
 * import { TraceContextMiddleware } from '@applyforus/telemetry';
 *
 * @Module({
 *   // ...
 * })
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(TraceContextMiddleware).forRoutes('*');
 *   }
 * }
 * ```
 */
export declare class TraceContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
/**
 * Express middleware for trace context propagation
 *
 * Use this for Express applications or non-NestJS services
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { traceContextMiddleware } from '@applyforus/telemetry';
 *
 * const app = express();
 * app.use(traceContextMiddleware);
 * ```
 */
export declare function traceContextMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to extract and store user context in trace
 *
 * This should be applied AFTER authentication middleware
 *
 * @example
 * ```typescript
 * // app.module.ts
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(TraceContextMiddleware)
 *       .forRoutes('*')
 *       .apply(UserContextMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 */
export declare class UserContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
/**
 * Express middleware for user context
 */
export declare function userContextMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to add custom business context to traces
 *
 * @param contextExtractor - Function to extract context from request
 * @returns Express middleware
 *
 * @example
 * ```typescript
 * app.use(customContextMiddleware((req) => ({
 *   'application.feature': req.headers['x-feature-flag'],
 *   'application.client': req.headers['x-client-id'],
 * })));
 * ```
 */
export declare function customContextMiddleware(contextExtractor: (req: Request) => Record<string, string | number | boolean>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get correlation ID from request
 *
 * @param req - Express request object
 * @returns Correlation ID
 */
export declare function getCorrelationId(req: Request): string;
/**
 * Inject correlation ID into headers for outgoing requests
 *
 * @param req - Current request
 * @param headers - Headers object to inject into
 * @returns Headers with correlation ID
 *
 * @example
 * ```typescript
 * const headers = injectCorrelationId(req, {
 *   'Content-Type': 'application/json'
 * });
 *
 * await fetch('https://api.example.com', { headers });
 * ```
 */
export declare function injectCorrelationId(req: Request, headers?: Record<string, string>): Record<string, string>;
/**
 * Propagate trace context to outgoing HTTP requests
 *
 * @param headers - Headers object to inject trace context into
 * @returns Headers with trace context
 *
 * @example
 * ```typescript
 * const headers = propagateContext({
 *   'Content-Type': 'application/json'
 * });
 *
 * await httpClient.get('https://api.example.com', { headers });
 * ```
 */
export declare function propagateContext(headers?: Record<string, string>): Record<string, string>;
/**
 * Extract trace context from incoming message headers
 *
 * Useful for message queue consumers
 *
 * @param headers - Message headers
 * @returns Extracted context
 *
 * @example
 * ```typescript
 * const extractedContext = extractContext(message.headers);
 *
 * context.with(extractedContext, () => {
 *   // Process message within trace context
 *   processMessage(message);
 * });
 * ```
 */
export declare function extractContext(headers: Record<string, string>): import("@opentelemetry/api").Context;
/**
 * Create HTTP client with automatic trace propagation
 *
 * @param baseURL - Base URL for HTTP client
 * @returns HTTP client configuration with interceptors
 *
 * @example
 * ```typescript
 * import axios from 'axios';
 * import { createTracedHttpClient } from '@applyforus/telemetry';
 *
 * const client = axios.create(createTracedHttpClient('https://api.example.com'));
 * ```
 */
export declare function createTracedHttpClient(baseURL?: string): {
    baseURL: string | undefined;
    headers: Record<string, string>;
};
//# sourceMappingURL=middleware.d.ts.map