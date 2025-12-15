/**
 * NestJS Metrics Module
 *
 * Provides Prometheus metrics integration for NestJS applications
 */

import { Injectable, NestMiddleware, Controller, Get, Res, Module, DynamicModule, Global } from '@nestjs/common';
import { Response, Request, NextFunction } from 'express';
import { initMetrics, getMetrics, recordHttpRequest, recordHttpRequestStart, recordHttpRequestEnd, MetricsConfig } from './metrics';

/**
 * Metrics middleware for NestJS applications
 * Records HTTP request metrics automatically
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly serviceName: string) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const method = req.method;
    const route = req.route?.path || req.path;

    // Record request start
    recordHttpRequestStart(method, route, this.serviceName);

    // Record metrics when response finishes
    res.on('finish', () => {
      const durationSeconds = (Date.now() - startTime) / 1000;
      recordHttpRequest(method, route, res.statusCode, durationSeconds, this.serviceName);
      recordHttpRequestEnd(method, route, this.serviceName);
    });

    next();
  }
}

/**
 * Metrics controller for exposing Prometheus metrics endpoint
 */
@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    try {
      const metrics = await getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  }
}

/**
 * Configuration options for MetricsModule
 */
export interface MetricsModuleOptions extends MetricsConfig {
  enableController?: boolean;
}

/**
 * NestJS Metrics Module
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [
 *     MetricsModule.forRoot({
 *       serviceName: 'my-service',
 *       enableController: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    const { enableController = true, ...metricsConfig } = options;

    // Initialize metrics
    initMetrics(metricsConfig);

    return {
      module: MetricsModule,
      controllers: enableController ? [MetricsController] : [],
      providers: [
        {
          provide: 'METRICS_CONFIG',
          useValue: options,
        },
      ],
      exports: ['METRICS_CONFIG'],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => MetricsModuleOptions | Promise<MetricsModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: MetricsModule,
      controllers: [MetricsController],
      providers: [
        {
          provide: 'METRICS_CONFIG',
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            initMetrics(config);
            return config;
          },
          inject: options.inject || [],
        },
      ],
      exports: ['METRICS_CONFIG'],
    };
  }
}
