/**
 * Middleware for trace context propagation and correlation
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { trace, context, propagation, SpanStatusCode } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

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
@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or extract correlation ID
    const correlationId = (req.headers['x-request-id'] as string) || uuidv4();

    // Store correlation ID in request for later use
    (req as any).correlationId = correlationId;

    // Add correlation ID to response headers
    res.setHeader('X-Request-ID', correlationId);

    // Extract trace context from incoming request headers
    const extractedContext = propagation.extract(context.active(), req.headers);

    // Get current tracer
    const tracer = trace.getTracer('applyforus-tracer');

    // Create a span for this request
    const span = tracer.startSpan(
      `${req.method} ${req.path}`,
      {
        attributes: {
          'http.method': req.method,
          'http.url': req.url,
          'http.target': req.path,
          'http.host': req.hostname,
          'http.scheme': req.protocol,
          'http.user_agent': req.headers['user-agent'] || 'unknown',
          'http.request_id': correlationId,
          'http.route': req.route?.path || req.path,
        },
      },
      extractedContext,
    );

    // Execute the request within the span context
    context.with(trace.setSpan(extractedContext, span), () => {
      // Track response
      res.on('finish', () => {
        span.setAttribute('http.status_code', res.statusCode);

        // Set span status based on HTTP status code
        if (res.statusCode >= 200 && res.statusCode < 400) {
          span.setStatus({ code: SpanStatusCode.OK });
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `Client error: ${res.statusCode}`,
          });
        } else if (res.statusCode >= 500) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `Server error: ${res.statusCode}`,
          });
        }

        span.end();
      });

      // Handle request errors
      res.on('error', (error: Error) => {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.end();
      });

      next();
    });
  }
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
export function traceContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const middleware = new TraceContextMiddleware();
  middleware.use(req, res, next);
}

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
@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const span = trace.getActiveSpan();

    if (span && (req as any).user) {
      const user = (req as any).user;

      // Add user context to span
      span.setAttributes({
        'user.id': user.id || user.userId || 'unknown',
        'user.email': user.email || 'unknown',
        'user.role': user.role || 'unknown',
      });

      // Add tenant context if available
      if (user.tenantId) {
        span.setAttribute('tenant.id', user.tenantId);
      }

      if (user.organizationId) {
        span.setAttribute('organization.id', user.organizationId);
      }
    }

    next();
  }
}

/**
 * Express middleware for user context
 */
export function userContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const middleware = new UserContextMiddleware();
  middleware.use(req, res, next);
}

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
export function customContextMiddleware(
  contextExtractor: (req: Request) => Record<string, string | number | boolean>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const span = trace.getActiveSpan();

    if (span) {
      try {
        const customContext = contextExtractor(req);
        span.setAttributes(customContext);
      } catch (error) {
        console.error('[Telemetry] Error extracting custom context:', error);
      }
    }

    next();
  };
}

/**
 * Get correlation ID from request
 *
 * @param req - Express request object
 * @returns Correlation ID
 */
export function getCorrelationId(req: Request): string {
  return (req as any).correlationId || (req.headers['x-request-id'] as string) || 'unknown';
}

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
export function injectCorrelationId(
  req: Request,
  headers: Record<string, string> = {},
): Record<string, string> {
  const correlationId = getCorrelationId(req);

  return {
    ...headers,
    'X-Request-ID': correlationId,
  };
}

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
export function propagateContext(headers: Record<string, string> = {}): Record<string, string> {
  const carrier: Record<string, string> = { ...headers };

  // Inject current context into headers
  propagation.inject(context.active(), carrier);

  return carrier;
}

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
export function extractContext(headers: Record<string, string>) {
  return propagation.extract(context.active(), headers);
}

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
export function createTracedHttpClient(baseURL?: string) {
  return {
    baseURL,
    headers: propagateContext(),
  };
}
