import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LoggingModule, LoggingInterceptor } from '@applyforus/logging';
import { appConfig, validationSchema } from './config/app.config';
import { dataSourceOptions } from './config/database.config';
import { ResumesModule } from './modules/resumes/resumes.module';
import { SectionsModule } from './modules/sections/sections.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ParserModule } from './modules/parser/parser.module';
import { ExportModule } from './modules/export/export.module';
import { AlignmentModule } from './modules/alignment/alignment.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: validationSchema,
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
      useFactory: (configService: ConfigService) => ({
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
