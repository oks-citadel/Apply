import { LogLevel } from './logger';

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableAppInsights: boolean;
  appInsightsKey?: string;
  serviceName: string;
  environment: string;
  version: string;
}

export function getLogLevelFromEnvironment(env?: string): LogLevel {
  const environment = env || process.env.NODE_ENV || 'development';

  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      return LogLevel.INFO;
    case 'staging':
    case 'stage':
      return LogLevel.INFO;
    case 'test':
    case 'testing':
      return LogLevel.WARN;
    case 'development':
    case 'dev':
    case 'local':
    default:
      return LogLevel.DEBUG;
  }
}

export function createLoggingConfig(overrides?: Partial<LoggingConfig>): LoggingConfig {
  const environment = process.env.NODE_ENV || 'development';
  const serviceName = process.env.SERVICE_NAME || 'unknown-service';
  const version = process.env.SERVICE_VERSION || '1.0.0';
  const appInsightsKey = process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY;

  const defaultConfig: LoggingConfig = {
    level: getLogLevelFromEnvironment(environment),
    enableConsole: true,
    enableAppInsights: !!appInsightsKey,
    appInsightsKey,
    serviceName,
    environment,
    version,
  };

  return {
    ...defaultConfig,
    ...overrides,
  };
}

export function isProductionEnvironment(env?: string): boolean {
  const environment = env || process.env.NODE_ENV || 'development';
  return ['production', 'prod', 'staging', 'stage'].includes(
    environment.toLowerCase(),
  );
}

export function getLogLevelPriority(level: LogLevel): number {
  const priorities: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
    [LogLevel.TRACE]: 4,
  };

  return priorities[level] ?? 2;
}

export function shouldLog(
  messageLevel: LogLevel,
  configuredLevel: LogLevel,
): boolean {
  return (
    getLogLevelPriority(messageLevel) <= getLogLevelPriority(configuredLevel)
  );
}

export const LOG_LEVEL_DESCRIPTIONS: Record<LogLevel, string> = {
  [LogLevel.ERROR]:
    'Critical errors that require immediate attention. Service may be degraded or unavailable.',
  [LogLevel.WARN]:
    'Warning conditions that should be addressed but do not prevent normal operation.',
  [LogLevel.INFO]:
    'Informational messages about normal application operation and significant events.',
  [LogLevel.DEBUG]:
    'Detailed debugging information useful during development and troubleshooting.',
  [LogLevel.TRACE]:
    'Very detailed trace information, typically only enabled for diagnosing specific issues.',
};

export interface EnvironmentConfig {
  production: LoggingConfig;
  staging: LoggingConfig;
  development: LoggingConfig;
  test: LoggingConfig;
}

export function getEnvironmentSpecificConfig(
  serviceName: string,
  version: string,
): EnvironmentConfig {
  const baseConfig = {
    serviceName,
    version,
  };

  return {
    production: {
      ...baseConfig,
      level: LogLevel.INFO,
      enableConsole: true,
      enableAppInsights: true,
      appInsightsKey: process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
      environment: 'production',
    },
    staging: {
      ...baseConfig,
      level: LogLevel.INFO,
      enableConsole: true,
      enableAppInsights: true,
      appInsightsKey: process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
      environment: 'staging',
    },
    development: {
      ...baseConfig,
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableAppInsights: false,
      environment: 'development',
    },
    test: {
      ...baseConfig,
      level: LogLevel.WARN,
      enableConsole: false,
      enableAppInsights: false,
      environment: 'test',
    },
  };
}

export class LoggingConfigValidator {
  static validate(config: LoggingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.serviceName || config.serviceName.trim() === '') {
      errors.push('serviceName is required and cannot be empty');
    }

    if (!config.environment || config.environment.trim() === '') {
      errors.push('environment is required and cannot be empty');
    }

    if (!config.version || config.version.trim() === '') {
      errors.push('version is required and cannot be empty');
    }

    if (config.enableAppInsights && !config.appInsightsKey) {
      errors.push(
        'appInsightsKey is required when enableAppInsights is true',
      );
    }

    if (!Object.values(LogLevel).includes(config.level)) {
      errors.push(`Invalid log level: ${config.level}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateOrThrow(config: LoggingConfig): void {
    const { valid, errors } = this.validate(config);

    if (!valid) {
      throw new Error(
        `Invalid logging configuration:\n${errors.join('\n')}`,
      );
    }
  }
}
