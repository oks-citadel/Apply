import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import type { Request } from 'express';

/**
 * JWT Payload interface
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  [key: string]: any;
}

/**
 * Rate Limit Guard
 * Basic rate limiting for report endpoints
 *
 * SECURITY FIX: Replaces mock RateLimitGuard that provided NO protection
 * This is a simple in-memory rate limiter for basic protection
 * For production, consider using Redis-backed rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, number[]>();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 10; // Max requests per window

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as JwtPayload;

    if (!user || !user.sub) {
      return true; // Let auth guard handle authentication
    }

    const userId = user.sub;
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [userId, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter((t) => now - t < this.windowMs);
      if (recent.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, recent);
      }
    }
  }
}
