import { Injectable, HttpStatus, Inject, Optional } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import Redis from 'ioredis';

// Inline health check utilities (replacing @jobpilot/utils)
const checkDatabaseConnection = async (dataSource: any) => {
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

const checkElasticsearchConnection = async (client: Client) => {
  try {
    await client.ping();
    return { status: 'up', message: 'Elasticsearch connection successful' };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
};

const createHealthResponse = (serviceName: string, version: string, checks: any) => {
  const allUp = Object.values(checks).every((check: any) => check.status === 'up');
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
 * Checks Database, Redis, and Elasticsearch connectivity
 */
@Injectable()
export class HealthService {
  private elasticsearchClient: Client;
  private redisClient: Redis;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    // Initialize Elasticsearch client
    const esNode = this.configService.get('elasticsearch.node');
    const esAuth = this.configService.get('elasticsearch.auth');

    this.elasticsearchClient = new Client({
      node: esNode,
      auth: esAuth?.password ? esAuth : undefined,
      maxRetries: 3,
      requestTimeout: 30000,
    });

    // Initialize Redis client
    const redisHost = this.configService.get('redis.host');
    const redisPort = this.configService.get('redis.port');
    const redisPassword = this.configService.get('redis.password');
    const redisDb = this.configService.get('redis.db');

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      db: redisDb || 0,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    // Connect to Redis
    this.redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis for health checks:', err);
    });
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
   */
  async getReadiness() {
    const checks = {
      database: await checkDatabaseConnection(this.dataSource),
      redis: await checkRedisConnection(this.redisClient),
      elasticsearch: await checkElasticsearchConnection(this.elasticsearchClient),
    };

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
    if (this.elasticsearchClient) {
      await this.elasticsearchClient.close();
    }
  }
}
