import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RawJobData } from '../interfaces/job-provider.interface';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: {
    searchResults: number;
    jobDetails: number;
    providerHealth: number;
  };
}

@Injectable()
export class JobCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobCacheService.name);
  private redis: Redis | null = null;
  private readonly config: CacheConfig;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      keyPrefix: 'job-aggregator:',
      ttl: {
        searchResults: this.configService.get('CACHE_TTL_SEARCH', 300), // 5 minutes
        jobDetails: this.configService.get('CACHE_TTL_DETAILS', 3600), // 1 hour
        providerHealth: this.configService.get('CACHE_TTL_HEALTH', 60), // 1 minute
      },
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password || undefined,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, caching disabled');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected for job caching');
      });

      this.redis.on('error', (error) => {
        this.logger.warn(`Redis error: ${error.message}`);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.log('Redis connection closed');
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.warn(`Failed to connect to Redis: ${error.message}. Caching disabled.`);
      this.redis = null;
      this.isConnected = false;
    }
  }

  private async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key for search results
   */
  private getSearchKey(provider: string, params: {
    keywords?: string;
    location?: string;
    page?: number;
  }): string {
    const normalized = {
      provider: provider.toLowerCase(),
      keywords: (params.keywords || '').toLowerCase().trim(),
      location: (params.location || '').toLowerCase().trim(),
      page: params.page || 1,
    };
    return `search:${normalized.provider}:${normalized.keywords}:${normalized.location}:${normalized.page}`;
  }

  /**
   * Generate cache key for job details
   */
  private getDetailsKey(provider: string, externalId: string): string {
    return `details:${provider.toLowerCase()}:${externalId}`;
  }

  /**
   * Generate cache key for provider health
   */
  private getHealthKey(provider: string): string {
    return `health:${provider.toLowerCase()}`;
  }

  /**
   * Get cached search results
   */
  async getSearchResults(
    provider: string,
    params: { keywords?: string; location?: string; page?: number },
  ): Promise<RawJobData[] | null> {
    if (!this.isConnected || !this.redis) return null;

    try {
      const key = this.getSearchKey(provider, params);
      const cached = await this.redis.get(key);

      if (cached) {
        this.logger.debug(`Cache hit for search: ${key}`);
        return JSON.parse(cached);
      }

      this.logger.debug(`Cache miss for search: ${key}`);
      return null;
    } catch (error) {
      this.logger.warn(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache search results
   */
  async setSearchResults(
    provider: string,
    params: { keywords?: string; location?: string; page?: number },
    jobs: RawJobData[],
  ): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const key = this.getSearchKey(provider, params);
      await this.redis.setex(key, this.config.ttl.searchResults, JSON.stringify(jobs));
      this.logger.debug(`Cached ${jobs.length} jobs for: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Get cached job details
   */
  async getJobDetails(provider: string, externalId: string): Promise<RawJobData | null> {
    if (!this.isConnected || !this.redis) return null;

    try {
      const key = this.getDetailsKey(provider, externalId);
      const cached = await this.redis.get(key);

      if (cached) {
        this.logger.debug(`Cache hit for job details: ${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      this.logger.warn(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache job details
   */
  async setJobDetails(provider: string, externalId: string, job: RawJobData): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const key = this.getDetailsKey(provider, externalId);
      await this.redis.setex(key, this.config.ttl.jobDetails, JSON.stringify(job));
      this.logger.debug(`Cached job details: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Get cached provider health status
   */
  async getProviderHealth(provider: string): Promise<boolean | null> {
    if (!this.isConnected || !this.redis) return null;

    try {
      const key = this.getHealthKey(provider);
      const cached = await this.redis.get(key);

      if (cached !== null) {
        return cached === 'true';
      }

      return null;
    } catch (error) {
      this.logger.warn(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache provider health status
   */
  async setProviderHealth(provider: string, isHealthy: boolean): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const key = this.getHealthKey(provider);
      await this.redis.setex(key, this.config.ttl.providerHealth, String(isHealthy));
    } catch (error) {
      this.logger.warn(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Invalidate all cached search results for a provider
   */
  async invalidateProviderCache(provider: string): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const pattern = `${this.config.keyPrefix}search:${provider.toLowerCase()}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        // Remove prefix for del command
        const keysWithoutPrefix = keys.map(k => k.replace(this.config.keyPrefix, ''));
        await this.redis.del(...keysWithoutPrefix);
        this.logger.log(`Invalidated ${keys.length} cache entries for ${provider}`);
      }
    } catch (error) {
      this.logger.warn(`Cache invalidation error: ${error.message}`);
    }
  }

  /**
   * Clear all job aggregator cache
   */
  async clearAllCache(): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        const keysWithoutPrefix = keys.map(k => k.replace(this.config.keyPrefix, ''));
        await this.redis.del(...keysWithoutPrefix);
        this.logger.log(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      this.logger.warn(`Cache clear error: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    isConnected: boolean;
    keyCount: number;
    memoryUsage: string;
  }> {
    if (!this.isConnected || !this.redis) {
      return {
        isConnected: false,
        keyCount: 0,
        memoryUsage: '0 bytes',
      };
    }

    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      const info = await this.redis.info('memory');
      const usedMemory = info.match(/used_memory_human:(\S+)/)?.[1] || '0 bytes';

      return {
        isConnected: true,
        keyCount: keys.length,
        memoryUsage: usedMemory,
      };
    } catch (error) {
      return {
        isConnected: false,
        keyCount: 0,
        memoryUsage: '0 bytes',
      };
    }
  }
}
