import * as winston from 'winston';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

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

export function createStructuredFormat(
  serviceName: string,
  environment: string,
): winston.Logform.Format {
  const isDevelopment = environment === 'development' || environment === 'local';

  if (isDevelopment) {
    // Human-readable format for development
    return combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      errors({ stack: true }),
      printf((info) => {
        const {
          timestamp,
          level,
          message,
          correlationId,
          operationId,
          errorStack,
          ...metadata
        } = info;

        let log = `${timestamp} [${level}] [${serviceName}]`;

        if (correlationId) {
          log += ` [CID: ${correlationId.substring(0, 8)}]`;
        }

        if (operationId) {
          log += ` [OID: ${operationId.substring(0, 8)}]`;
        }

        log += `: ${message}`;

        // Add metadata if present
        const metadataKeys = Object.keys(metadata);
        if (metadataKeys.length > 0) {
          const filteredMetadata = filterSensitiveData(metadata);
          log += ` ${JSON.stringify(filteredMetadata, null, 2)}`;
        }

        // Add stack trace if present
        if (errorStack) {
          log += `\n${errorStack}`;
        }

        return log;
      }),
    );
  } else {
    // JSON format for production
    return combine(
      timestamp({ format: 'iso' }),
      errors({ stack: true }),
      json({
        replacer: (key, value) => {
          // Filter sensitive data in production
          if (isSensitiveField(key)) {
            return '[REDACTED]';
          }
          return value;
        },
      }),
    );
  }
}

export function filterSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const filtered: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (isSensitiveField(key)) {
        filtered[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        filtered[key] = filterSensitiveData(obj[key]);
      } else {
        filtered[key] = obj[key];
      }
    }
  }

  return filtered;
}

export function isSensitiveField(fieldName: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /auth/i,
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
  ];

  return sensitivePatterns.some((pattern) => pattern.test(fieldName));
}

export function createRequestLogFormat(): string {
  return 'HTTP Request: :method :url - Status: :status - Duration: :response-time ms - Size: :res[content-length] bytes';
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(2)}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(2);
    return `${minutes}m ${seconds}s`;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

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

export function formatRequestLog(metadata: RequestLogMetadata): string {
  const {
    method,
    url,
    statusCode,
    duration,
    userAgent,
    ip,
    userId,
    requestId,
    correlationId,
    contentLength,
  } = metadata;

  let log = `${method} ${url} - ${statusCode} - ${formatDuration(duration)}`;

  if (contentLength) {
    log += ` - ${formatBytes(contentLength)}`;
  }

  if (userId) {
    log += ` - User: ${userId}`;
  }

  if (ip) {
    log += ` - IP: ${ip}`;
  }

  if (requestId) {
    log += ` - ReqID: ${requestId.substring(0, 8)}`;
  }

  if (correlationId) {
    log += ` - CorrID: ${correlationId.substring(0, 8)}`;
  }

  return log;
}

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

export function formatErrorLog(metadata: ErrorLogMetadata): string {
  const {
    errorName,
    errorMessage,
    errorStack,
    statusCode,
    path,
    method,
    userId,
    correlationId,
  } = metadata;

  let log = `Error: ${errorName} - ${errorMessage}`;

  if (statusCode) {
    log += ` - Status: ${statusCode}`;
  }

  if (method && path) {
    log += ` - ${method} ${path}`;
  }

  if (userId) {
    log += ` - User: ${userId}`;
  }

  if (correlationId) {
    log += ` - CorrID: ${correlationId.substring(0, 8)}`;
  }

  if (errorStack) {
    log += `\n${errorStack}`;
  }

  return log;
}
