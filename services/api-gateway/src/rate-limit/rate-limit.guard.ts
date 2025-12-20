import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';

interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

@Injectable()
export class TierRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(TierRateLimitGuard.name);
  private readonly requestCounts = new Map<string, { count: number; resetAt: number }>();

  // Tier-based rate limits (requests per minute)
  private readonly tierLimits: Record<string, RateLimitConfig> = {
    free: { limit: 60, window: 60 }, // 60 requests per minute
    basic: { limit: 300, window: 60 }, // 300 requests per minute
    pro: { limit: 1000, window: 60 }, // 1000 requests per minute
    enterprise: { limit: 5000, window: 60 }, // 5000 requests per minute
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip rate limiting for certain routes (like health checks)
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      'skipRateLimit',
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    // Get user tier (default to 'free' if not authenticated)
    const tier = user?.tier || 'free';
    const userId = user?.userId || request.ip;

    // Get rate limit config for tier
    const config = this.tierLimits[tier] || this.tierLimits.free;

    // Create unique key for this user
    const key = `${userId}:${tier}`;

    // Get or initialize counter
    const now = Date.now();
    let record = this.requestCounts.get(key);

    if (!record || now > record.resetAt) {
      // Initialize new window
      record = {
        count: 0,
        resetAt: now + config.window * 1000,
      };
      this.requestCounts.set(key, record);
    }

    // Increment counter
    record.count++;

    // Check if limit exceeded
    if (record.count > config.limit) {
      const resetIn = Math.ceil((record.resetAt - now) / 1000);

      this.logger.warn(
        `Rate limit exceeded for user ${userId} (tier: ${tier}). ${record.count}/${config.limit} requests`,
      );

      // Set rate limit headers
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', config.limit);
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader('X-RateLimit-Reset', record.resetAt);
      response.setHeader('Retry-After', resetIn);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.limit);
    response.setHeader('X-RateLimit-Remaining', config.limit - record.count);
    response.setHeader('X-RateLimit-Reset', record.resetAt);

    this.logger.debug(
      `Request count for ${userId} (tier: ${tier}): ${record.count}/${config.limit}`,
    );

    return true;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetAt) {
        this.requestCounts.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Get current request count for a user
   */
  getRequestCount(userId: string, tier: string): number {
    const key = `${userId}:${tier}`;
    const record = this.requestCounts.get(key);
    return record?.count || 0;
  }

  /**
   * Reset rate limit for a user
   */
  resetLimit(userId: string, tier: string): void {
    const key = `${userId}:${tier}`;
    this.requestCounts.delete(key);
    this.logger.log(`Rate limit reset for ${userId} (tier: ${tier})`);
  }
}
