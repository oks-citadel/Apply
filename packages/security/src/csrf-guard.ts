import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';

export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

/**
 * CSRF Protection Guard for NestJS
 * Validates CSRF tokens for state-changing operations (POST, PUT, PATCH, DELETE)
 *
 * Usage:
 * 1. Add to providers in app.module.ts with APP_GUARD
 * 2. Generate tokens on login and send to client
 * 3. Client sends token in X-CSRF-Token header
 * 4. Use @SkipCsrf() decorator to skip validation for specific endpoints
 */
@Injectable()
export class CsrfGuard implements CanActivate {
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

    // Skip CSRF check for safe methods
    if (this.safeMethods.includes(method)) {
      return true;
    }

    // Get CSRF token from header
    const csrfToken = request.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      throw new UnauthorizedException('CSRF token is required');
    }

    // Get expected token from session or user context
    // This is a simplified version - in production, use proper session management
    const expectedToken = (request as any).user?.csrfToken || (request as any).session?.csrfToken;

    if (!expectedToken) {
      throw new UnauthorizedException('CSRF token validation failed');
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(csrfToken),
      Buffer.from(expectedToken)
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid CSRF token');
    }

    return true;
  }
}

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF Token Service
 * Use this to generate and validate CSRF tokens
 */
@Injectable()
export class CsrfService {
  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    return generateCsrfToken();
  }

  /**
   * Validate CSRF token using constant-time comparison
   */
  validateToken(token: string, expectedToken: string): boolean {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(expectedToken)
      );
    } catch {
      return false;
    }
  }
}
