/**
 * NestJS module for telemetry integration
 */
import { DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MetricsService } from './metrics';
import { StructuredLogger } from './logger';
export interface TelemetryModuleOptions {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    azureMonitorConnectionString?: string;
    enablePrometheus?: boolean;
    prometheusPath?: string;
    enableDefaultMetrics?: boolean;
    logLevel?: string;
}
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
export declare class TelemetryModule implements NestModule {
    static forRoot(options: TelemetryModuleOptions): DynamicModule;
    configure(consumer: MiddlewareConsumer): void;
}
/**
 * Metrics interceptor for automatic HTTP metrics collection
 */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class MetricsInterceptor implements NestInterceptor {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
/**
 * Logging interceptor for automatic request logging
 */
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: StructuredLogger);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
//# sourceMappingURL=nestjs-module.d.ts.map