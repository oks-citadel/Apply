import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { LoggingModule, LoggingInterceptor, LogLevel } from '@applyforus/logging';
import { InputSanitizationMiddleware } from '@applyforus/security';

import { ComplianceModule } from './agents/compliance/compliance.module';
import { HealthModule } from './health/health.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
        return {
          serviceName: 'orchestrator-service',
          environment: configService.get<string>('NODE_ENV', 'development'),
          version: configService.get<string>('SERVICE_VERSION', '1.0.0'),
          appInsightsKey: configService.get<string>('APPLICATIONINSIGHTS_INSTRUMENTATION_KEY'),
          enableConsole: true,
          logLevel: logLevelMap[logLevelStr] ?? LogLevel.INFO,
        };
      },
      inject: [ConfigService],
    }),

    // Bull Queue for task management
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // HTTP client for inter-service communication
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get('HTTP_TIMEOUT', 30000),
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),

    // Health checks
    TerminusModule,

    // Feature modules
    OrchestratorModule,
    ComplianceModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InputSanitizationMiddleware).forRoutes('*');
  }
}
