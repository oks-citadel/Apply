// ApplyForUs Configuration Utilities
// Centralized configuration management for the ApplyForUs platform

export { ConfigService, type ConfigOptions } from './config.service';
export { validateEnv, type EnvSchema } from './env.validator';
export {
  getServiceConfig,
  getDatabaseConfig,
  getRedisConfig,
  getJwtConfig,
  getApiConfig,
  type ServiceConfig,
  type DatabaseConfig,
  type RedisConfig,
  type JwtConfig,
  type ApiConfig,
} from './service.config';
export { Environment, getEnvironment, isProduction, isDevelopment, isStaging } from './environment';
