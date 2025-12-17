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
export declare class TelemetryModule implements NestModule {
    static forRoot(options: TelemetryModuleOptions): DynamicModule;
    configure(consumer: MiddlewareConsumer): void;
}
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class MetricsInterceptor implements NestInterceptor {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: StructuredLogger);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
