import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Inline health check utilities (replaces @applyforus/utils)
async function checkDatabaseConnection(dataSource: DataSource): Promise<{ status: string; message?: string }> {
  try {
    await dataSource.query('SELECT 1');
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function createHealthResponse(serviceName: string, version: string, checks: Record<string, { status: string; message?: string }>) {
  const allOk = Object.values(checks).every(check => check.status === 'ok');
  return {
    status: allOk ? 'ok' : 'degraded',
    service: serviceName,
    version,
    timestamp: new Date().toISOString(),
    checks,
  };
}

/**
 * Health Service for Auth Service
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
      service: 'auth-service',
      version: '1.0.0',
      timestamp: new Date(),
    };
  }

  /**
   * Liveness check - service is running
   */
  async getLiveness() {
    const memUsage = process.memoryUsage();
    const memoryMetrics = {
      heapUsedMB: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
      externalMB: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
      heapUsedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    return {
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      memory: memoryMetrics,
      pid: process.pid,
      nodeVersion: process.version,
    };
  }

  /**
   * Readiness check - verify database connectivity and system resources
   */
  async getReadiness() {
    const checks: Record<string, any> = {
      database: await checkDatabaseConnection(this.dataSource),
    };

    // Add database connection pool stats if available
    if (this.dataSource.isInitialized) {
      try {
        const poolStats = await this.dataSource.query(
          "SELECT count(*) as active_connections FROM pg_stat_activity WHERE datname = current_database() AND state = 'active'"
        );
        checks.database.activeConnections = parseInt(poolStats[0]?.active_connections || '0', 10);
      } catch (error) {
        // Ignore query errors
      }
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    checks.memory = {
      status: heapUsedPercent > 90 ? 'warning' : 'ok',
      heapUsedPercent: Math.round(heapUsedPercent),
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    };

    const response = createHealthResponse('auth-service', '1.0.0', checks);

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
