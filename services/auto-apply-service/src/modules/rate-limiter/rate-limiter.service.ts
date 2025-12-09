import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

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
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6380);
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      tls: this.configService.get('REDIS_TLS') === 'true' ? {} : undefined,
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
  }

  /**
   * Record a request and update rate limit counters
   */
  async recordRequest(userId: string, platform: string): Promise<void> {
    const limits = this.getPlatformLimits(platform);
    const now = Date.now();

    // Keys
    const hourlyKey = `ratelimit:${userId}:${platform}:hourly`;
    const dailyKey = `ratelimit:${userId}:${platform}:daily`;
    const cooldownKey = `ratelimit:${userId}:${platform}:cooldown`;

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
   */
  private async getWindowCount(key: string): Promise<number> {
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Get TTL for a key in seconds
   */
  private async getKeyTTL(key: string): Promise<number> {
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 3600; // Default 1 hour if not set
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

  /**
   * Close Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
