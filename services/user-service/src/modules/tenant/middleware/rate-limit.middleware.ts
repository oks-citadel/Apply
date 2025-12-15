import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../tenant.service';

/**
 * Per-tenant rate limiting middleware
 */
@Injectable()
export class TenantRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantRateLimitMiddleware.name);
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private readonly tenantService: TenantService) {
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanupRateLimitStore(), 5 * 60 * 1000);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId =
      req.params.id ||
      req.params.tenantId ||
      req.body.tenant_id ||
      req.headers['x-tenant-id'] ||
      req.query.tenant_id;

    if (!tenantId) {
      return next();
    }

    try {
      const license = await this.tenantService.getTenantLicense(tenantId as string);

      // Check rate limits
      const rateLimit = license.rate_limits;
      if (!rateLimit) {
        return next();
      }

      // Per-minute rate limit
      if (rateLimit.apiCallsPerMinute) {
        const minuteKey = `${tenantId}:minute:${Math.floor(Date.now() / 60000)}`;
        const allowed = await this.checkRateLimit(
          minuteKey,
          rateLimit.apiCallsPerMinute,
          60, // 1 minute
        );

        if (!allowed) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Rate limit exceeded: too many requests per minute',
              retryAfter: 60,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // Per-hour rate limit
      if (rateLimit.apiCallsPerHour) {
        const hourKey = `${tenantId}:hour:${Math.floor(Date.now() / 3600000)}`;
        const allowed = await this.checkRateLimit(
          hourKey,
          rateLimit.apiCallsPerHour,
          3600, // 1 hour
        );

        if (!allowed) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Rate limit exceeded: too many requests per hour',
              retryAfter: 3600,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // Per-day rate limit
      if (rateLimit.apiCallsPerDay) {
        if (license.api_calls_today >= rateLimit.apiCallsPerDay) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Rate limit exceeded: daily API call limit reached',
              retryAfter: this.getSecondsUntilMidnight(),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // Increment usage counter (async, don't wait)
      this.tenantService.incrementUsage(tenantId as string, 'api_calls', 1).catch((err) => {
        this.logger.error(`Failed to increment API usage: ${err.message}`);
      });

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit-Minute', rateLimit.apiCallsPerMinute || 'unlimited');
      res.setHeader('X-RateLimit-Limit-Hour', rateLimit.apiCallsPerHour || 'unlimited');
      res.setHeader('X-RateLimit-Limit-Day', rateLimit.apiCallsPerDay || 'unlimited');
      res.setHeader('X-RateLimit-Remaining-Day', Math.max(0, (rateLimit.apiCallsPerDay || 0) - license.api_calls_today));

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Rate limit check failed: ${error.message}`);
      next();
    }
  }

  /**
   * Check rate limit for a specific key
   */
  private async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowSeconds * 1000,
      });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    // Increment count
    entry.count++;
    this.rateLimitStore.set(key, entry);
    return true;
  }

  /**
   * Get seconds until midnight UTC
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}
