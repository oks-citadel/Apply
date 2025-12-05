import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger';
import { LoggerContext } from './context';
import { filterSensitiveData } from './formats';

export interface RequestLoggingOptions {
  logger: Logger;
  excludePaths?: string[];
  includeBody?: boolean;
  includeHeaders?: boolean;
  maxBodyLength?: number;
}

export function requestLoggingMiddleware(options: RequestLoggingOptions) {
  const {
    logger,
    excludePaths = ['/health', '/metrics'],
    includeBody = false,
    includeHeaders = false,
    maxBodyLength = 1000,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Set up logging context with correlation ID
    return LoggerContext.run(() => {
      const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
      const requestId = (req.headers['x-request-id'] as string) || uuidv4();

      LoggerContext.setContext({
        correlationId,
        requestId,
      });

      // Add correlation headers to response
      res.setHeader('X-Correlation-ID', correlationId);
      res.setHeader('X-Request-ID', requestId);

      const startTime = Date.now();
      const { method, url, ip } = req;

      // Log request metadata
      const requestMetadata: any = {
        method,
        url,
        ip,
        userAgent: req.headers['user-agent'],
        correlationId,
        requestId,
      };

      if (includeHeaders) {
        requestMetadata.headers = filterSensitiveData(req.headers);
      }

      if (includeBody && req.body) {
        const bodyString = JSON.stringify(req.body);
        requestMetadata.body =
          bodyString.length > maxBodyLength
            ? `${bodyString.substring(0, maxBodyLength)}... (truncated)`
            : filterSensitiveData(req.body);
      }

      logger.info('Incoming HTTP request', requestMetadata);

      // Capture original end function
      const originalEnd = res.end;
      let responseBody: any;

      // Override end to capture response
      res.end = function (chunk?: any, ...args: any[]): any {
        if (chunk) {
          responseBody = chunk;
        }

        const duration = Date.now() - startTime;
        const { statusCode } = res;

        // Log response metadata
        const responseMetadata: any = {
          method,
          url,
          statusCode,
          duration,
          correlationId,
          requestId,
          contentLength: res.get('content-length'),
        };

        // Determine log level based on status code
        if (statusCode >= 500) {
          logger.error('HTTP request failed (5xx)', undefined, responseMetadata);
        } else if (statusCode >= 400) {
          logger.warn('HTTP request failed (4xx)', responseMetadata);
        } else {
          logger.info('HTTP request completed', responseMetadata);
        }

        // Track response time metric
        logger.trackMetric('http.request.duration', duration, {
          method,
          path: url,
          statusCode: statusCode.toString(),
        });

        // Track status code metric
        logger.trackMetric('http.response.status', 1, {
          method,
          path: url,
          statusCode: statusCode.toString(),
        });

        // Call original end function
        return originalEnd.call(this, chunk, ...args);
      };

      next();
    });
  };
}

export function correlationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    return LoggerContext.run(() => {
      const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
      const requestId = (req.headers['x-request-id'] as string) || uuidv4();

      LoggerContext.setContext({
        correlationId,
        requestId,
      });

      res.setHeader('X-Correlation-ID', correlationId);
      res.setHeader('X-Request-ID', requestId);

      next();
    });
  };
}

export function responseTimeMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${duration}ms`);

      // Log slow requests
      const slowRequestThreshold = 3000; // 3 seconds
      if (duration > slowRequestThreshold) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration,
          correlationId: LoggerContext.getCorrelationId(),
        });
      }
    });

    next();
  };
}

export function errorLoggingMiddleware(logger: Logger) {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    const correlationId = LoggerContext.getCorrelationId();

    logger.error(
      `Unhandled error in request: ${err.message}`,
      err instanceof Error ? err : new Error(String(err)),
      {
        method: req.method,
        url: req.url,
        correlationId,
        statusCode: err.statusCode || 500,
      },
    );

    // Set correlation ID in error response
    if (correlationId) {
      res.setHeader('X-Correlation-ID', correlationId);
    }

    next(err);
  };
}

export interface SanitizationOptions {
  redactedValue?: string;
  customPatterns?: RegExp[];
}

export function sanitizeLogData(
  data: any,
  options: SanitizationOptions = {},
): any {
  const { redactedValue = '[REDACTED]', customPatterns = [] } = options;

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};

  for (const key in data) {
    if (!data.hasOwnProperty(key)) continue;

    const isSensitive =
      isSensitiveKey(key) ||
      customPatterns.some((pattern) => pattern.test(key));

    if (isSensitive) {
      (sanitized as any)[key] = redactedValue;
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      (sanitized as any)[key] = sanitizeLogData(data[key], options);
    } else {
      (sanitized as any)[key] = data[key];
    }
  }

  return sanitized;
}

function isSensitiveKey(key: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /authorization/i,
    /credential/i,
    /private[_-]?key/i,
    /access[_-]?key/i,
    /session/i,
    /cookie/i,
    /ssn/i,
    /social[_-]?security/i,
    /credit[_-]?card/i,
    /cvv/i,
    /pin/i,
    /bearer/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(key));
}

export function createUserContextMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract user information from request (assumes auth middleware has run)
    const user = (req as any).user;

    if (user && user.id) {
      LoggerContext.setUserId(user.id);

      logger.debug('User context set', {
        userId: user.id,
        correlationId: LoggerContext.getCorrelationId(),
      });
    }

    next();
  };
}

export interface PerformanceMarker {
  name: string;
  startTime: number;
}

export class PerformanceTracker {
  private markers: Map<string, PerformanceMarker> = new Map();

  constructor(private logger: Logger) {}

  start(name: string): void {
    this.markers.set(name, {
      name,
      startTime: Date.now(),
    });
  }

  end(name: string, metadata?: any): void {
    const marker = this.markers.get(name);

    if (!marker) {
      this.logger.warn(`Performance marker not found: ${name}`);
      return;
    }

    const duration = Date.now() - marker.startTime;

    this.logger.trackMetric(`performance.${name}`, duration, metadata);

    this.logger.debug(`Performance: ${name}`, {
      duration,
      ...metadata,
    });

    this.markers.delete(name);
  }

  clear(): void {
    this.markers.clear();
  }
}
