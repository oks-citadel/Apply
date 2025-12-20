import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

import { Platform } from '../dto/compliance.dto';

import type { ConfigService } from '@nestjs/config';

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  applicationsPerDay: number;
}

interface RateLimitResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  resetAt: Date;
  recommendedDelayMs: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private redis: Redis | null = null;
  private readonly inMemoryStore: Map<string, { count: number; resetAt: Date }> = new Map();

  private readonly platformLimits: Record<Platform, RateLimitConfig> = {
    [Platform.LINKEDIN]: {
      requestsPerMinute: 30,
      requestsPerHour: 200,
      requestsPerDay: 500,
      applicationsPerDay: 25,
    },
    [Platform.INDEED]: {
      requestsPerMinute: 60,
      requestsPerHour: 300,
      requestsPerDay: 1000,
      applicationsPerDay: 50,
    },
    [Platform.GLASSDOOR]: {
      requestsPerMinute: 30,
      requestsPerHour: 150,
      requestsPerDay: 400,
      applicationsPerDay: 20,
    },
    [Platform.GREENHOUSE]: {
      requestsPerMinute: 60,
      requestsPerHour: 500,
      requestsPerDay: 2000,
      applicationsPerDay: 100,
    },
    [Platform.LEVER]: {
      requestsPerMinute: 60,
      requestsPerHour: 500,
      requestsPerDay: 2000,
      applicationsPerDay: 100,
    },
    [Platform.WORKDAY]: {
      requestsPerMinute: 20,
      requestsPerHour: 100,
      requestsPerDay: 300,
      applicationsPerDay: 15,
    },
    [Platform.ICIMS]: {
      requestsPerMinute: 40,
      requestsPerHour: 200,
      requestsPerDay: 600,
      applicationsPerDay: 30,
    },
    [Platform.TALEO]: {
      requestsPerMinute: 30,
      requestsPerHour: 150,
      requestsPerDay: 500,
      applicationsPerDay: 25,
    },
    [Platform.SMARTRECRUITERS]: {
      requestsPerMinute: 60,
      requestsPerHour: 400,
      requestsPerDay: 1500,
      applicationsPerDay: 75,
    },
    [Platform.JOBVITE]: {
      requestsPerMinute: 50,
      requestsPerHour: 300,
      requestsPerDay: 1000,
      applicationsPerDay: 50,
    },
    [Platform.GENERIC]: {
      requestsPerMinute: 60,
      requestsPerHour: 300,
      requestsPerDay: 1000,
      applicationsPerDay: 50,
    },
  };

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      const redisHost = this.configService.get('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get('REDIS_PORT', 6379);
      const redisPassword = this.configService.get('REDIS_PASSWORD');

      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis connection error: ${err.message}, falling back to in-memory store`);
        this.redis = null;
      });

      this.redis.connect().catch(() => {
        this.logger.warn('Redis connection failed, using in-memory store');
        this.redis = null;
      });
    } catch (error) {
      this.logger.warn('Redis initialization failed, using in-memory store');
      this.redis = null;
    }
  }

  async checkRateLimit(
    userId: string,
    platform: Platform,
    operation: string,
    customLimits?: Partial<RateLimitConfig>,
  ): Promise<RateLimitResult> {
    const limits = {
      ...this.platformLimits[platform],
      ...customLimits,
    };

    const _now = new Date();

    // Check minute limit
    const minuteResult = await this.checkWindow(
      userId,
      platform,
      operation,
      'minute',
      limits.requestsPerMinute,
      60,
    );

    if (!minuteResult.allowed) {
      return minuteResult;
    }

    // Check hour limit
    const hourResult = await this.checkWindow(
      userId,
      platform,
      operation,
      'hour',
      limits.requestsPerHour,
      3600,
    );

    if (!hourResult.allowed) {
      return hourResult;
    }

    // Check day limit
    const dayResult = await this.checkWindow(
      userId,
      platform,
      operation,
      'day',
      limits.requestsPerDay,
      86400,
    );

    if (!dayResult.allowed) {
      return dayResult;
    }

    // If all checks pass, increment counters
    await this.incrementCounters(userId, platform, operation);

    return {
      allowed: true,
      currentUsage: dayResult.currentUsage + 1,
      limit: limits.requestsPerDay,
      resetAt: dayResult.resetAt,
      recommendedDelayMs: this.calculateDelay(minuteResult.currentUsage, limits.requestsPerMinute),
    };
  }

  async checkApplicationLimit(
    userId: string,
    platform: Platform,
    customLimit?: number,
  ): Promise<RateLimitResult> {
    const limit = customLimit || this.platformLimits[platform].applicationsPerDay;

    return this.checkWindow(userId, platform, 'application', 'day', limit, 86400);
  }

  private async checkWindow(
    userId: string,
    platform: Platform,
    operation: string,
    window: 'minute' | 'hour' | 'day',
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${userId}:${platform}:${operation}:${window}`;
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowSeconds * 1000);

    let currentUsage = 0;

    if (this.redis) {
      try {
        const count = await this.redis.get(key);
        currentUsage = count ? parseInt(count, 10) : 0;
      } catch (error) {
        this.logger.error(`Redis error: ${error}`);
        currentUsage = this.getInMemoryCount(key);
      }
    } else {
      currentUsage = this.getInMemoryCount(key);
    }

    const allowed = currentUsage < limit;
    const recommendedDelayMs = allowed ? 0 : (resetAt.getTime() - now.getTime()) / (limit - currentUsage + 1);

    return {
      allowed,
      currentUsage,
      limit,
      resetAt,
      recommendedDelayMs: Math.max(0, recommendedDelayMs),
    };
  }

  private async incrementCounters(
    userId: string,
    platform: Platform,
    operation: string,
  ): Promise<void> {
    const windows = [
      { name: 'minute', seconds: 60 },
      { name: 'hour', seconds: 3600 },
      { name: 'day', seconds: 86400 },
    ];

    for (const window of windows) {
      const key = `ratelimit:${userId}:${platform}:${operation}:${window.name}`;

      if (this.redis) {
        try {
          const multi = this.redis.multi();
          multi.incr(key);
          multi.expire(key, window.seconds);
          await multi.exec();
        } catch (error) {
          this.logger.error(`Redis increment error: ${error}`);
          this.incrementInMemory(key, window.seconds);
        }
      } else {
        this.incrementInMemory(key, window.seconds);
      }
    }
  }

  private getInMemoryCount(key: string): number {
    const entry = this.inMemoryStore.get(key);
    if (!entry) {return 0;}

    if (new Date() > entry.resetAt) {
      this.inMemoryStore.delete(key);
      return 0;
    }

    return entry.count;
  }

  private incrementInMemory(key: string, ttlSeconds: number): void {
    const now = new Date();
    const existing = this.inMemoryStore.get(key);

    if (existing && now < existing.resetAt) {
      existing.count++;
    } else {
      this.inMemoryStore.set(key, {
        count: 1,
        resetAt: new Date(now.getTime() + ttlSeconds * 1000),
      });
    }
  }

  private calculateDelay(currentUsage: number, limit: number): number {
    // Calculate recommended delay to spread requests evenly
    const utilizationRatio = currentUsage / limit;

    if (utilizationRatio < 0.5) {return 0;}
    if (utilizationRatio < 0.75) {return 500;}
    if (utilizationRatio < 0.9) {return 1000;}
    return 2000;
  }

  getPlatformLimits(platform: Platform): RateLimitConfig {
    return this.platformLimits[platform];
  }

  async resetLimits(userId: string, platform: Platform): Promise<void> {
    const patterns = [
      `ratelimit:${userId}:${platform}:*`,
    ];

    if (this.redis) {
      try {
        for (const pattern of patterns) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      } catch (error) {
        this.logger.error(`Redis reset error: ${error}`);
      }
    }

    // Clear in-memory store for this user/platform
    for (const key of this.inMemoryStore.keys()) {
      if (key.startsWith(`ratelimit:${userId}:${platform}:`)) {
        this.inMemoryStore.delete(key);
      }
    }
  }
}
