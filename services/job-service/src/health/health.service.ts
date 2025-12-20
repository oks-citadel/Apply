import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

import type { DataSource } from 'typeorm';


// Inline health check utilities
const checkDatabaseConnection = async (dataSource: DataSource) => {
  try {
    await dataSource.query('SELECT 1');
    return { status: 'up', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
};

const checkRedisConnection = async (redis: Redis) => {
  try {
    await redis.ping();
    return { status: 'up', message: 'Redis connection successful' };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
};

const createHealthResponse = (serviceName: string, version: string, checks: Record<string, unknown>) => {
  const allUp = Object.values(checks).every((check: { status?: string }) => check.status === 'up');
  return {
    status: allUp ? 'healthy' : 'degraded',
    service: serviceName,
    version,
    timestamp: new Date(),
    checks,
  };
};

/**
 * Health Service for Job Service
 * Handles health check logic and dependency verification
 * Checks Database and Redis/Bull queue connectivity
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redisClient: Redis;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    // Initialize Redis client for health checks
    const redisHost = this.configService.get('redis.host');
    const redisPort = this.configService.get('redis.port');
    const redisPassword = this.configService.get('redis.password');
    const redisTls = this.configService.get('REDIS_TLS') === 'true';

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      db: this.configService.get('redis.db', 0),
      tls: redisTls ? {} : undefined,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {return null;}
        return Math.min(times * 200, 1000);
      },
    });

    // Connect to Redis
    this.redisClient.connect().catch((err) => {
      this.logger.error('Failed to connect to Redis for health checks', err);
    });

    this.logger.log('HealthService initialized with Redis queue health checks');
  }

  /**
   * Basic health check - no external dependencies
   */
  async getBasicHealth() {
    return {
      status: 'ok',
      service: 'job-service',
      version: '1.0.0',
      timestamp: new Date(),
    };
  }

  /**
   * Liveness check - service is running
   */
  async getLiveness() {
    return {
      status: 'ok',
      service: 'job-service',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(
          (process.memoryUsage().heapUsed / 1024 / 1024) * 100,
        ) / 100,
        heapTotal: Math.round(
          (process.memoryUsage().heapTotal / 1024 / 1024) * 100,
        ) / 100,
        rss: Math.round(
          (process.memoryUsage().rss / 1024 / 1024) * 100,
        ) / 100,
      },
    };
  }

  /**
   * Readiness check - verify all critical dependencies
   * Checks Database and Redis/Bull queue connectivity
   */
  async getReadiness() {
    const checks: Record<string, { status: string; message?: string }> = {
      database: await checkDatabaseConnection(this.dataSource),
    };

    // Check Redis connection (used by Bull queues)
    if (this.redisClient) {
      checks.redis = await checkRedisConnection(this.redisClient);
      checks.queue = checks.redis.status === 'up'
        ? { status: 'up', message: 'Bull queue ready' }
        : { status: 'down', message: 'Bull queue unavailable (Redis down)' };
    }

    const response = createHealthResponse('job-service', '1.0.0', checks);

    // If any check fails, return 503 status
    if (response.status === 'degraded') {
      return {
        ...response,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      };
    }

    return response;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
