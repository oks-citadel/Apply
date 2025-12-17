"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const appInsights = require("applicationinsights");
const winston = require("winston");
const uuid_1 = require("uuid");
const context_1 = require("./context");
const formats_1 = require("./formats");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
    LogLevel["TRACE"] = "trace";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(options) {
        this.serviceName = options.serviceName;
        this.environment = options.environment;
        this.version = options.version;
        if (options.appInsightsKey) {
            this.initializeAppInsights(options.appInsightsKey);
        }
        this.winstonLogger = this.createWinstonLogger(options.enableConsole ?? true, options.logLevel ?? LogLevel.INFO);
    }
    initializeAppInsights(instrumentationKey) {
        appInsights
            .setup(instrumentationKey)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true, true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setAutoCollectConsole(false)
            .setUseDiskRetryCaching(true)
            .setSendLiveMetrics(true)
            .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
            .start();
        this.appInsightsClient = appInsights.defaultClient;
        this.appInsightsClient.context.tags[this.appInsightsClient.context.keys.cloudRole] = this.serviceName;
        this.appInsightsClient.context.tags[this.appInsightsClient.context.keys.cloudRoleInstance] = `${this.serviceName}-${process.env.HOSTNAME || 'local'}`;
        this.appInsightsClient.commonProperties = {
            serviceName: this.serviceName,
            environment: this.environment,
            version: this.version,
        };
    }
    createWinstonLogger(enableConsole, logLevel) {
        const transports = [];
        if (enableConsole) {
            transports.push(new winston.transports.Console({
                format: (0, formats_1.createStructuredFormat)(this.serviceName, this.environment),
            }));
        }
        return winston.createLogger({
            level: logLevel,
            transports,
        });
    }
    getCorrelationId() {
        const context = context_1.LoggerContext.getContext();
        return context?.correlationId || (0, uuid_1.v4)();
    }
    getOperationId() {
        const context = context_1.LoggerContext.getContext();
        return context?.operationId;
    }
    enrichMetadata(metadata = {}) {
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
    logToAppInsights(level, message, metadata) {
        if (!this.appInsightsClient)
            return;
        const enrichedMetadata = this.enrichMetadata(metadata);
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
    info(message, metadata) {
        const enrichedMetadata = this.enrichMetadata(metadata);
        this.winstonLogger.info(message, enrichedMetadata);
        this.logToAppInsights(LogLevel.INFO, message, enrichedMetadata);
    }
    warn(message, metadata) {
        const enrichedMetadata = this.enrichMetadata(metadata);
        this.winstonLogger.warn(message, enrichedMetadata);
        this.logToAppInsights(LogLevel.WARN, message, enrichedMetadata);
    }
    error(message, error, metadata) {
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
        if (error && this.appInsightsClient) {
            this.appInsightsClient.trackException({
                exception: error,
                properties: enrichedMetadata,
            });
        }
    }
    debug(message, metadata) {
        const enrichedMetadata = this.enrichMetadata(metadata);
        this.winstonLogger.debug(message, enrichedMetadata);
        this.logToAppInsights(LogLevel.DEBUG, message, enrichedMetadata);
    }
    trace(message, metadata) {
        const enrichedMetadata = this.enrichMetadata(metadata);
        this.winstonLogger.log('trace', message, enrichedMetadata);
        this.logToAppInsights(LogLevel.TRACE, message, enrichedMetadata);
    }
    trackEvent(name, properties, measurements) {
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
    trackMetric(name, value, properties) {
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
    trackDependency(dependencyTypeName, name, data, duration, success, resultCode, properties) {
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
        this.debug(`Dependency: ${name} (${dependencyTypeName}) - ${success ? 'Success' : 'Failed'}`, {
            ...enrichedProperties,
            duration,
            resultCode,
        });
    }
    startOperation(operationName) {
        const operationId = (0, uuid_1.v4)();
        const correlationId = this.getCorrelationId();
        context_1.LoggerContext.setContext({
            correlationId,
            operationId,
            operationName,
        });
        this.info(`Starting operation: ${operationName}`, { operationId });
        return operationId;
    }
    endOperation(operationId, success = true, metadata) {
        const context = context_1.LoggerContext.getContext();
        const operationName = context?.operationName || 'unknown';
        this.info(`Completed operation: ${operationName}`, {
            ...metadata,
            operationId,
            success,
        });
    }
    flush() {
        return new Promise((resolve) => {
            if (this.appInsightsClient) {
                this.appInsightsClient.flush({
                    callback: () => resolve(),
                });
            }
            else {
                resolve();
            }
        });
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map