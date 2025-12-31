import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

// ConfigService interface for optional injection
interface ConfigServiceInterface {
  get<T = string>(key: string, defaultValue?: T): T | undefined;
}

export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

// CSRF Cookie name
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * CSRF Protection Guard for NestJS using Double-Submit Cookie Pattern
 *
 * This implementation uses the Double-Submit Cookie pattern which is ideal for
 * stateless JWT-based authentication:
 *
 * 1. Server sets a CSRF token in a cookie (readable by JavaScript, SameSite=Strict)
 * 2. Client reads the cookie and sends the token in the X-CSRF-Token header
 * 3. Server validates that the cookie value matches the header value
 *
 * Security guarantees:
 * - An attacker on a different origin cannot read the CSRF cookie (SameSite + CORS)
 * - An attacker cannot set headers on cross-origin requests
 * - Both values must match for the request to succeed
 *
 * Usage:
 * 1. Add CsrfGuard to providers in app.module.ts with APP_GUARD
 * 2. Add CsrfService to providers
 * 3. Call CsrfService.setToken(response) on login/auth endpoints
 * 4. Client reads XSRF-TOKEN cookie and sends value in X-CSRF-Token header
 * 5. Use @SkipCsrf() decorator to skip validation for specific endpoints
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  private readonly safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Skip CSRF check for safe methods (they should be idempotent)
    if (this.safeMethods.includes(method)) {
      return true;
    }

    // Skip CSRF check for service-to-service requests (identified by service auth header)
    const serviceAuthHeader = request.headers['x-service-auth'];
    if (serviceAuthHeader) {
      this.logger.debug('Skipping CSRF check for service-to-service request');
      return true;
    }

    // Get CSRF token from header
    const headerToken = request.headers[CSRF_HEADER_NAME] as string;

    if (!headerToken) {
      this.logger.warn(`CSRF token missing in header for ${method} ${request.path}`);
      throw new UnauthorizedException('CSRF token is required');
    }

    // Get CSRF token from cookie (Double-Submit Cookie Pattern)
    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];

    if (!cookieToken) {
      this.logger.warn(`CSRF cookie missing for ${method} ${request.path}`);
      throw new UnauthorizedException('CSRF token cookie is required');
    }

    // Validate token format (should be 64 hex characters = 32 bytes)
    if (!/^[a-f0-9]{64}$/i.test(headerToken) || !/^[a-f0-9]{64}$/i.test(cookieToken)) {
      this.logger.warn(`Invalid CSRF token format for ${method} ${request.path}`);
      throw new UnauthorizedException('Invalid CSRF token format');
    }

    // Constant-time comparison to prevent timing attacks
    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(headerToken, 'hex'),
        Buffer.from(cookieToken, 'hex')
      );

      if (!isValid) {
        this.logger.warn(`CSRF token mismatch for ${method} ${request.path}`);
        throw new UnauthorizedException('Invalid CSRF token');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`CSRF token comparison error for ${method} ${request.path}: ${error}`);
      throw new UnauthorizedException('Invalid CSRF token');
    }

    this.logger.debug(`CSRF validation passed for ${method} ${request.path}`);
    return true;
  }
}

/**
 * Generate a cryptographically secure CSRF token
 * Returns a 64-character hex string (32 bytes of entropy)
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF Cookie options for secure token storage
 */
export interface CsrfCookieOptions {
  /** Whether the app is running in production */
  isProduction?: boolean;
  /** Cookie domain (e.g., '.applyforus.com') */
  domain?: string;
  /** Cookie path (defaults to '/') */
  path?: string;
  /** Cookie max age in seconds (defaults to 24 hours) */
  maxAge?: number;
}

// Injection token for ConfigService to avoid direct dependency on @nestjs/config
export const CSRF_CONFIG_SERVICE = 'CSRF_CONFIG_SERVICE';

/**
 * CSRF Token Service
 * Provides methods to generate, set, and validate CSRF tokens
 * Uses the Double-Submit Cookie pattern for stateless CSRF protection
 */
@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);

  constructor(
    @Optional() @Inject(CSRF_CONFIG_SERVICE)
    private readonly configService?: ConfigServiceInterface,
  ) {}

  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    return generateCsrfToken();
  }

  /**
   * Set CSRF token cookie on the response
   * This should be called after successful authentication
   *
   * @param response - Express response object
   * @param options - Cookie configuration options
   * @returns The generated CSRF token
   */
  setToken(response: Response, options?: CsrfCookieOptions): string {
    const token = this.generateToken();
    const isProduction = options?.isProduction ??
      (this.configService?.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';

    const cookieOptions = {
      httpOnly: false, // Must be readable by JavaScript for Double-Submit pattern
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict' as const, // Strict SameSite to prevent CSRF
      path: options?.path ?? '/',
      maxAge: (options?.maxAge ?? 86400) * 1000, // Convert to milliseconds (default 24 hours)
      ...(options?.domain && { domain: options.domain }),
    };

    response.cookie(CSRF_COOKIE_NAME, token, cookieOptions);
    this.logger.debug('CSRF token cookie set');

    return token;
  }

  /**
   * Clear CSRF token cookie (call on logout)
   *
   * @param response - Express response object
   * @param options - Cookie configuration options
   */
  clearToken(response: Response, options?: CsrfCookieOptions): void {
    const isProduction = options?.isProduction ??
      (this.configService?.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';

    response.clearCookie(CSRF_COOKIE_NAME, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      path: options?.path ?? '/',
      ...(options?.domain && { domain: options.domain }),
    });
    this.logger.debug('CSRF token cookie cleared');
  }

  /**
   * Validate CSRF token using constant-time comparison
   * Note: The CsrfGuard handles validation automatically.
   * This method is provided for manual validation if needed.
   *
   * @param headerToken - Token from X-CSRF-Token header
   * @param cookieToken - Token from XSRF-TOKEN cookie
   * @returns true if tokens match
   */
  validateToken(headerToken: string, cookieToken: string): boolean {
    try {
      // Validate format first
      if (!/^[a-f0-9]{64}$/i.test(headerToken) || !/^[a-f0-9]{64}$/i.test(cookieToken)) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(headerToken, 'hex'),
        Buffer.from(cookieToken, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Refresh the CSRF token
   * Call this periodically or after sensitive operations for added security
   *
   * @param response - Express response object
   * @param options - Cookie configuration options
   * @returns The new CSRF token
   */
  refreshToken(response: Response, options?: CsrfCookieOptions): string {
    return this.setToken(response, options);
  }
}
