"use strict";
/**
 * NestJS module for telemetry integration
 */
var TelemetryModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = exports.MetricsInterceptor = exports.TelemetryModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const nestjs_prometheus_1 = require("@willsoto/nestjs-prometheus");
const metrics_1 = require("./metrics");
const logger_1 = require("./logger");
const prometheus_metrics_service_1 = require("./prometheus-metrics.service");
const prometheus_controller_1 = require("./prometheus.controller");
const prometheus_interceptor_1 = require("./prometheus.interceptor");
/**
 * NestJS Telemetry Module
 *
 * Provides OpenTelemetry tracing, Prometheus metrics, and structured logging
 *
 * @example
 * ```typescript
 * import { TelemetryModule } from '@applyforus/telemetry';
 *
 * @Module({
 *   imports: [
 *     TelemetryModule.forRoot({
 *       serviceName: 'auth-service',
 *       serviceVersion: '1.0.0',
 *       environment: 'production',
 *       enablePrometheus: true,
 *       enableDefaultMetrics: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
let TelemetryModule = TelemetryModule_1 = class TelemetryModule {
    static forRoot(options) {
        const { serviceName, serviceVersion = '1.0.0', environment = process.env.NODE_ENV || 'development', enablePrometheus = true, prometheusPath = '/metrics', enableDefaultMetrics = true, logLevel = 'info', } = options;
        // Sanitize service name for Prometheus (replace hyphens with underscores)
        const sanitizedServiceName = serviceName.replace(/-/g, '_');
        const imports = [];
        const providers = [];
        const exports = [];
        // Add Prometheus module if enabled
        if (enablePrometheus) {
            imports.push(nestjs_prometheus_1.PrometheusModule.register({
                path: prometheusPath,
                defaultMetrics: {
                    enabled: enableDefaultMetrics,
                    config: {
                        prefix: `${sanitizedServiceName}_`,
                    },
                },
            }));
        }
        // Create MetricsService provider
        const metricsServiceProvider = {
            provide: metrics_1.MetricsService,
            useFactory: () => {
                return new metrics_1.MetricsService({
                    serviceName,
                    enableDefaultMetrics,
                    defaultLabels: {
                        service: serviceName,
                        version: serviceVersion,
                        environment,
                    },
                });
            },
        };
        providers.push(metricsServiceProvider);
        exports.push(metrics_1.MetricsService);
        // Create StructuredLogger provider
        const loggerProvider = {
            provide: logger_1.StructuredLogger,
            useFactory: () => {
                return new logger_1.StructuredLogger({
                    serviceName,
                    environment,
                    logLevel,
                });
            },
        };
        providers.push(loggerProvider);
        exports.push(logger_1.StructuredLogger);
        // Add PrometheusMetricsService
        providers.push(prometheus_metrics_service_1.PrometheusMetricsService);
        exports.push(prometheus_metrics_service_1.PrometheusMetricsService);
        // Add PrometheusInterceptor
        providers.push(prometheus_interceptor_1.PrometheusInterceptor);
        exports.push(prometheus_interceptor_1.PrometheusInterceptor);
        return {
            module: TelemetryModule_1,
            imports,
            providers,
            exports,
            controllers: [prometheus_controller_1.PrometheusController],
            global: true,
        };
    }
    configure(consumer) {
        // Middleware configuration can be added here if needed
    }
};
exports.TelemetryModule = TelemetryModule;
exports.TelemetryModule = TelemetryModule = TelemetryModule_1 = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], TelemetryModule);
/**
 * Metrics interceptor for automatic HTTP metrics collection
 */
const common_2 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let MetricsInterceptor = class MetricsInterceptor {
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    intercept(context, next) {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        this.metricsService.incrementActiveConnections();
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = (Date.now() - startTime) / 1000;
                const route = request.route?.path || request.url;
                const method = request.method;
                const statusCode = response.statusCode;
                this.metricsService.recordHttpRequest(method, route, statusCode, duration);
                this.metricsService.decrementActiveConnections();
            },
            error: () => {
                const duration = (Date.now() - startTime) / 1000;
                const route = request.route?.path || request.url;
                const method = request.method;
                const statusCode = response.statusCode || 500;
                this.metricsService.recordHttpRequest(method, route, statusCode, duration);
                this.metricsService.decrementActiveConnections();
            },
        }));
    }
};
exports.MetricsInterceptor = MetricsInterceptor;
exports.MetricsInterceptor = MetricsInterceptor = tslib_1.__decorate([
    (0, common_2.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [metrics_1.MetricsService])
], MetricsInterceptor);
/**
 * Logging interceptor for automatic request logging
 */
let LoggingInterceptor = class LoggingInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        const correlationId = request.headers['x-correlation-id'] || request.id;
        const childLogger = this.logger.child({
            correlationId,
            method: request.method,
            path: request.url,
        });
        request.logger = childLogger;
        childLogger.info('Incoming HTTP request', {
            userAgent: request.headers['user-agent'],
            ip: request.ip,
        });
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - startTime;
                childLogger.info('HTTP request completed', {
                    statusCode: response.statusCode,
                    duration,
                });
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                childLogger.error('HTTP request failed', error, {
                    statusCode: response.statusCode || 500,
                    duration,
                });
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = tslib_1.__decorate([
    (0, common_2.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [logger_1.StructuredLogger])
], LoggingInterceptor);
// Note: MetricsInterceptor and LoggingInterceptor are exported above via 'export class'
// PrometheusMetricsService, PrometheusController, and PrometheusInterceptor
// are exported via their own files in index.ts to avoid duplicate exports
//# sourceMappingURL=nestjs-module.js.map