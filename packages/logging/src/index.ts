// Core logger
export { Logger, LogLevel, LoggerOptions, LogMetadata } from './logger';

// Context management
export {
  LoggerContext,
  LoggingContext,
  correlationIdMiddleware,
  setupLoggingContext,
} from './context';

// Configuration
export {
  LoggingConfig,
  createLoggingConfig,
  getLogLevelFromEnvironment,
  isProductionEnvironment,
  getLogLevelPriority,
  shouldLog,
  LOG_LEVEL_DESCRIPTIONS,
  EnvironmentConfig,
  getEnvironmentSpecificConfig,
  LoggingConfigValidator,
} from './config';

// Formats
export {
  StructuredLogEntry,
  createStructuredFormat,
  filterSensitiveData,
  isSensitiveField,
  createRequestLogFormat,
  formatDuration,
  formatBytes,
  RequestLogMetadata,
  formatRequestLog,
  ErrorLogMetadata,
  formatErrorLog,
} from './formats';

// Middleware
export {
  RequestLoggingOptions,
  requestLoggingMiddleware,
  correlationMiddleware,
  responseTimeMiddleware,
  errorLoggingMiddleware,
  SanitizationOptions,
  sanitizeLogData,
  createUserContextMiddleware,
  PerformanceMarker,
  PerformanceTracker,
} from './middleware';

// NestJS integration
export {
  LoggingModule,
  LoggingModuleOptions,
  LoggingInterceptor,
  LoggingExceptionFilter,
  LOGGER_OPTIONS,
  LOGGER_INSTANCE,
} from './nestjs.module';
