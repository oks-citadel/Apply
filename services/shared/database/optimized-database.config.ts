import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Optimized TypeORM database configuration with connection pooling
 * and performance optimizations
 */
export const getOptimizedDatabaseConfig = (
  configService: ConfigService,
  serviceName: string,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', `${serviceName}_db`),

    // Connection Pool Configuration (Critical for Performance)
    extra: {
      // Maximum number of clients in the pool
      max: configService.get<number>('DB_POOL_MAX', isProduction ? 20 : 10),

      // Minimum number of clients in the pool
      min: configService.get<number>('DB_POOL_MIN', isProduction ? 5 : 2),

      // Maximum time (ms) a client can be idle before being removed
      idleTimeoutMillis: configService.get<number>('DB_POOL_IDLE_TIMEOUT', 30000),

      // Maximum time (ms) to wait for a connection from the pool
      connectionTimeoutMillis: configService.get<number>('DB_POOL_CONNECTION_TIMEOUT', 2000),

      // Maximum time (ms) for a query to execute before timing out
      statement_timeout: configService.get<number>('DB_STATEMENT_TIMEOUT', 30000),

      // Enable query result caching at database level
      query_timeout: configService.get<number>('DB_QUERY_TIMEOUT', 30000),

      // Application name for monitoring
      application_name: `${serviceName}_${process.env.NODE_ENV || 'development'}`,
    },

    // Entity and migration paths
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],

    // Synchronization (NEVER use in production)
    synchronize: false,

    // Migration settings
    migrationsRun: isProduction,
    migrationsTableName: 'migrations',

    // Logging configuration
    logging: isProduction ? ['error', 'warn'] : ['query', 'error', 'warn', 'schema'],
    logger: isProduction ? 'advanced-console' : 'advanced-console',
    maxQueryExecutionTime: isProduction ? 1000 : 5000, // Log slow queries

    // Performance optimizations
    cache: {
      type: 'database',
      duration: configService.get<number>('DB_CACHE_DURATION', 60000), // 1 minute
      tableName: 'query_result_cache',
      options: {
        max: configService.get<number>('DB_CACHE_MAX_ITEMS', 1000),
      },
    },

    // Timezone
    timezone: 'Z', // UTC

    // Retry logic for connection failures
    retryAttempts: configService.get<number>('DB_RETRY_ATTEMPTS', 3),
    retryDelay: configService.get<number>('DB_RETRY_DELAY', 3000),

    // Auto-load entities
    autoLoadEntities: true,

    // Keep connection alive
    keepConnectionAlive: true,

    // Enable detailed errors in development
    dropSchema: false,

    // SSL configuration for production
    ssl: isProduction
      ? {
          rejectUnauthorized: configService.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED', true),
        }
      : false,
  };
};

/**
 * Read replica configuration for read-heavy operations
 */
export const getReadReplicaConfig = (
  configService: ConfigService,
  serviceName: string,
): TypeOrmModuleOptions => {
  const baseConfig = getOptimizedDatabaseConfig(configService, serviceName);

  return {
    ...baseConfig,
    host: configService.get('DB_READ_REPLICA_HOST', baseConfig.host),
    port: configService.get<number>('DB_READ_REPLICA_PORT', baseConfig.port as number),
    // Read replicas can have larger pool since they only handle reads
    extra: {
      ...baseConfig.extra,
      max: configService.get<number>('DB_READ_REPLICA_POOL_MAX', 30),
    },
  };
};

/**
 * Connection pool monitoring helper
 */
export class ConnectionPoolMonitor {
  private static instance: ConnectionPoolMonitor;
  private metrics: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
  } = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
  };

  static getInstance(): ConnectionPoolMonitor {
    if (!ConnectionPoolMonitor.instance) {
      ConnectionPoolMonitor.instance = new ConnectionPoolMonitor();
    }
    return ConnectionPoolMonitor.instance;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  updateMetrics(metrics: Partial<typeof this.metrics>) {
    this.metrics = { ...this.metrics, ...metrics };
  }
}
