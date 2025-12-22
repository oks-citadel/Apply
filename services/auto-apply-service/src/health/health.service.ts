import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';

// Inline health check utilities
async function checkDatabaseConnection(dataSource: DataSource): Promise<{ status: string; message?: string }> {
  try {
    await dataSource.query('SELECT 1');
    return { status: 'up', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'down', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkRedisConnection(redis: Redis): Promise<{ status: string; message?: string }> {
  try {
    await redis.ping();
    return { status: 'up', message: 'Redis connection successful' };
  } catch (error) {
    return { status: 'down', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function createHealthResponse(serviceName: string, version: string, checks: Record<string, { status: string; message?: string }>) {
  const allUp = Object.values(checks).every(check => check.status === 'up');
  return {
    status: allUp ? 'healthy' : 'degraded',
    service: serviceName,
    version,
    timestamp: new Date().toISOString(),
    checks,
  };
}

/**
 * Health Service for Auto Apply Service
 * Handles health check logic and dependency verification
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
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
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
  }

  /**
   * Basic health check - no external dependencies
   */
  async getBasicHealth() {
    return {
      status: 'ok',
      service: 'auto-apply-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness check - service is running
   */
  async getLiveness() {
    return {
      status: 'ok',
      service: 'auto-apply-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      },
    };
  }

  /**
   * Readiness check - verify all critical dependencies
   */
  async getReadiness() {
    const checks: Record<string, { status: string; message?: string }> = {
      database: await checkDatabaseConnection(this.dataSource),
      redis: await checkRedisConnection(this.redisClient),
    };

    const response = createHealthResponse('auto-apply-service', '1.0.0', checks);

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
