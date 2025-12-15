import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

export interface RedisHealthIndicatorOptions {
  timeout?: number;
  failOpen?: boolean;
}

/**
 * Redis Health Indicator
 * Checks Redis connectivity with fail-open support
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  /**
   * Check if Redis is healthy
   * @param key The key under which the health check result should be stored
   * @param redis Redis client instance
   * @param options Optional configuration
   */
  async isHealthy(
    key: string,
    redis: Redis | null,
    options?: RedisHealthIndicatorOptions,
  ): Promise<HealthIndicatorResult> {
    const { timeout = 2000, failOpen = true } = options || {};

    if (!redis) {
      const message = 'Redis client not initialized';

      if (failOpen) {
        this.logger.warn(`${message}, returning healthy (fail-open mode)`);
        return this.getStatus(key, true, {
          message: `${message} (fail-open)`,
          mode: 'fail-open',
        });
      }

      throw new HealthCheckError(message, this.getStatus(key, false, { message }));
    }

    const startTime = Date.now();

    try {
      // Check if Redis is connected
      if (redis.status !== 'ready' && redis.status !== 'connect') {
        const message = `Redis not ready (status: ${redis.status})`;

        if (failOpen) {
          this.logger.warn(`${message}, returning healthy (fail-open mode)`);
          return this.getStatus(key, true, {
            message: `${message} (fail-open)`,
            status: redis.status,
            mode: 'fail-open',
          });
        }

        throw new HealthCheckError(message, this.getStatus(key, false, {
          message,
          status: redis.status,
        }));
      }

      // Ping Redis with timeout
      const pingPromise = redis.ping();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ping timeout')), timeout),
      );

      await Promise.race([pingPromise, timeoutPromise]);

      const responseTime = Date.now() - startTime;

      this.logger.debug(`Redis ping successful (${responseTime}ms)`);

      return this.getStatus(key, true, {
        responseTime: `${responseTime}ms`,
        status: redis.status,
        mode: failOpen ? 'fail-open' : 'fail-closed',
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (failOpen) {
        this.logger.warn(
          `Redis health check failed (${responseTime}ms): ${message}, returning healthy (fail-open mode)`,
        );
        return this.getStatus(key, true, {
          message: `${message} (fail-open)`,
          responseTime: `${responseTime}ms`,
          mode: 'fail-open',
        });
      }

      this.logger.error(`Redis health check failed (${responseTime}ms): ${message}`);
      throw new HealthCheckError(
        message,
        this.getStatus(key, false, {
          message,
          responseTime: `${responseTime}ms`,
        }),
      );
    }
  }

  /**
   * Get detailed Redis info
   */
  async getRedisInfo(
    key: string,
    redis: Redis | null,
  ): Promise<HealthIndicatorResult> {
    if (!redis) {
      return this.getStatus(key, false, { message: 'Redis client not initialized' });
    }

    try {
      const info = await redis.info('server');
      const lines = info.split('\r\n');
      const serverInfo: Record<string, string> = {};

      lines.forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            serverInfo[key] = value;
          }
        }
      });

      return this.getStatus(key, true, {
        version: serverInfo['redis_version'],
        mode: serverInfo['redis_mode'],
        uptime: serverInfo['uptime_in_seconds'],
        connectedClients: serverInfo['connected_clients'],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get Redis info';
      this.logger.error(`Failed to get Redis info: ${message}`);
      return this.getStatus(key, false, { message });
    }
  }

  /**
   * Check Redis memory usage
   */
  async checkMemory(
    key: string,
    redis: Redis | null,
    maxMemoryPercent: number = 90,
  ): Promise<HealthIndicatorResult> {
    if (!redis) {
      return this.getStatus(key, false, { message: 'Redis client not initialized' });
    }

    try {
      const info = await redis.info('memory');
      const lines = info.split('\r\n');
      const memoryInfo: Record<string, string> = {};

      lines.forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            memoryInfo[key] = value;
          }
        }
      });

      const usedMemory = parseInt(memoryInfo['used_memory'] || '0');
      const maxMemory = parseInt(memoryInfo['maxmemory'] || '0');

      let memoryPercent = 0;
      if (maxMemory > 0) {
        memoryPercent = (usedMemory / maxMemory) * 100;
      }

      const isHealthy = maxMemory === 0 || memoryPercent < maxMemoryPercent;

      return this.getStatus(key, isHealthy, {
        usedMemory: `${(usedMemory / 1024 / 1024).toFixed(2)} MB`,
        maxMemory: maxMemory > 0 ? `${(maxMemory / 1024 / 1024).toFixed(2)} MB` : 'unlimited',
        memoryPercent: `${memoryPercent.toFixed(2)}%`,
        memoryFragmentation: memoryInfo['mem_fragmentation_ratio'],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check Redis memory';
      this.logger.error(`Failed to check Redis memory: ${message}`);
      return this.getStatus(key, false, { message });
    }
  }
}
