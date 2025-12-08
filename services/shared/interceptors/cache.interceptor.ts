import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * HTTP Response Caching Interceptor
 * Implements intelligent caching for API responses
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize = 1000;
  private readonly defaultTTL = 60000; // 1 minute

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Skip cache if explicitly requested
    if (request.headers['cache-control'] === 'no-cache') {
      return next.handle();
    }

    // Generate cache key from URL and query params
    const cacheKey = this.generateCacheKey(request);

    // Check if we have a cached response
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && !this.isExpired(cachedEntry)) {
      this.logger.debug(`Cache HIT for key: ${cacheKey}`);

      // Set cache headers
      response.setHeader('X-Cache', 'HIT');
      response.setHeader('Cache-Control', `public, max-age=${Math.floor((cachedEntry.expiresAt - Date.now()) / 1000)}`);

      return of(cachedEntry.data);
    }

    this.logger.debug(`Cache MISS for key: ${cacheKey}`);
    response.setHeader('X-Cache', 'MISS');

    // Get TTL from custom decorator or use default
    const ttl = this.getTTL(context) || this.defaultTTL;

    return next.handle().pipe(
      tap(data => {
        // Only cache successful responses
        if (response.statusCode >= 200 && response.statusCode < 300) {
          this.setCache(cacheKey, data, ttl);

          // Set cache headers
          response.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
          response.setHeader('X-Cache-TTL', ttl.toString());
        }
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const url = request.url;
    const userId = (request as any).user?.id || 'anonymous';
    return `${userId}:${url}`;
  }

  private getTTL(context: ExecutionContext): number | null {
    const handler = context.getHandler();
    const metadata = Reflect.getMetadata('cache:ttl', handler);
    return metadata ? parseInt(metadata, 10) : null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Clear cache by pattern
   */
  clearByPattern(pattern: string | RegExp): number {
    let cleared = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    this.logger.log(`Cleared ${cleared} cache entries matching pattern: ${pattern}`);
    return cleared;
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cleared all ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      })),
    };
  }
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

/**
 * Custom decorator for setting cache TTL
 */
export function CacheTTL(ttl: number) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('cache:ttl', ttl, descriptor.value);
    return descriptor;
  };
}

/**
 * Redis-based cache interceptor for production
 * (Requires Redis client to be injected)
 */
@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RedisCacheInterceptor.name);
  private redisClient: any; // Replace with actual Redis client type

  constructor(redisClient?: any) {
    this.redisClient = redisClient;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (!this.redisClient) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);

    try {
      // Try to get from cache
      const cached = await this.redisClient.get(cacheKey);

      if (cached) {
        this.logger.debug(`Redis Cache HIT for key: ${cacheKey}`);
        response.setHeader('X-Cache', 'HIT');
        return of(JSON.parse(cached));
      }

      this.logger.debug(`Redis Cache MISS for key: ${cacheKey}`);
      response.setHeader('X-Cache', 'MISS');

      const ttl = this.getTTL(context) || 60;

      return next.handle().pipe(
        tap(async data => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            await this.redisClient.setex(cacheKey, ttl, JSON.stringify(data));
            response.setHeader('Cache-Control', `public, max-age=${ttl}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Redis cache error: ${error.message}`);
      return next.handle();
    }
  }

  private generateCacheKey(request: Request): string {
    const url = request.url;
    const userId = (request as any).user?.id || 'anonymous';
    return `api:${userId}:${url}`;
  }

  private getTTL(context: ExecutionContext): number | null {
    const handler = context.getHandler();
    const metadata = Reflect.getMetadata('cache:ttl', handler);
    return metadata ? parseInt(metadata, 10) : null;
  }
}
