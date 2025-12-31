import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule , ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggingModule, LoggingInterceptor } from '@applyforus/logging';
import { SubscriptionGuard, InputSanitizationMiddleware } from '@applyforus/security';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { appConfig, validationSchema } from './config/app.config';
import { dataSourceOptions } from './config/database.config';
import { HealthModule } from './health/health.module';
import { AlignmentModule } from './modules/alignment/alignment.module';
import { ExportModule } from './modules/export/export.module';
import { ParserModule } from './modules/parser/parser.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { SectionsModule } from './modules/sections/sections.module';
import { TemplatesModule } from './modules/templates/templates.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Logging module
    LoggingModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        serviceName: 'resume-service',
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
      useFactory: (_configService: ConfigService) => ({
        ...dataSourceOptions,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
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

    // JWT Authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),

    // Feature modules
    ResumesModule,
    SectionsModule,
    TemplatesModule,
    ParserModule,
    ExportModule,
    AlignmentModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    // Rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Authentication - must come before subscription guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Subscription tier enforcement - applies @RequiresTier decorators
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
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
