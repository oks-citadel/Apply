import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import {
  CacheTTL,
  generateSearchCacheKey,
  generateJobDetailCacheKey,
  generateRecommendedCacheKey,
  generateSimilarJobsCacheKey,
  generateSavedJobsCacheKey,
  getSearchCachePattern,
  getJobRelatedCachePatterns,
  getUserRelatedCachePatterns,
  CacheKeyPrefixes,
} from './cache-keys.util';

@Injectable()
export class RedisCacheService implements OnModuleInit {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis | null = null;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      // Create a separate Redis client for pattern-based operations (SCAN)
      const redisHost = this.configService.get<string>('redis.host', 'localhost');
      const redisPort = this.configService.get<number>('redis.port', 6380);
      const redisPassword = this.configService.get<string>('redis.password', '');
      const redisTls = this.configService.get<boolean>('redis.tls', false);

      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        tls: redisTls ? {} : undefined,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 1000, 3000);
        },
        lazyConnect: true,
      });

      await this.redisClient.connect();
      this.logger.log('Redis cache service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Redis client: ${error.message}`);
      this.redisClient = null;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT for key: ${key}`);
      } else {
        this.logger.debug(`Cache MISS for key: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET for key: ${key} with TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete a specific cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete multiple cache keys by pattern
   * Uses Redis SCAN to find keys matching pattern and deletes them
   */
  async delByPattern(pattern: string): Promise<number> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available for pattern deletion');
      return 0;
    }

    try {
      let deletedCount = 0;
      let cursor = '0';

      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      this.logger.debug(`Cache DEL by pattern ${pattern}: ${deletedCount} keys deleted`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Error deleting cache by pattern ${pattern}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get or set cache with callback function
   * If cache exists, returns cached value; otherwise executes callback and caches result
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }

  // ==================== Job-specific caching methods ====================

  /**
   * Get cached job search results
   */
  async getSearchResults<T>(searchParams: Record<string, any>): Promise<T | null> {
    const key = generateSearchCacheKey(searchParams);
    return this.get<T>(key);
  }

  /**
   * Set job search results in cache
   */
  async setSearchResults<T>(searchParams: Record<string, any>, results: T): Promise<void> {
    const key = generateSearchCacheKey(searchParams);
    await this.set(key, results, CacheTTL.SEARCH_RESULTS);
  }

  /**
   * Get cached job detail
   */
  async getJobDetail<T>(jobId: string): Promise<T | null> {
    const key = generateJobDetailCacheKey(jobId);
    return this.get<T>(key);
  }

  /**
   * Set job detail in cache
   */
  async setJobDetail<T>(jobId: string, job: T): Promise<void> {
    const key = generateJobDetailCacheKey(jobId);
    await this.set(key, job, CacheTTL.JOB_DETAIL);
  }

  /**
   * Get cached recommended jobs for user
   */
  async getRecommendedJobs<T>(userId: string, page: number = 1, limit: number = 20): Promise<T | null> {
    const key = generateRecommendedCacheKey(userId, page, limit);
    return this.get<T>(key);
  }

  /**
   * Set recommended jobs in cache
   */
  async setRecommendedJobs<T>(userId: string, page: number, limit: number, jobs: T): Promise<void> {
    const key = generateRecommendedCacheKey(userId, page, limit);
    await this.set(key, jobs, CacheTTL.RECOMMENDED_JOBS);
  }

  /**
   * Get cached similar jobs
   */
  async getSimilarJobs<T>(jobId: string, limit: number = 10): Promise<T | null> {
    const key = generateSimilarJobsCacheKey(jobId, limit);
    return this.get<T>(key);
  }

  /**
   * Set similar jobs in cache
   */
  async setSimilarJobs<T>(jobId: string, limit: number, jobs: T): Promise<void> {
    const key = generateSimilarJobsCacheKey(jobId, limit);
    await this.set(key, jobs, CacheTTL.SIMILAR_JOBS);
  }

  /**
   * Get cached saved jobs for user
   */
  async getSavedJobs<T>(userId: string, page: number = 1, limit: number = 20): Promise<T | null> {
    const key = generateSavedJobsCacheKey(userId, page, limit);
    return this.get<T>(key);
  }

  /**
   * Set saved jobs in cache
   */
  async setSavedJobs<T>(userId: string, page: number, limit: number, jobs: T): Promise<void> {
    const key = generateSavedJobsCacheKey(userId, page, limit);
    await this.set(key, jobs, CacheTTL.SAVED_JOBS);
  }

  // ==================== Cache invalidation methods ====================

  /**
   * Invalidate all search result caches
   * Call this when jobs are created, updated, or deleted
   */
  async invalidateSearchCache(): Promise<void> {
    const pattern = getSearchCachePattern();
    const deletedCount = await this.delByPattern(pattern);
    this.logger.log(`Invalidated ${deletedCount} search cache entries`);
  }

  /**
   * Invalidate all caches related to a specific job
   * Call this when a job is updated or deleted
   */
  async invalidateJobCache(jobId: string): Promise<void> {
    const patterns = getJobRelatedCachePatterns(jobId);
    let totalDeleted = 0;

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        totalDeleted += await this.delByPattern(pattern);
      } else {
        await this.del(pattern);
        totalDeleted++;
      }
    }

    this.logger.log(`Invalidated ${totalDeleted} cache entries for job ${jobId}`);
  }

  /**
   * Invalidate all caches related to a specific user
   * Call this when user's saved jobs change
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = getUserRelatedCachePatterns(userId);
    let totalDeleted = 0;

    for (const pattern of patterns) {
      totalDeleted += await this.delByPattern(pattern);
    }

    this.logger.log(`Invalidated ${totalDeleted} cache entries for user ${userId}`);
  }

  /**
   * Invalidate all job-related caches
   * Use with caution - only for major data changes or maintenance
   */
  async invalidateAllJobCaches(): Promise<void> {
    const prefixes = Object.values(CacheKeyPrefixes);
    let totalDeleted = 0;

    for (const prefix of prefixes) {
      totalDeleted += await this.delByPattern(`${prefix}*`);
    }

    this.logger.log(`Invalidated ${totalDeleted} total cache entries`);
  }

  /**
   * Check if Redis is connected and healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.redisClient) {
        return false;
      }
      await this.redisClient.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cache statistics (approximate)
   */
  async getStats(): Promise<{ keyCount: number; memoryUsage: string } | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const info = await this.redisClient.info('memory');
      const dbSize = await this.redisClient.dbsize();

      // Parse memory usage from INFO output
      const usedMemoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = usedMemoryMatch ? usedMemoryMatch[1] : 'unknown';

      return {
        keyCount: dbSize,
        memoryUsage,
      };
    } catch (error) {
      this.logger.error(`Error getting cache stats: ${error.message}`);
      return null;
    }
  }
}
