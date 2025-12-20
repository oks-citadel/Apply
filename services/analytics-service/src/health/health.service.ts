import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Inline health check utilities
async function checkDatabaseConnection(
  dataSource: DataSource,
): Promise<{ status: string; message?: string }> {
  try {
    await dataSource.query('SELECT 1');
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function createHealthResponse(
  serviceName: string,
  version: string,
  checks: Record<string, { status: string; message?: string }>,
) {
  const allOk = Object.values(checks).every((check) => check.status === 'ok');
  return {
    status: allOk ? 'ok' : 'degraded',
    service: serviceName,
    version,
    timestamp: new Date().toISOString(),
    checks,
  };
}

/**
 * Health Service for Analytics Service
 * Handles health check logic and dependency verification
 */
@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Basic health check - no external dependencies
   */
  async getBasicHealth() {
    return {
      status: 'ok',
      service: 'analytics-service',
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
      service: 'analytics-service',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      },
    };
  }

  /**
   * Readiness check - verify database connectivity
   */
  async getReadiness() {
    const checks = {
      database: await checkDatabaseConnection(this.dataSource),
    };

    const response = createHealthResponse('analytics-service', '1.0.0', checks);

    // If any check fails, return 503 status
    if (response.status === 'degraded') {
      return {
        ...response,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      };
    }

    return response;
  }
}
