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
export declare function getLogLevelFromEnvironment(env?: string): LogLevel;
export declare function createLoggingConfig(overrides?: Partial<LoggingConfig>): LoggingConfig;
export declare function isProductionEnvironment(env?: string): boolean;
export declare function getLogLevelPriority(level: LogLevel): number;
export declare function shouldLog(messageLevel: LogLevel, configuredLevel: LogLevel): boolean;
export declare const LOG_LEVEL_DESCRIPTIONS: Record<LogLevel, string>;
export interface EnvironmentConfig {
    production: LoggingConfig;
    staging: LoggingConfig;
    development: LoggingConfig;
    test: LoggingConfig;
}
export declare function getEnvironmentSpecificConfig(serviceName: string, version: string): EnvironmentConfig;
export declare class LoggingConfigValidator {
    static validate(config: LoggingConfig): {
        valid: boolean;
        errors: string[];
    };
    static validateOrThrow(config: LoggingConfig): void;
}
