import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingModule, LoggingInterceptor } from '@applyforus/logging';

// Configuration
import { databaseConfig } from './config/database.config';
import { elasticsearchConfig } from './config/elasticsearch.config';
import { redisConfig } from './config/redis.config';

// Modules
import { JobsModule } from './modules/jobs/jobs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { SearchModule } from './modules/search/search.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AggregatorModule } from './modules/aggregator/aggregator.module';
import { PlaybooksModule } from './modules/playbooks/playbooks.module';
import { NormalizationModule } from './modules/normalization/normalization.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { HealthModule } from './health/health.module';
import { SeederModule } from './seeds/seeder.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, elasticsearchConfig, redisConfig],
    }),

    // Logging module
    LoggingModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        serviceName: 'job-service',
        environment: configService.get<string>('NODE_ENV', 'development'),
        version: configService.get<string>('SERVICE_VERSION', '1.0.0'),
        appInsightsKey: configService.get<string>('APPLICATIONINSIGHTS_INSTRUMENTATION_KEY'),
        enableConsole: true,
        logLevel: configService.get<string>('LOG_LEVEL', 'info') as any,
      }),
      inject: [ConfigService],
    }),

    // TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
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
      inject: [ConfigService],
    }),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          db: configService.get('redis.db'),
          tls: configService.get('REDIS_TLS') === 'true' ? {} : undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 500,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // HTTP module for external API calls
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),

    // Health module
    HealthModule,

    // Feature modules
    JobsModule,
    CompaniesModule,
    AlertsModule,
    SearchModule,
    ReportsModule,
    SeederModule,
    AggregatorModule,
    PlaybooksModule,
    NormalizationModule,
    IngestionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
