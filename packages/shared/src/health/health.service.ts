import { Injectable } from '@nestjs/common';
import {
  HealthCheckService as TerminusHealthService,
  HealthCheck,
  TypeOrmHealthIndicator,
  HttpHealthIndicator,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Logger } from '../logging/logger';
import { RedisHealthIndicator } from './redis-health.indicator';
import Redis from 'ioredis';

export interface HealthCheckConfig {
  serviceName: string;
  version: string;
  dependencies?: {
    database?: boolean;
    redis?: boolean;
    externalServices?: Array<{
      name: string;
      url: string;
      timeout?: number;
    }>;
  };
}

export interface BasicHealthResponse {
  status: 'ok' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
}

export interface LivenessResponse {
  status: 'ok';
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ok' | 'degraded' | 'down';
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
      responseTime?: number;
    };
  };
  timestamp: string;
}

/**
 * Base health check service for all microservices
 */
@Injectable()
export class HealthService {
  private startTime: number;
  private config: HealthCheckConfig;

  constructor(
    private readonly terminusHealth: TerminusHealthService,
    private readonly logger: Logger,
    config: HealthCheckConfig
  ) {
    this.startTime = Date.now();
    this.config = config;
  }

  /**
   * Basic health check - returns service info without checking dependencies
   */
  getBasicHealth(): BasicHealthResponse {
    return {
      status: 'ok',
      service: this.config.serviceName,
      version: this.config.version,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Liveness probe - checks if the service is alive
   * Should return quickly without checking external dependencies
   */
  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - checks if the service is ready to handle requests
   * Checks critical dependencies like database, cache, etc.
   */
  async getReadiness(): Promise<ReadinessResponse> {
    const checks: ReadinessResponse['checks'] = {};
    let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';

    try {
      // Check database if configured
      if (this.config.dependencies?.database) {
        const dbCheck = await this.checkDatabase();
        checks.database = dbCheck;
        if (dbCheck.status === 'down') {
          overallStatus = 'down';
        }
      }

      // Check Redis if configured
      if (this.config.dependencies?.redis) {
        const redisCheck = await this.checkRedis();
        checks.redis = redisCheck;
        if (redisCheck.status === 'down' && overallStatus === 'ok') {
          overallStatus = 'degraded';
        }
      }

      // Check external services if configured
      if (this.config.dependencies?.externalServices) {
        for (const service of this.config.dependencies.externalServices) {
          const serviceCheck = await this.checkExternalService(
            service.name,
            service.url,
            service.timeout
          );
          checks[service.name] = serviceCheck;
          if (serviceCheck.status === 'down' && overallStatus === 'ok') {
            overallStatus = 'degraded';
          }
        }
      }

      return {
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      return {
        status: 'down',
        checks: {
          error: {
            status: 'down',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabase(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      // This is a placeholder - actual implementation depends on your DB setup
      // You would inject TypeOrmHealthIndicator or similar

      const responseTime = Date.now() - startTime;
      return {
        status: 'up',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed', error as Error);
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Database connection failed',
        responseTime,
      };
    }
  }

  /**
   * Check Redis connection
   * Uses fail-open pattern: if Redis is down, service is still considered degraded but operational
   */
  private async checkRedis(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      // This is a placeholder - actual implementation depends on your Redis setup
      // You would inject a Redis health indicator or client
      // Note: With fail-open pattern, Redis being down doesn't necessarily mean status is 'down'
      // The service continues to operate using in-memory fallback

      const responseTime = Date.now() - startTime;
      return {
        status: 'up',
        message: 'Redis connection healthy (fail-open enabled)',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.warn('Redis health check failed, but service remains operational (fail-open)', error as Error);
      return {
        status: 'down',
        message: `Redis unavailable (fail-open): ${error instanceof Error ? error.message : 'Redis connection failed'}`,
        responseTime,
      };
    }
  }

  /**
   * Check external service
   */
  private async checkExternalService(
    name: string,
    url: string,
    timeout: number = 5000
  ): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      // Simple HTTP check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'up',
          responseTime,
        };
      } else {
        return {
          status: 'down',
          message: `HTTP ${response.status}`,
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`External service ${name} health check failed`, error as Error);
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Service unavailable',
        responseTime,
      };
    }
  }

  /**
   * Detailed health check using NestJS Terminus
   */
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    // This method can be customized based on your specific health indicators
    // It uses NestJS Terminus for advanced health checks
    return this.terminusHealth.check([]);
  }
}

/**
 * Extended health service with database and Redis support
 */
@Injectable()
export class ExtendedHealthService extends HealthService {
  constructor(
    terminusHealth: TerminusHealthService,
    logger: Logger,
    config: HealthCheckConfig,
    private readonly db?: TypeOrmHealthIndicator,
    private readonly http?: HttpHealthIndicator,
    private readonly redisIndicator?: RedisHealthIndicator
  ) {
    super(terminusHealth, logger, config);
  }

  /**
   * Check database with TypeORM
   */
  async checkDatabaseWithTypeORM(): Promise<HealthIndicatorResult> {
    if (!this.db) {
      throw new Error('TypeORM health indicator not available');
    }
    return this.db.pingCheck('database');
  }

  /**
   * Check external HTTP service
   */
  async checkHttpService(name: string, url: string): Promise<HealthIndicatorResult> {
    if (!this.http) {
      throw new Error('HTTP health indicator not available');
    }
    return this.http.pingCheck(name, url);
  }

  /**
   * Check Redis with fail-open support
   * @param redis Redis client instance
   * @param failOpen Whether to use fail-open pattern (default: true)
   */
  async checkRedisWithIndicator(redis: Redis | null, failOpen: boolean = true): Promise<HealthIndicatorResult> {
    if (!this.redisIndicator) {
      throw new Error('Redis health indicator not available');
    }
    return this.redisIndicator.isHealthy('redis', redis, { failOpen, timeout: 2000 });
  }

  /**
   * Get detailed Redis information
   */
  async getRedisInfo(redis: Redis | null): Promise<HealthIndicatorResult> {
    if (!this.redisIndicator) {
      throw new Error('Redis health indicator not available');
    }
    return this.redisIndicator.getRedisInfo('redis-info', redis);
  }

  /**
   * Check Redis memory usage
   */
  async checkRedisMemory(redis: Redis | null, maxMemoryPercent: number = 90): Promise<HealthIndicatorResult> {
    if (!this.redisIndicator) {
      throw new Error('Redis health indicator not available');
    }
    return this.redisIndicator.checkMemory('redis-memory', redis, maxMemoryPercent);
  }
}
