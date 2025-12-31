import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { sanitizeStrict, sanitizeUserInput, sanitizeEmail, sanitizeUrl, sanitizeFileName } from './sanitizer';

/**
 * Configuration for input sanitization
 */
export interface SanitizationConfig {
  /**
   * Fields that should NOT be sanitized (e.g., password, token)
   */
  excludeFields: string[];

  /**
   * Fields that contain HTML and should use HTML sanitizer
   */
  htmlFields: string[];

  /**
   * Fields that are emails
   */
  emailFields: string[];

  /**
   * Fields that are URLs
   */
  urlFields: string[];

  /**
   * Fields that are file names
   */
  fileNameFields: string[];

  /**
   * Log sanitization actions
   */
  enableLogging: boolean;

  /**
   * Maximum string length (truncate if exceeded)
   */
  maxStringLength: number;

  /**
   * Maximum object depth for recursive sanitization
   */
  maxDepth: number;
}

const DEFAULT_CONFIG: SanitizationConfig = {
  excludeFields: [
    'password',
    'passwordConfirm',
    'currentPassword',
    'newPassword',
    'token',
    'refreshToken',
    'accessToken',
    'apiKey',
    'secret',
    'signature',
    'hash',
  ],
  htmlFields: [
    'description',
    'bio',
    'aboutMe',
    'content',
    'body',
    'summary',
    'notes',
    'coverLetter',
  ],
  emailFields: ['email', 'userEmail', 'contactEmail'],
  urlFields: ['url', 'website', 'linkedin', 'github', 'portfolio', 'imageUrl', 'avatarUrl'],
  fileNameFields: ['fileName', 'filename', 'file_name'],
  enableLogging: false,
  maxStringLength: 10000,
  maxDepth: 10,
};

/**
 * Input Sanitization Middleware
 *
 * Automatically sanitizes all incoming request data to prevent XSS,
 * SQL injection, and other injection attacks.
 *
 * Features:
 * - Recursive object sanitization
 * - Type-specific sanitization (email, URL, filename)
 * - Configurable field exclusions
 * - HTML content sanitization
 * - Logging for debugging
 *
 * @example
 * ```typescript
 * // In your module
 * @Module({})
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(InputSanitizationMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class InputSanitizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(InputSanitizationMiddleware.name);
  private config: SanitizationConfig;

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body, 0, 'body');
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = this.sanitizeObject(req.query as Record<string, unknown>, 0, 'query') as typeof req.query;
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = this.sanitizeObject(req.params, 0, 'params') as typeof req.params;
      }

      // Sanitize headers (only specific ones)
      this.sanitizeHeaders(req);
    } catch (error) {
      this.logger.error(`Sanitization error: ${error.message}`);
      // Continue even if sanitization fails - don't block the request
    }

    next();
  }

  /**
   * Recursively sanitize an object
   */
  private sanitizeObject(
    obj: Record<string, unknown>,
    depth: number,
    path: string,
  ): Record<string, unknown> {
    if (depth > this.config.maxDepth) {
      this.log(`Max depth reached at ${path}`);
      return obj;
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = `${path}.${key}`;

      // Skip excluded fields
      if (this.config.excludeFields.includes(key)) {
        result[key] = value;
        continue;
      }

      result[key] = this.sanitizeValue(value, key, depth, fieldPath);
    }

    return result;
  }

  /**
   * Sanitize a single value based on its type
   */
  private sanitizeValue(
    value: unknown,
    key: string,
    depth: number,
    path: string,
  ): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle strings
    if (typeof value === 'string') {
      return this.sanitizeString(value, key, path);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        this.sanitizeValue(item, key, depth + 1, `${path}[${index}]`),
      );
    }

    // Handle objects
    if (typeof value === 'object') {
      return this.sanitizeObject(value as Record<string, unknown>, depth + 1, path);
    }

    // Handle numbers, booleans - return as-is
    return value;
  }

  /**
   * Sanitize a string value
   */
  private sanitizeString(value: string, key: string, path: string): string {
    let sanitized = value;
    let method = 'default';

    // Truncate if too long
    if (sanitized.length > this.config.maxStringLength) {
      sanitized = sanitized.substring(0, this.config.maxStringLength);
      this.log(`Truncated ${path} from ${value.length} to ${this.config.maxStringLength} chars`);
    }

    // Apply type-specific sanitization
    if (this.config.emailFields.includes(key)) {
      sanitized = sanitizeEmail(sanitized);
      method = 'email';
    } else if (this.config.urlFields.includes(key)) {
      const sanitizedUrl = sanitizeUrl(sanitized);
      sanitized = sanitizedUrl || '';
      method = 'url';
    } else if (this.config.fileNameFields.includes(key)) {
      sanitized = sanitizeFileName(sanitized);
      method = 'filename';
    } else if (this.config.htmlFields.includes(key)) {
      // HTML fields use HTML sanitizer (allows safe tags)
      sanitized = sanitizeStrict(sanitized);
      method = 'html';
    } else {
      // Default: strip all HTML/script content
      sanitized = sanitizeUserInput(sanitized);
      method = 'user-input';
    }

    if (sanitized !== value) {
      this.log(`Sanitized ${path} using ${method}: "${value.substring(0, 50)}..." -> "${sanitized.substring(0, 50)}..."`);
    }

    return sanitized;
  }

  /**
   * Sanitize specific request headers
   */
  private sanitizeHeaders(req: Request): void {
    const headersToSanitize = ['x-forwarded-for', 'x-real-ip', 'user-agent', 'referer', 'origin'];

    for (const header of headersToSanitize) {
      if (req.headers[header] && typeof req.headers[header] === 'string') {
        const original = req.headers[header] as string;
        const sanitized = sanitizeUserInput(original);
        if (sanitized !== original) {
          req.headers[header] = sanitized;
          this.log(`Sanitized header ${header}`);
        }
      }
    }
  }

  /**
   * Log sanitization action (if enabled)
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      this.logger.debug(message);
    }
  }
}

/**
 * Factory function to create middleware with custom config
 */
export function createInputSanitizationMiddleware(
  config: Partial<SanitizationConfig> = {},
): new () => InputSanitizationMiddleware {
  return class extends InputSanitizationMiddleware {
    constructor() {
      super(config);
    }
  };
}

/**
 * Export default configuration for reference
 */
export { DEFAULT_CONFIG as defaultSanitizationConfig };
