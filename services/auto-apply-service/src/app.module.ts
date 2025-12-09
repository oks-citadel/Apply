import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingModule, LoggingInterceptor } from '@jobpilot/logging';
import { ApplicationsModule } from './modules/applications/applications.module';
// EngineModule does not exist - commenting out
// import { EngineModule } from './modules/engine/engine.module';
import { BrowserModule } from './modules/browser/browser.module';
import { AdaptersModule } from './modules/adapters/adapters.module';
import { FormMappingModule } from './modules/form-mapping/form-mapping.module';
import { QueueModule } from './modules/queue/queue.module';
import { AnswerLibraryModule } from './modules/answer-library/answer-library.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { RateLimiterModule } from './modules/rate-limiter/rate-limiter.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Logging module
    LoggingModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        serviceName: 'auto-apply-service',
        environment: configService.get<string>('NODE_ENV', 'development'),
        version: configService.get<string>('SERVICE_VERSION', '1.0.0'),
        appInsightsKey: configService.get<string>('APPLICATIONINSIGHTS_INSTRUMENTATION_KEY'),
        enableConsole: true,
        logLevel: configService.get<string>('LOG_LEVEL', 'info') as any,
      }),
      inject: [ConfigService],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'auto_apply_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? {
          rejectUnauthorized: true,
          ca: configService.get('DB_SSL_CA_CERT'),
        } : false,
        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          statement_timeout: 30000,
        },
        poolSize: 10,
        maxQueryExecutionTime: 1000,
      }),
    }),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6380'), 10),
          password: configService.get('REDIS_PASSWORD'),
          tls: configService.get('REDIS_TLS') === 'true' ? {} : undefined,
        },
      }),
    }),

    // Feature Modules
    ApplicationsModule,
    // EngineModule, // Does not exist - commented out
    BrowserModule,
    AdaptersModule,
    FormMappingModule,
    QueueModule,
    AnswerLibraryModule,
    CaptchaModule,
    RateLimiterModule,
    HealthModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
