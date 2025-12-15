/**
 * Example app.module.ts with monitoring integration
 *
 * This file demonstrates how to configure the TelemetryModule in your AppModule.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Import Telemetry Module
import {
  TelemetryModule,
  MetricsInterceptor,
  LoggingInterceptor,
} from '@applyforus/telemetry';

// Your existing modules
import { JobsModule } from './modules/jobs/jobs.module';
import { SearchModule } from './modules/search/search.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Telemetry Module - IMPORTANT: Add this early
    TelemetryModule.forRoot({
      serviceName: 'job-service',
      serviceVersion: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      enablePrometheus: true,
      prometheusPath: '/metrics',
      enableDefaultMetrics: true,
      logLevel: process.env.LOG_LEVEL || 'info',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    JobsModule,
    SearchModule,
    IntegrationsModule,
    HealthModule,
  ],
  providers: [
    // Global interceptors for automatic monitoring
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
