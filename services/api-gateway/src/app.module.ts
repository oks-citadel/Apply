import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule , ThrottlerGuard } from '@nestjs/throttler';

import { LoggingModule, LoggingInterceptor, LogLevel } from '@applyforus/logging';
import { TelemetryModule, PrometheusInterceptor } from '@applyforus/telemetry';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Telemetry module (Prometheus metrics + structured logging)
    TelemetryModule.forRoot({
      serviceName: 'api-gateway',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      enablePrometheus: true,
      enableDefaultMetrics: true,
      prometheusPath: '/metrics',
      logLevel: process.env.LOG_LEVEL || 'info',
    }),

    // Logging module
    LoggingModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        const logLevelStr = configService.get<string>('LOG_LEVEL', 'info').toLowerCase();
        const logLevelMap: Record<string, LogLevel> = {
          error: LogLevel.ERROR,
          warn: LogLevel.WARN,
          debug: LogLevel.DEBUG,
          trace: LogLevel.TRACE,
          info: LogLevel.INFO,
        };
        const logLevel = logLevelMap[logLevelStr] ?? LogLevel.INFO;

        return {
          serviceName: 'api-gateway',
          environment: configService.get<string>('NODE_ENV', 'development'),
          version: configService.get<string>('SERVICE_VERSION', '1.0.0'),
          appInsightsKey: configService.get<string>('APPLICATIONINSIGHTS_INSTRUMENTATION_KEY'),
          enableConsole: true,
          logLevel,
        };
      },
      inject: [ConfigService],
    }),

    // Rate limiting module
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Feature modules
    HealthModule,
    AuthModule,
    RateLimitModule,
    ProxyModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Prometheus metrics interceptor for automatic HTTP metrics collection
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
  ],
})
export class AppModule {}
