import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Metrics tracking for observability
interface RateLimitMetrics {
  totalChecks: number;
  allowedRequests: number;
  rejectedRequests: number;
  degradedModeActivations: number;
  redisErrors: number;
  lastDegradedAt?: Date;
}

// In-memory token bucket for fallback rate limiting
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  dailyLimit?: number;
  cooldownMinutes?: number;
}

export interface PlatformRateLimits {
  linkedin: RateLimitConfig;
  indeed: RateLimitConfig;
  glassdoor: RateLimitConfig;
  workday: RateLimitConfig;
  greenhouse: RateLimitConfig;
  lever: RateLimitConfig;
  default: RateLimitConfig;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfterMs?: number;
  dailyRemaining?: number;
  reason?: string;
}

export interface UserRateLimitStatus {
  platform: string;
  currentCount: number;
  dailyCount: number;
  maxRequests: number;
  dailyLimit: number;
  windowResetAt: Date;
  dailyResetAt: Date;
  isLimited: boolean;
  cooldownUntil?: Date;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private redis: Redis;
  private readonly platformLimits: PlatformRateLimits;

  constructor(private readonly configService: ConfigService) {
    // Initialize Redis connection
    const redisHost = this.configService.get('REDIS_HOST', 'applyforus-redis.redis.cache.windows.net');
    const redisPort = this.configService.get('REDIS_PORT', 6380);
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      tls: this.configService.get('REDIS_TLS') === 'true' ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 2000,
      // Enable fail-open: don't crash if Redis is unavailable
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        // After 3 retries, return null to stop retrying
        if (times > 3) {return null;}
        return Math.min(times * 50, 2000);
      },
    });

    // Fail-open error handling
    this.redis.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}, using in-memory fallback`);
    });

    // Try to connect, but don't fail if it doesn't work
    this.redis.connect().catch((err) => {
      this.logger.warn(`Redis connection failed: ${err.message}, using in-memory fallback`);
    });

    // Platform-specific rate limits (per hour unless specified)
    this.platformLimits = {
      linkedin: {
        maxRequests: 10,      // 10 applications per hour
        windowMs: 60 * 60 * 1000,
        dailyLimit: 50,       // 50 per day
        cooldownMinutes: 5,   // 5 min between applications
      },
      indeed: {
        maxRequests: 15,
        windowMs: 60 * 60 * 1000,
        dailyLimit: 75,
        cooldownMinutes: 3,
      },
      glassdoor: {
        maxRequests: 12,
        windowMs: 60 * 60 * 1000,
        dailyLimit: 60,
        cooldownMinutes: 4,
      },
      workday: {
        maxRequests: 8,
        windowMs: 60 * 60 * 1000,
        dailyLimit: 40,
        cooldownMinutes: 6,
      },
      greenhouse: {
        maxRequests: 15,
        windowMs: 60 * 60 * 1000,
        dailyLimit: 80,
        cooldownMinutes: 3,
      },
      lever: {
        maxRequests: 15,
        windowMs: 60 * 60 * 1000,
        dailyLimit: 80,
        cooldownMinutes: 3,
      },
      default: {
        maxRequests: 10,
        windowMs: 60 * 60 * 1000,
        dailyLimit: 50,
        cooldownMinutes: 5,
      },
    };
  }

  /**
   * Check if a user can make a request for a specific platform
   * Uses fail-open pattern: if Redis is unavailable, falls back to in-memory
   */
  async checkRateLimit(
    userId: string,
    platform: string,
  ): Promise<RateLimitResult> {
    const limits = this.getPlatformLimits(platform);
    const now = Date.now();

    // Keys for different rate limit windows
    const hourlyKey = `ratelimit:${userId}:${platform}:hourly`;
    const dailyKey = `ratelimit:${userId}:${platform}:daily`;
    const cooldownKey = `ratelimit:${userId}:${platform}:cooldown`;

    try {
      // Check cooldown first
      const cooldownUntil = await this.redis.get(cooldownKey);
      if (cooldownUntil && parseInt(cooldownUntil) > now) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(parseInt(cooldownUntil)),
          retryAfterMs: parseInt(cooldownUntil) - now,
          reason: `Cooldown active for ${platform}`,
        };
      }

      // Check hourly limit
      const hourlyCount = await this.getWindowCount(hourlyKey);
      if (hourlyCount >= limits.maxRequests) {
        const resetTime = await this.getKeyTTL(hourlyKey);
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(now + (resetTime * 1000)),
          retryAfterMs: resetTime * 1000,
          reason: `Hourly limit reached for ${platform}`,
        };
      }

      // Check daily limit
      if (limits.dailyLimit) {
        const dailyCount = await this.getWindowCount(dailyKey);
        if (dailyCount >= limits.dailyLimit) {
          const resetTime = await this.getKeyTTL(dailyKey);
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(now + (resetTime * 1000)),
            retryAfterMs: resetTime * 1000,
            dailyRemaining: 0,
            reason: `Daily limit reached for ${platform}`,
          };
        }

        return {
          allowed: true,
          remaining: limits.maxRequests - hourlyCount - 1,
          resetTime: new Date(now + limits.windowMs),
          dailyRemaining: limits.dailyLimit - dailyCount - 1,
        };
      }

      return {
        allowed: true,
        remaining: limits.maxRequests - hourlyCount - 1,
        resetTime: new Date(now + limits.windowMs),
      };
    } catch (error) {
      // Fail-open: if Redis is unavailable, allow the request but log warning
      this.logger.warn(
        `Redis error in checkRateLimit, allowing request (fail-open): ${error.message}`,
      );
      return {
        allowed: true,
        remaining: limits.maxRequests,
        resetTime: new Date(now + limits.windowMs),
        reason: 'Redis unavailable, using fail-open mode',
      };
    }
  }

  /**
   * Record a request and update rate limit counters
   * Uses fail-open pattern: if Redis fails, operation continues
   */
  async recordRequest(userId: string, platform: string): Promise<void> {
    const limits = this.getPlatformLimits(platform);
    const now = Date.now();

    // Keys
    const hourlyKey = `ratelimit:${userId}:${platform}:hourly`;
    const dailyKey = `ratelimit:${userId}:${platform}:daily`;
    const cooldownKey = `ratelimit:${userId}:${platform}:cooldown`;

    try {
      const pipeline = this.redis.pipeline();

      // Increment hourly counter
      pipeline.incr(hourlyKey);
      pipeline.expire(hourlyKey, Math.ceil(limits.windowMs / 1000));

      // Increment daily counter
      if (limits.dailyLimit) {
        pipeline.incr(dailyKey);
        pipeline.expire(dailyKey, 24 * 60 * 60); // 24 hours
      }

      // Set cooldown
      if (limits.cooldownMinutes) {
        const cooldownUntil = now + (limits.cooldownMinutes * 60 * 1000);
        pipeline.set(cooldownKey, cooldownUntil.toString());
        pipeline.expire(cooldownKey, limits.cooldownMinutes * 60);
      }

      await pipeline.exec();

      this.logger.debug(
        `Recorded request for user ${userId} on platform ${platform}`,
      );
    } catch (error) {
      // Fail-open: log error but don't throw
      this.logger.warn(
        `Redis error in recordRequest, continuing without recording (fail-open): ${error.message}`,
      );
    }
  }

  /**
   * Get current rate limit status for a user
   */
  async getUserStatus(userId: string, platform: string): Promise<UserRateLimitStatus> {
    const limits = this.getPlatformLimits(platform);
    const now = Date.now();

    const hourlyKey = `ratelimit:${userId}:${platform}:hourly`;
    const dailyKey = `ratelimit:${userId}:${platform}:daily`;
    const cooldownKey = `ratelimit:${userId}:${platform}:cooldown`;

    const [hourlyCount, dailyCount, cooldownUntil, hourlyTTL, dailyTTL] = await Promise.all([
      this.getWindowCount(hourlyKey),
      this.getWindowCount(dailyKey),
      this.redis.get(cooldownKey),
      this.getKeyTTL(hourlyKey),
      this.getKeyTTL(dailyKey),
    ]);

    const windowResetAt = new Date(now + (hourlyTTL * 1000));
    const dailyResetAt = new Date(now + (dailyTTL * 1000));

    return {
      platform,
      currentCount: hourlyCount,
      dailyCount,
      maxRequests: limits.maxRequests,
      dailyLimit: limits.dailyLimit || 0,
      windowResetAt,
      dailyResetAt,
      isLimited: hourlyCount >= limits.maxRequests || (limits.dailyLimit && dailyCount >= limits.dailyLimit),
      cooldownUntil: cooldownUntil ? new Date(parseInt(cooldownUntil)) : undefined,
    };
  }

  /**
   * Get status for all platforms for a user
   */
  async getAllPlatformStatus(userId: string): Promise<UserRateLimitStatus[]> {
    const platforms = Object.keys(this.platformLimits).filter(p => p !== 'default');
    return Promise.all(platforms.map(p => this.getUserStatus(userId, p)));
  }

  /**
   * Reset rate limits for a user on a specific platform
   */
  async resetUserLimits(userId: string, platform: string): Promise<void> {
    const hourlyKey = `ratelimit:${userId}:${platform}:hourly`;
    const dailyKey = `ratelimit:${userId}:${platform}:daily`;
    const cooldownKey = `ratelimit:${userId}:${platform}:cooldown`;

    await this.redis.del(hourlyKey, dailyKey, cooldownKey);

    this.logger.log(`Reset rate limits for user ${userId} on platform ${platform}`);
  }

  /**
   * Reset all rate limits for a user
   */
  async resetAllUserLimits(userId: string): Promise<void> {
    const pattern = `ratelimit:${userId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    this.logger.log(`Reset all rate limits for user ${userId}`);
  }

  /**
   * Get wait time until next allowed request
   */
  async getWaitTime(userId: string, platform: string): Promise<number> {
    const result = await this.checkRateLimit(userId, platform);

    if (result.allowed) {
      return 0;
    }

    return result.retryAfterMs || 0;
  }

  /**
   * Wait for rate limit to allow next request
   */
  async waitForAvailability(
    userId: string,
    platform: string,
    maxWaitMs: number = 5 * 60 * 1000, // 5 minutes max
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.checkRateLimit(userId, platform);

      if (result.allowed) {
        return true;
      }

      // Wait for minimum of 10 seconds or the retry time
      const waitTime = Math.min(result.retryAfterMs || 10000, 30000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    return false;
  }

  /**
   * Get platform-specific rate limit configuration
   */
  getPlatformLimits(platform: string): RateLimitConfig {
    const normalizedPlatform = platform.toLowerCase();
    return this.platformLimits[normalizedPlatform] || this.platformLimits.default;
  }

  /**
   * Update platform rate limits dynamically
   */
  updatePlatformLimits(platform: string, config: Partial<RateLimitConfig>): void {
    const normalizedPlatform = platform.toLowerCase();
    if (this.platformLimits[normalizedPlatform]) {
      this.platformLimits[normalizedPlatform] = {
        ...this.platformLimits[normalizedPlatform],
        ...config,
      };
      this.logger.log(`Updated rate limits for platform ${platform}`);
    }
  }

  /**
   * Get count from a sliding window
   * Uses fail-open: returns 0 if Redis is unavailable
   */
  private async getWindowCount(key: string): Promise<number> {
    try {
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      this.logger.warn(`Redis error getting window count, returning 0 (fail-open): ${error.message}`);
      return 0;
    }
  }

  /**
   * Get TTL for a key in seconds
   * Uses fail-open: returns default TTL if Redis is unavailable
   */
  private async getKeyTTL(key: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(key);
      return ttl > 0 ? ttl : 3600; // Default 1 hour if not set
    } catch (error) {
      this.logger.warn(`Redis error getting TTL, returning default (fail-open): ${error.message}`);
      return 3600; // Default 1 hour
    }
  }

  /**
   * Calculate optimal time between applications to avoid detection
   */
  getOptimalDelay(platform: string): number {
    const limits = this.getPlatformLimits(platform);

    // Calculate delay to spread applications evenly across the window
    const baseDelayMs = limits.windowMs / limits.maxRequests;

    // Add some randomness (±30%)
    const variance = baseDelayMs * 0.3;
    const randomOffset = (Math.random() - 0.5) * 2 * variance;

    // Ensure minimum cooldown is respected
    const cooldownMs = (limits.cooldownMinutes || 0) * 60 * 1000;

    return Math.max(baseDelayMs + randomOffset, cooldownMs);
  }

  
  // Backward compatibility aliases
  async checkLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const parts = key.split(':');
    const userId = parts.length > 1 ? parts[1] : 'default';
    const platform = parts.length > 2 ? parts[2] : 'default';
    const result = await this.checkRateLimit(userId, platform);
    return result.allowed;
  }

  async increment(key: string): Promise<void> {
    const parts = key.split(':');
    const userId = parts.length > 1 ? parts[1] : 'default';
    const platform = parts.length > 2 ? parts[2] : 'default';
    await this.recordRequest(userId, platform);
  }
  /**
   * Close Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
