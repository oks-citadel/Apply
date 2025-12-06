import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithContext extends Request {
  correlationId?: string;
  requestId?: string;
  startTime?: number;
}

/**
 * Middleware to add correlation IDs and request logging
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Generate or extract correlation ID
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      uuidv4();

    const requestId = uuidv4();

    // Attach to request object
    req.correlationId = correlationId;
    req.requestId = requestId;
    req.startTime = startTime;

    // Set response headers
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Request-ID', requestId);

    // Set logger context
    this.logger.setContext({
      correlationId,
      requestId,
      userId: (req as any).user?.id,
      sessionId: (req as any).sessionID,
    });

    // Log incoming request
    this.logger.http(`Incoming ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      correlationId,
      requestId,
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'http';

      const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
      const metadata = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        correlationId,
        requestId,
        contentLength: res.get('content-length'),
      };

      if (logLevel === 'error') {
        this.logger.error(message, undefined, metadata);
      } else if (logLevel === 'warn') {
        this.logger.warn(message, metadata);
      } else {
        this.logger.http(message, metadata);
      }

      // Clean up context after request completes
      setTimeout(() => {
        this.logger.clearContext(correlationId);
      }, 5000); // Keep context for 5 seconds for async operations
    });

    next();
  }
}

/**
 * Factory function to create logger middleware
 */
export function createLoggerMiddleware(logger: Logger) {
  return (req: RequestWithContext, res: Response, next: NextFunction) => {
    const middleware = new LoggerMiddleware(logger);
    middleware.use(req, res, next);
  };
}
