export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8006', 10),

  // API Configuration
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8006',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: process.env.CORS_ORIGINS || '*',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'applyforus_analytics',
    // NEVER use synchronize in production - it can modify schema unexpectedly
    // Always use migrations instead
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true' || false,
  },

  // Analytics Configuration
  analytics: {
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
    aggregationInterval: parseInt(process.env.ANALYTICS_AGGREGATION_INTERVAL || '3600000', 10), // 1 hour
    enableRealTime: process.env.ANALYTICS_ENABLE_REALTIME === 'true' || true,
    maxEventsPerBatch: parseInt(process.env.ANALYTICS_MAX_EVENTS_BATCH || '1000', 10),
  },

  // Export Configuration
  export: {
    maxRecords: parseInt(process.env.EXPORT_MAX_RECORDS || '50000', 10),
    formats: (process.env.EXPORT_FORMATS || 'csv,json').split(','),
    chunkSize: parseInt(process.env.EXPORT_CHUNK_SIZE || '5000', 10),
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 1 minute
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
    max: parseInt(process.env.CACHE_MAX || '1000', 10),
  },
});
