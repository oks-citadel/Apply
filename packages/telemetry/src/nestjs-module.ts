/**
 * NestJS module for telemetry integration
 */

import { Module, DynamicModule, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics';
import { StructuredLogger } from './logger';
import { PrometheusMetricsService } from './prometheus-metrics.service';
import { PrometheusController } from './prometheus.controller';
import { PrometheusInterceptor } from './prometheus.interceptor';

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
@Global()
@Module({})
export class TelemetryModule implements NestModule {
  static forRoot(options: TelemetryModuleOptions): DynamicModule {
    const {
      serviceName,
      serviceVersion = '1.0.0',
      environment = process.env.NODE_ENV || 'development',
      enablePrometheus = true,
      prometheusPath = '/metrics',
      enableDefaultMetrics = true,
      logLevel = 'info',
    } = options;

    // Sanitize service name for Prometheus (replace hyphens with underscores)
    const sanitizedServiceName = serviceName.replace(/-/g, '_');

    const imports: any[] = [];
    const providers: any[] = [];
    const exports: any[] = [];

    // Add Prometheus module if enabled
    if (enablePrometheus) {
      imports.push(
        PrometheusModule.register({
          path: prometheusPath,
          defaultMetrics: {
            enabled: enableDefaultMetrics,
            config: {
              prefix: `${sanitizedServiceName}_`,
            },
          },
        }),
      );
    }

    // Create MetricsService provider
    const metricsServiceProvider = {
      provide: MetricsService,
      useFactory: () => {
        return new MetricsService({
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
    exports.push(MetricsService);

    // Create StructuredLogger provider
    const loggerProvider = {
      provide: StructuredLogger,
      useFactory: () => {
        return new StructuredLogger({
          serviceName,
          environment,
          logLevel,
        });
      },
    };

    providers.push(loggerProvider);
    exports.push(StructuredLogger);

    // Add PrometheusMetricsService
    providers.push(PrometheusMetricsService);
    exports.push(PrometheusMetricsService);

    // Add PrometheusInterceptor
    providers.push(PrometheusInterceptor);
    exports.push(PrometheusInterceptor);

    return {
      module: TelemetryModule,
      imports,
      providers,
      exports,
      controllers: [PrometheusController],
      global: true,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    // Middleware configuration can be added here if needed
  }
}

/**
 * Metrics interceptor for automatic HTTP metrics collection
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    this.metricsService.incrementActiveConnections();

    return next.handle().pipe(
      tap({
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
      }),
    );
  }
}

/**
 * Logging interceptor for automatic request logging
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          childLogger.info('HTTP request completed', {
            statusCode: response.statusCode,
            duration,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          childLogger.error('HTTP request failed', error, {
            statusCode: response.statusCode || 500,
            duration,
          });
        },
      }),
    );
  }
}

// Note: MetricsInterceptor and LoggingInterceptor are exported above via 'export class'
// PrometheusMetricsService, PrometheusController, and PrometheusInterceptor
// are exported via their own files in index.ts to avoid duplicate exports
