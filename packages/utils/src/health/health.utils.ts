/**
 * Health Check Utilities
 * Shared utilities for service health checks across the platform
 */

import { DataSource } from 'typeorm';

/**
 * Health check status response
 */
export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
  details?: Record<string, any>;
  responseTime?: number;
}

/**
 * Check database connection health
 * @param dataSource TypeORM DataSource instance
 * @returns Health check result
 */
export async function checkDatabaseConnection(
  dataSource: DataSource,
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!dataSource || !dataSource.isInitialized) {
      return {
        healthy: false,
        message: 'Database not initialized',
        responseTime: Date.now() - startTime,
      };
    }

    // Execute a simple query to verify connection
    await dataSource.query('SELECT 1');

    const responseTime = Date.now() - startTime;

    return {
      healthy: true,
      message: 'Database connection healthy',
      responseTime,
      details: {
        database: dataSource.options.database,
        type: dataSource.options.type,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      healthy: false,
      message: `Database connection failed: ${error.message}`,
      responseTime,
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Check Redis connection health
 * @param redisClient Redis client instance (ioredis)
 * @returns Health check result
 */
export async function checkRedisConnection(
  redisClient: any,
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!redisClient) {
      return {
        healthy: false,
        message: 'Redis client not initialized',
        responseTime: Date.now() - startTime,
      };
    }

    // Check if Redis client is connected
    const status = redisClient.status;

    if (status !== 'ready' && status !== 'connected') {
      return {
        healthy: false,
        message: `Redis connection not ready. Status: ${status}`,
        responseTime: Date.now() - startTime,
        details: { status },
      };
    }

    // Ping Redis to verify connection
    const pingResult = await redisClient.ping();

    const responseTime = Date.now() - startTime;

    if (pingResult === 'PONG') {
      return {
        healthy: true,
        message: 'Redis connection healthy',
        responseTime,
        details: {
          status,
          response: pingResult,
        },
      };
    } else {
      return {
        healthy: false,
        message: 'Redis ping failed',
        responseTime,
        details: {
          status,
          response: pingResult,
        },
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      healthy: false,
      message: `Redis connection failed: ${error.message}`,
      responseTime,
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Check Elasticsearch connection health
 * @param esClient Elasticsearch client instance
 * @returns Health check result
 */
export async function checkElasticsearchConnection(
  esClient: any,
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!esClient) {
      return {
        healthy: false,
        message: 'Elasticsearch client not initialized',
        responseTime: Date.now() - startTime,
      };
    }

    // Ping Elasticsearch cluster
    const pingResult = await esClient.ping();

    const responseTime = Date.now() - startTime;

    if (pingResult) {
      // Get cluster health
      let clusterHealth;
      try {
        clusterHealth = await esClient.cluster.health();
      } catch (error) {
        // If cluster health fails, still consider it partially healthy if ping worked
        return {
          healthy: true,
          message: 'Elasticsearch reachable but cluster health unavailable',
          responseTime,
          details: {
            ping: true,
            clusterHealthError: error.message,
          },
        };
      }

      return {
        healthy: clusterHealth.status !== 'red',
        message: `Elasticsearch connection healthy. Cluster status: ${clusterHealth.status}`,
        responseTime,
        details: {
          clusterName: clusterHealth.cluster_name,
          status: clusterHealth.status,
          numberOfNodes: clusterHealth.number_of_nodes,
          activeShards: clusterHealth.active_shards,
        },
      };
    } else {
      return {
        healthy: false,
        message: 'Elasticsearch ping failed',
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      healthy: false,
      message: `Elasticsearch connection failed: ${error.message}`,
      responseTime,
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Create a standardized health response
 */
export function createHealthResponse(
  service: string,
  version: string = '1.0.0',
  additionalChecks?: Record<string, HealthCheckResult>,
) {
  const timestamp = new Date();
  const allHealthy = additionalChecks
    ? Object.values(additionalChecks).every((check) => check.healthy)
    : true;

  return {
    status: allHealthy ? 'ok' : 'degraded',
    service,
    version,
    timestamp,
    uptime: process.uptime(),
    checks: additionalChecks || {},
  };
}
