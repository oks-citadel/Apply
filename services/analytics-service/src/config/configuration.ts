export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8006,

  // API Configuration
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8006',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: process.env.CORS_ORIGINS || '*',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'jobpilot_analytics',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
    logging: process.env.DB_LOGGING === 'true' || false,
  },

  // Analytics Configuration
  analytics: {
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS, 10) || 90,
    aggregationInterval: parseInt(process.env.ANALYTICS_AGGREGATION_INTERVAL, 10) || 3600000, // 1 hour
    enableRealTime: process.env.ANALYTICS_ENABLE_REALTIME === 'true' || true,
    maxEventsPerBatch: parseInt(process.env.ANALYTICS_MAX_EVENTS_BATCH, 10) || 1000,
  },

  // Export Configuration
  export: {
    maxRecords: parseInt(process.env.EXPORT_MAX_RECORDS, 10) || 50000,
    formats: (process.env.EXPORT_FORMATS || 'csv,json').split(','),
    chunkSize: parseInt(process.env.EXPORT_CHUNK_SIZE, 10) || 5000,
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60000, // 1 minute
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes
    max: parseInt(process.env.CACHE_MAX, 10) || 1000,
  },
});
