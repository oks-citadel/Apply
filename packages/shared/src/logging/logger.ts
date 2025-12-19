import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export interface LogMetadata {
  [key: string]: any;
}

export interface LoggerConfig {
  serviceName: string;
  environment: string;
  version?: string;
  logLevel?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  logFilePath?: string;
  usePino?: boolean;
}

export interface LogContext {
  correlationId: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operationId?: string;
  [key: string]: any;
}

/**
 * Centralized Logger with correlation ID support
 * Supports both Winston and Pino for structured logging
 */
export class Logger {
  private winstonLogger?: WinstonLogger;
  private pinoLogger?: pino.Logger;
  private config: LoggerConfig;
  private context: Map<string, LogContext> = new Map();

  constructor(config: LoggerConfig) {
    this.config = config;

    if (config.usePino) {
      this.initializePino();
    } else {
      this.initializeWinston();
    }
  }

  /**
   * Initialize Winston logger with structured JSON formatting
   */
  private initializeWinston(): void {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.splat(),
      this.config.environment === 'production'
        ? format.json()
        : format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, ...metadata }) => {
              const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
              return `${timestamp} [${level}] ${message} ${meta}`;
            })
          )
    );

    const logTransports: any[] = [];

    if (this.config.enableConsole !== false) {
      logTransports.push(
        new transports.Console({
          format: logFormat,
        })
      );
    }

    if (this.config.enableFile) {
      logTransports.push(
        new transports.File({
          filename: this.config.logFilePath || 'logs/error.log',
          level: 'error',
          format: format.json(),
        }),
        new transports.File({
          filename: this.config.logFilePath?.replace('error', 'combined') || 'logs/combined.log',
          format: format.json(),
        })
      );
    }

    this.winstonLogger = createLogger({
      level: this.config.logLevel || LogLevel.INFO,
      defaultMeta: {
        service: this.config.serviceName,
        environment: this.config.environment,
        version: this.config.version || '1.0.0',
      },
      transports: logTransports,
      exitOnError: false,
    });
  }

  /**
   * Initialize Pino logger (faster alternative to Winston)
   */
  private initializePino(): void {
    const pinoConfig: pino.LoggerOptions = {
      level: this.config.logLevel || 'info',
      base: {
        service: this.config.serviceName,
        environment: this.config.environment,
        version: this.config.version || '1.0.0',
      },
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    if (this.config.environment !== 'production') {
      this.pinoLogger = pino(
        pinoConfig,
        pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        })
      );
    } else {
      this.pinoLogger = pino(pinoConfig);
    }
  }

  /**
   * Set logging context for correlation tracking
   */
  setContext(context: Partial<LogContext>): void {
    const correlationId = context.correlationId || uuidv4();
    this.context.set(correlationId, {
      correlationId,
      ...context,
    });
  }

  /**
   * Get current logging context
   */
  getContext(correlationId?: string): LogContext | undefined {
    if (correlationId) {
      return this.context.get(correlationId);
    }
    // Return the most recent context if no ID specified
    const contexts = Array.from(this.context.values());
    return contexts[contexts.length - 1];
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Clear context for a specific correlation ID
   */
  clearContext(correlationId: string): void {
    this.context.delete(correlationId);
  }

  /**
   * Enrich metadata with context information
   */
  private enrichMetadata(metadata: LogMetadata = {}): LogMetadata {
    const context = this.getContext(metadata.correlationId);

    return {
      ...metadata,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment,
      ...(context && {
        correlationId: context.correlationId,
        requestId: context.requestId,
        userId: context.userId,
        sessionId: context.sessionId,
        operationId: context.operationId,
      }),
    };
  }

  /**
   * Log info level message
   */
  info(message: string, metadata?: LogMetadata): void {
    const enrichedMeta = this.enrichMetadata(metadata);

    if (this.config.usePino && this.pinoLogger) {
      this.pinoLogger.info(enrichedMeta, message);
    } else if (this.winstonLogger) {
      this.winstonLogger.info(message, enrichedMeta);
    }
  }

  /**
   * Log warn level message
   */
  warn(message: string, metadata?: LogMetadata): void {
    const enrichedMeta = this.enrichMetadata(metadata);

    if (this.config.usePino && this.pinoLogger) {
      this.pinoLogger.warn(enrichedMeta, message);
    } else if (this.winstonLogger) {
      this.winstonLogger.warn(message, enrichedMeta);
    }
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    const enrichedMeta = this.enrichMetadata({
      ...metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    });

    if (this.config.usePino && this.pinoLogger) {
      this.pinoLogger.error(enrichedMeta, message);
    } else if (this.winstonLogger) {
      this.winstonLogger.error(message, enrichedMeta);
    }
  }

  /**
   * Log debug level message
   */
  debug(message: string, metadata?: LogMetadata): void {
    const enrichedMeta = this.enrichMetadata(metadata);

    if (this.config.usePino && this.pinoLogger) {
      this.pinoLogger.debug(enrichedMeta, message);
    } else if (this.winstonLogger) {
      this.winstonLogger.debug(message, enrichedMeta);
    }
  }

  /**
   * Log HTTP requests
   */
  http(message: string, metadata?: LogMetadata): void {
    const enrichedMeta = this.enrichMetadata(metadata);

    if (this.config.usePino && this.pinoLogger) {
      this.pinoLogger.info(enrichedMeta, message);
    } else if (this.winstonLogger) {
      this.winstonLogger.http(message, enrichedMeta);
    }
  }

  /**
   * Start a new operation with correlation tracking
   */
  startOperation(operationName: string, metadata?: LogMetadata): string {
    const operationId = uuidv4();
    const correlationId = metadata?.correlationId || uuidv4();

    this.setContext({
      correlationId,
      operationId,
      ...metadata,
    });

    this.info(`Operation started: ${operationName}`, {
      operationId,
      correlationId,
      operationName,
      ...metadata,
    });

    return operationId;
  }

  /**
   * End an operation
   */
  endOperation(
    operationId: string,
    operationName: string,
    success: boolean = true,
    metadata?: LogMetadata
  ): void {
    this.info(`Operation ${success ? 'completed' : 'failed'}: ${operationName}`, {
      operationId,
      operationName,
      success,
      ...metadata,
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext: LogMetadata): Logger {
    const childLogger = new Logger(this.config);
    const currentContext = this.getContext();

    childLogger.setContext({
      ...currentContext,
      ...childContext,
    });

    return childLogger;
  }
}

/**
 * Create a logger instance
 */
export function createLoggerInstance(config: LoggerConfig): Logger {
  return new Logger(config);
}
