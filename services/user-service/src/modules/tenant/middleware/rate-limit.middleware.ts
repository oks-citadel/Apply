import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

import type { TenantService } from '../tenant.service';
import type { NestMiddleware} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Per-tenant rate limiting middleware
 * Uses in-memory storage with fail-open pattern for reliability
 * NEVER causes timeouts - tenant service calls limited to 2s max
 */
@Injectable()
export class TenantRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantRateLimitMiddleware.name);
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly TENANT_SERVICE_TIMEOUT_MS = 2000; // 2 second timeout for tenant service calls
  private degradedModeActivations = 0;
  private totalChecks = 0;

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

    this.totalChecks++;

    try {
      // Fail-open: if we can't get the license within 2s, allow the request
      const license = await this.withTimeout(
        this.tenantService.getTenantLicense(tenantId as string),
        this.TENANT_SERVICE_TIMEOUT_MS,
      ).catch((err) => {
        this.degradedModeActivations++;
        this.logger.warn(`Failed to get tenant license, allowing request (fail-open): ${err.message}`, {
          rate_limit_degraded: true,
          error_type: err.message.includes('timeout') ? 'tenant_service_timeout' : 'tenant_service_error',
          gateway_rate_limit_degraded_total: this.degradedModeActivations,
        });
        return null;
      });

      if (!license) {
        return next();
      }

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
      // Fail-open: if there's an unexpected error, allow the request
      this.degradedModeActivations++;
      this.logger.warn(`Rate limit check failed, allowing request (fail-open): ${error.message}`, {
        rate_limit_degraded: true,
        error_type: 'unexpected_error',
      });
      next();
    }
  }

  /**
   * Check rate limit for a specific key
   * Uses fail-open pattern: if there's an error, allow the request
   * This is a synchronous in-memory operation, so extremely fast (<1ms)
   */
  private async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
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
    } catch (error) {
      // Fail-open: if there's an error checking rate limit, allow the request
      this.logger.warn(`Rate limit check failed, allowing request (fail-open): ${error.message}`);
      return true;
    }
  }

  /**
   * Wrap an operation with a timeout
   * Ensures tenant service calls never exceed 2s
   */
  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
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
    let cleanedCount = 0;
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        this.rateLimitStore.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    return {
      totalChecks: this.totalChecks,
      degradedModeActivations: this.degradedModeActivations,
      degradedModePercentage: this.totalChecks > 0 ? (this.degradedModeActivations / this.totalChecks) * 100 : 0,
      activeRateLimitEntries: this.rateLimitStore.size,
    };
  }
}
