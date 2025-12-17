"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingConfigValidator = exports.LOG_LEVEL_DESCRIPTIONS = void 0;
exports.getLogLevelFromEnvironment = getLogLevelFromEnvironment;
exports.createLoggingConfig = createLoggingConfig;
exports.isProductionEnvironment = isProductionEnvironment;
exports.getLogLevelPriority = getLogLevelPriority;
exports.shouldLog = shouldLog;
exports.getEnvironmentSpecificConfig = getEnvironmentSpecificConfig;
const logger_1 = require("./logger");
function getLogLevelFromEnvironment(env) {
    const environment = env || process.env.NODE_ENV || 'development';
    switch (environment.toLowerCase()) {
        case 'production':
        case 'prod':
            return logger_1.LogLevel.INFO;
        case 'staging':
        case 'stage':
            return logger_1.LogLevel.INFO;
        case 'test':
        case 'testing':
            return logger_1.LogLevel.WARN;
        case 'development':
        case 'dev':
        case 'local':
        default:
            return logger_1.LogLevel.DEBUG;
    }
}
function createLoggingConfig(overrides) {
    const environment = process.env.NODE_ENV || 'development';
    const serviceName = process.env.SERVICE_NAME || 'unknown-service';
    const version = process.env.SERVICE_VERSION || '1.0.0';
    const appInsightsKey = process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY;
    const defaultConfig = {
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
function isProductionEnvironment(env) {
    const environment = env || process.env.NODE_ENV || 'development';
    return ['production', 'prod', 'staging', 'stage'].includes(environment.toLowerCase());
}
function getLogLevelPriority(level) {
    const priorities = {
        [logger_1.LogLevel.ERROR]: 0,
        [logger_1.LogLevel.WARN]: 1,
        [logger_1.LogLevel.INFO]: 2,
        [logger_1.LogLevel.DEBUG]: 3,
        [logger_1.LogLevel.TRACE]: 4,
    };
    return priorities[level] ?? 2;
}
function shouldLog(messageLevel, configuredLevel) {
    return (getLogLevelPriority(messageLevel) <= getLogLevelPriority(configuredLevel));
}
exports.LOG_LEVEL_DESCRIPTIONS = {
    [logger_1.LogLevel.ERROR]: 'Critical errors that require immediate attention. Service may be degraded or unavailable.',
    [logger_1.LogLevel.WARN]: 'Warning conditions that should be addressed but do not prevent normal operation.',
    [logger_1.LogLevel.INFO]: 'Informational messages about normal application operation and significant events.',
    [logger_1.LogLevel.DEBUG]: 'Detailed debugging information useful during development and troubleshooting.',
    [logger_1.LogLevel.TRACE]: 'Very detailed trace information, typically only enabled for diagnosing specific issues.',
};
function getEnvironmentSpecificConfig(serviceName, version) {
    const baseConfig = {
        serviceName,
        version,
    };
    return {
        production: {
            ...baseConfig,
            level: logger_1.LogLevel.INFO,
            enableConsole: true,
            enableAppInsights: true,
            appInsightsKey: process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
            environment: 'production',
        },
        staging: {
            ...baseConfig,
            level: logger_1.LogLevel.INFO,
            enableConsole: true,
            enableAppInsights: true,
            appInsightsKey: process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
            environment: 'staging',
        },
        development: {
            ...baseConfig,
            level: logger_1.LogLevel.DEBUG,
            enableConsole: true,
            enableAppInsights: false,
            environment: 'development',
        },
        test: {
            ...baseConfig,
            level: logger_1.LogLevel.WARN,
            enableConsole: false,
            enableAppInsights: false,
            environment: 'test',
        },
    };
}
class LoggingConfigValidator {
    static validate(config) {
        const errors = [];
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
            errors.push('appInsightsKey is required when enableAppInsights is true');
        }
        if (!Object.values(logger_1.LogLevel).includes(config.level)) {
            errors.push(`Invalid log level: ${config.level}`);
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    static validateOrThrow(config) {
        const { valid, errors } = this.validate(config);
        if (!valid) {
            throw new Error(`Invalid logging configuration:\n${errors.join('\n')}`);
        }
    }
}
exports.LoggingConfigValidator = LoggingConfigValidator;
//# sourceMappingURL=config.js.map