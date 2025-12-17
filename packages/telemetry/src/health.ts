/**
 * Health check utilities for NestJS services
 * Provides comprehensive health checks for databases, Redis, external services, etc.
 */

import { Injectable, Controller, Get, HttpStatus, HttpException } from '@nestjs/common';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  componentType: string;
  duration?: number;
  message?: string;
  observedValue?: string | number;
  observedUnit?: string;
}

export interface HealthCheckOptions {
  serviceName: string;
  serviceVersion: string;
  checks?: HealthCheckFunction[];
}

export type HealthCheckFunction = () => Promise<HealthCheck>;

/**
 * Health Check Service
 * Provides health check functionality for NestJS services
 */
@Injectable()
export class HealthCheckService {
  private serviceName: string;
  private serviceVersion: string;
  private startTime: number;
  private customChecks: HealthCheckFunction[] = [];

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'unknown';
    this.serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
    this.startTime = Date.now();
  }

  /**
   * Configure the health check service
   */
  configure(options: HealthCheckOptions): void {
    this.serviceName = options.serviceName;
    this.serviceVersion = options.serviceVersion;
    if (options.checks) {
      this.customChecks = options.checks;
    }
  }

  /**
   * Register a custom health check
   */
  registerCheck(check: HealthCheckFunction): void {
    this.customChecks.push(check);
  }

  /**
   * Get liveness status (is the service running?)
   */
  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get readiness status (is the service ready to accept traffic?)
   */
  async getReadiness(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Run all custom checks
    for (const checkFn of this.customChecks) {
      try {
        const startTime = Date.now();
        const check = await checkFn();
        check.duration = Date.now() - startTime;
        checks.push(check);

        if (check.status === 'fail') {
          overallStatus = 'unhealthy';
        } else if (check.status === 'warn' && overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks.push({
          name: 'unknown',
          status: 'fail',
          componentType: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      version: this.serviceVersion,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  /**
   * Get full health status
   */
  async getHealth(): Promise<HealthCheckResult> {
    return this.getReadiness();
  }
}

/**
 * Create a PostgreSQL health check function
 */
export function createDatabaseCheck(
  name: string,
  getConnection: () => Promise<any>,
): HealthCheckFunction {
  return async (): Promise<HealthCheck> => {
    try {
      const connection = await getConnection();
      const startTime = Date.now();

      // Run a simple query to check connectivity
      await connection.query('SELECT 1');

      return {
        name,
        status: 'pass',
        componentType: 'datastore',
        duration: Date.now() - startTime,
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        componentType: 'datastore',
        message: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  };
}

/**
 * Create a Redis health check function
 */
export function createRedisCheck(
  name: string,
  getRedisClient: () => Promise<any>,
): HealthCheckFunction {
  return async (): Promise<HealthCheck> => {
    try {
      const client = await getRedisClient();
      const startTime = Date.now();

      // Run a PING command
      const result = await client.ping();

      return {
        name,
        status: result === 'PONG' ? 'pass' : 'fail',
        componentType: 'datastore',
        duration: Date.now() - startTime,
        message: result === 'PONG' ? 'Redis connection successful' : 'Unexpected response',
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        componentType: 'datastore',
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  };
}

/**
 * Create an HTTP endpoint health check function
 */
export function createHttpCheck(
  name: string,
  url: string,
  timeout = 5000,
): HealthCheckFunction {
  return async (): Promise<HealthCheck> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;

      if (response.ok) {
        return {
          name,
          status: 'pass',
          componentType: 'http',
          duration,
          observedValue: response.status,
          message: `HTTP ${response.status}`,
        };
      } else {
        return {
          name,
          status: response.status >= 500 ? 'fail' : 'warn',
          componentType: 'http',
          duration,
          observedValue: response.status,
          message: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        name,
        status: 'fail',
        componentType: 'http',
        message: error instanceof Error ? error.message : 'HTTP check failed',
      };
    }
  };
}

/**
 * Create a disk space health check function
 */
export function createDiskSpaceCheck(
  name: string,
  path: string,
  thresholdPercent = 90,
): HealthCheckFunction {
  return async (): Promise<HealthCheck> => {
    try {
      const fs = await import('fs/promises');
      const { statfs } = await import('fs');
      const { promisify } = await import('util');

      const statfsAsync = promisify(statfs);
      const stats = await statfsAsync(path);

      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const usedPercent = ((totalBytes - freeBytes) / totalBytes) * 100;

      return {
        name,
        status: usedPercent < thresholdPercent ? 'pass' : 'warn',
        componentType: 'system',
        observedValue: usedPercent.toFixed(2),
        observedUnit: 'percent',
        message: `Disk usage: ${usedPercent.toFixed(2)}%`,
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        componentType: 'system',
        message: error instanceof Error ? error.message : 'Disk check failed',
      };
    }
  };
}

/**
 * Create a memory health check function
 */
export function createMemoryCheck(
  name: string,
  thresholdPercent = 90,
): HealthCheckFunction {
  return async (): Promise<HealthCheck> => {
    const used = process.memoryUsage();
    const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;

    return {
      name,
      status: heapUsedPercent < thresholdPercent ? 'pass' : 'warn',
      componentType: 'system',
      observedValue: heapUsedPercent.toFixed(2),
      observedUnit: 'percent',
      message: `Heap usage: ${heapUsedPercent.toFixed(2)}% (${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB)`,
    };
  };
}

/**
 * Health Controller for NestJS
 * Provides /health/live, /health/ready, and /health endpoints
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthCheckService) {}

  /**
   * Liveness probe endpoint
   * Used by Kubernetes to check if the container is alive
   */
  @Get('live')
  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return this.healthService.getLiveness();
  }

  /**
   * Readiness probe endpoint
   * Used by Kubernetes to check if the container is ready to receive traffic
   */
  @Get('ready')
  async getReadiness(): Promise<HealthCheckResult> {
    const result = await this.healthService.getReadiness();

    if (result.status === 'unhealthy') {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }

  /**
   * Full health check endpoint
   * Returns detailed health information
   */
  @Get()
  async getHealth(): Promise<HealthCheckResult> {
    return this.healthService.getHealth();
  }
}

/**
 * Create a custom health check for any async operation
 */
export function createCustomCheck(
  name: string,
  componentType: string,
  checkFn: () => Promise<boolean | { ok: boolean; message?: string }>,
): HealthCheckFunction {
  return async (): Promise<HealthCheck> => {
    try {
      const startTime = Date.now();
      const result = await checkFn();
      const duration = Date.now() - startTime;

      if (typeof result === 'boolean') {
        return {
          name,
          status: result ? 'pass' : 'fail',
          componentType,
          duration,
        };
      }

      return {
        name,
        status: result.ok ? 'pass' : 'fail',
        componentType,
        duration,
        message: result.message,
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        componentType,
        message: error instanceof Error ? error.message : 'Check failed',
      };
    }
  };
}
