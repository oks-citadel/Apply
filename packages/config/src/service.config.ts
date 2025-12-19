import { getEnvironment, Environment, isProduction } from './environment';

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string;
  port: number;
  host: string;
  environment: Environment;
  logLevel: string;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  synchronize: boolean;
  logging: boolean;
}

/**
 * Redis configuration interface
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  tls: boolean;
}

/**
 * JWT configuration interface
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

/**
 * API configuration interface
 */
export interface ApiConfig {
  prefix: string;
  version: string;
  corsOrigins: string[];
  rateLimit: {
    ttl: number;
    limit: number;
  };
}

/**
 * Get service configuration from environment
 */
export function getServiceConfig(serviceName: string): ServiceConfig {
  return {
    name: serviceName,
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    environment: getEnvironment(),
    logLevel: process.env.LOG_LEVEL || (isProduction() ? 'info' : 'debug'),
  };
}

/**
 * Get database configuration from environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || process.env.DB_NAME || 'applyforus',
    username: process.env.DATABASE_USER || process.env.DB_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '',
    ssl: process.env.DATABASE_SSL === 'true' || isProduction(),
    synchronize: process.env.DATABASE_SYNC === 'true' && !isProduction(),
    logging: process.env.DATABASE_LOGGING === 'true' || !isProduction(),
  };
}

/**
 * Get Redis configuration from environment
 */
export function getRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' || isProduction(),
  };
}

/**
 * Get JWT configuration from environment
 */
export function getJwtConfig(): JwtConfig {
  const secret = process.env.JWT_SECRET;
  if (!secret && isProduction()) {
    throw new Error('JWT_SECRET is required in production');
  }

  return {
    secret: secret || 'development-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

/**
 * Get API configuration from environment
 */
export function getApiConfig(): ApiConfig {
  const corsOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';

  return {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1',
    corsOrigins: corsOrigins.split(',').map(origin => origin.trim()).filter(Boolean),
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
  };
}
