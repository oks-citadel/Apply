/**
 * Environment types supported by ApplyForUs
 */
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase() || 'development';

  switch (env) {
    case 'production':
    case 'prod':
      return Environment.Production;
    case 'staging':
    case 'stage':
      return Environment.Staging;
    case 'test':
    case 'testing':
      return Environment.Test;
    default:
      return Environment.Development;
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === Environment.Production;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === Environment.Development;
}

/**
 * Check if running in staging
 */
export function isStaging(): boolean {
  return getEnvironment() === Environment.Staging;
}
