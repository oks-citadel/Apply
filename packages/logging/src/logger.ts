import * as appInsights from 'applicationinsights';
import * as winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { LoggerContext } from './context';
import { createStructuredFormat } from './formats';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export interface LogMetadata {
  [key: string]: any;
}

export interface LoggerOptions {
  serviceName: string;
  environment: string;
  version: string;
  appInsightsKey?: string;
  enableConsole?: boolean;
  logLevel?: LogLevel;
}

export class Logger {
  private winstonLogger: winston.Logger;
  private appInsightsClient?: appInsights.TelemetryClient;
  private serviceName: string;
  private environment: string;
  private version: string;

  constructor(options: LoggerOptions) {
    this.serviceName = options.serviceName;
    this.environment = options.environment;
    this.version = options.version;

    // Initialize Application Insights
    if (options.appInsightsKey) {
      this.initializeAppInsights(options.appInsightsKey);
    }

    // Initialize Winston logger
    this.winstonLogger = this.createWinstonLogger(
      options.enableConsole ?? true,
      options.logLevel ?? LogLevel.INFO,
    );
  }

  private initializeAppInsights(instrumentationKey: string): void {
    appInsights
      .setup(instrumentationKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(false) // We handle this with Winston
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start();

    this.appInsightsClient = appInsights.defaultClient;

    // Set cloud role name for service identification
    this.appInsightsClient.context.tags[
      this.appInsightsClient.context.keys.cloudRole
    ] = this.serviceName;

    this.appInsightsClient.context.tags[
      this.appInsightsClient.context.keys.cloudRoleInstance
    ] = `${this.serviceName}-${process.env.HOSTNAME || 'local'}`;

    // Add common properties
    this.appInsightsClient.commonProperties = {
      serviceName: this.serviceName,
      environment: this.environment,
      version: this.version,
    };
  }

  private createWinstonLogger(
    enableConsole: boolean,
    logLevel: LogLevel,
  ): winston.Logger {
    const transports: winston.transport[] = [];

    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: createStructuredFormat(this.serviceName, this.environment),
        }),
      );
    }

    return winston.createLogger({
      level: logLevel,
      transports,
    });
  }

  private getCorrelationId(): string {
    const context = LoggerContext.getContext();
    return context?.correlationId || uuidv4();
  }

  private getOperationId(): string | undefined {
    const context = LoggerContext.getContext();
    return context?.operationId;
  }

  private enrichMetadata(metadata: LogMetadata = {}): LogMetadata {
    const correlationId = this.getCorrelationId();
    const operationId = this.getOperationId();

    return {
      ...metadata,
      correlationId,
      ...(operationId && { operationId }),
      serviceName: this.serviceName,
      environment: this.environment,
      version: this.version,
      timestamp: new Date().toISOString(),
    };
  }

  private logToAppInsights(
    level: LogLevel,
    message: string,
    metadata: LogMetadata,
  ): void {
    if (!this.appInsightsClient) return;

    const enrichedMetadata = this.enrichMetadata(metadata);

    // Map log levels to Application Insights severity levels
    const severityMap = {
      [LogLevel.TRACE]: appInsights.Contracts.SeverityLevel.Verbose,
      [LogLevel.DEBUG]: appInsights.Contracts.SeverityLevel.Verbose,
      [LogLevel.INFO]: appInsights.Contracts.SeverityLevel.Information,
      [LogLevel.WARN]: appInsights.Contracts.SeverityLevel.Warning,
      [LogLevel.ERROR]: appInsights.Contracts.SeverityLevel.Error,
    };

    this.appInsightsClient.trackTrace({
      message,
      severity: severityMap[level],
      properties: enrichedMetadata,
    });
  }

  info(message: string, metadata?: LogMetadata): void {
    const enrichedMetadata = this.enrichMetadata(metadata);
    this.winstonLogger.info(message, enrichedMetadata);
    this.logToAppInsights(LogLevel.INFO, message, enrichedMetadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    const enrichedMetadata = this.enrichMetadata(metadata);
    this.winstonLogger.warn(message, enrichedMetadata);
    this.logToAppInsights(LogLevel.WARN, message, enrichedMetadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    const enrichedMetadata = this.enrichMetadata({
      ...metadata,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    });

    this.winstonLogger.error(message, enrichedMetadata);
    this.logToAppInsights(LogLevel.ERROR, message, enrichedMetadata);

    // Track exception separately in Application Insights
    if (error && this.appInsightsClient) {
      this.appInsightsClient.trackException({
        exception: error,
        properties: enrichedMetadata,
      });
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    const enrichedMetadata = this.enrichMetadata(metadata);
    this.winstonLogger.debug(message, enrichedMetadata);
    this.logToAppInsights(LogLevel.DEBUG, message, enrichedMetadata);
  }

  trace(message: string, metadata?: LogMetadata): void {
    const enrichedMetadata = this.enrichMetadata(metadata);
    this.winstonLogger.log('trace', message, enrichedMetadata);
    this.logToAppInsights(LogLevel.TRACE, message, enrichedMetadata);
  }

  trackEvent(name: string, properties?: LogMetadata, measurements?: { [key: string]: number }): void {
    const enrichedProperties = this.enrichMetadata(properties);

    if (this.appInsightsClient) {
      this.appInsightsClient.trackEvent({
        name,
        properties: enrichedProperties,
        measurements,
      });
    }

    this.info(`Event: ${name}`, { ...enrichedProperties, ...measurements });
  }

  trackMetric(
    name: string,
    value: number,
    properties?: LogMetadata,
  ): void {
    const enrichedProperties = this.enrichMetadata(properties);

    if (this.appInsightsClient) {
      this.appInsightsClient.trackMetric({
        name,
        value,
        properties: enrichedProperties,
      });
    }

    this.debug(`Metric: ${name} = ${value}`, enrichedProperties);
  }

  trackDependency(
    dependencyTypeName: string,
    name: string,
    data: string,
    duration: number,
    success: boolean,
    resultCode?: number,
    properties?: LogMetadata,
  ): void {
    const enrichedProperties = this.enrichMetadata(properties);

    if (this.appInsightsClient) {
      this.appInsightsClient.trackDependency({
        dependencyTypeName,
        name,
        data,
        duration,
        success,
        resultCode: resultCode ?? (success ? 200 : 500),
        properties: enrichedProperties,
      });
    }

    this.debug(
      `Dependency: ${name} (${dependencyTypeName}) - ${success ? 'Success' : 'Failed'}`,
      {
        ...enrichedProperties,
        duration,
        resultCode,
      },
    );
  }

  startOperation(operationName: string): string {
    const operationId = uuidv4();
    const correlationId = this.getCorrelationId();

    LoggerContext.setContext({
      correlationId,
      operationId,
      operationName,
    });

    this.info(`Starting operation: ${operationName}`, { operationId });
    return operationId;
  }

  endOperation(operationId: string, success: boolean = true, metadata?: LogMetadata): void {
    const context = LoggerContext.getContext();
    const operationName = context?.operationName || 'unknown';

    this.info(`Completed operation: ${operationName}`, {
      ...metadata,
      operationId,
      success,
    });
  }

  flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.appInsightsClient) {
        this.appInsightsClient.flush({
          callback: () => resolve(),
        });
      } else {
        resolve();
      }
    });
  }
}
