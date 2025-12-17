import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingModule, LoggingInterceptor } from '@applyforus/logging';
import { join } from 'path';

// Configuration
import { databaseConfig } from './config/database.config';
import { elasticsearchConfig } from './config/elasticsearch.config';
import { redisConfig } from './config/redis.config';

// Cache Module
import { RedisCacheModule } from './common/cache';

// Entities - only load entities for enabled modules
import { Job } from './modules/jobs/entities/job.entity';
import { SavedJob } from './modules/jobs/entities/saved-job.entity';
import { Company } from './modules/companies/entities/company.entity';
import { JobSource } from './modules/ingestion/entities/job-source.entity';
import { IngestionJob } from './modules/ingestion/entities/ingestion-job.entity';
import { RawJobListing } from './modules/ingestion/entities/raw-job-listing.entity';
import { NormalizedJob } from './modules/normalization/entities/normalized-job.entity';
import { JobTaxonomy, JobTitleMapping, SkillMapping, IndustryMapping } from './modules/normalization/entities/job-taxonomy.entity';
import { EmployerProfile } from './modules/normalization/entities/employer-profile.entity';
import { JobReport } from './modules/normalization/entities/job-report.entity';

// Modules - re-enabling core modules
import { JobsModule } from './modules/jobs/jobs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { NormalizationModule } from './modules/normalization/normalization.module';
// import { AlertsModule } from './modules/alerts/alerts.module';
// import { SearchModule } from './modules/search/search.module';
// import { ReportsModule } from './modules/reports/reports.module';
// import { AggregatorModule } from './modules/aggregator/aggregator.module';
// import { PlaybooksModule } from './modules/playbooks/playbooks.module';
import { HealthModule } from './health/health.module';
// import { SeederModule } from './seeds/seeder.module';

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
        // Explicitly list entities for enabled modules only
        entities: [
          Job,
          SavedJob,
          Company,
          JobSource,
          IngestionJob,
          RawJobListing,
          NormalizedJob,
          JobTaxonomy,
          JobTitleMapping,
          SkillMapping,
          IndustryMapping,
          EmployerProfile,
          JobReport,
        ],
        // Migrations configuration - run on startup in production
        migrations: [join(__dirname, './migrations/*{.ts,.js}')],
        migrationsRun: configService.get('NODE_ENV') === 'production' ||
          configService.get('RUN_MIGRATIONS') === 'true',
        migrationsTableName: 'typeorm_migrations',
        // Disable synchronize - tables created manually to avoid TypeORM index duplication bug
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? {
          rejectUnauthorized: false, // Azure PostgreSQL flexible server
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

    // Bull Queue - enabled for async job processing
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

    // Redis Cache Module for job search caching
    RedisCacheModule,

    // Core feature modules - re-enabled
    HealthModule,
    JobsModule,
    CompaniesModule,
    IngestionModule,
    NormalizationModule,

    // Optional feature modules - disabled until needed
    // AlertsModule,    // Requires Redis/Bull
    // SearchModule,    // Requires Elasticsearch
    // ReportsModule,
    // SeederModule,
    // AggregatorModule,
    // PlaybooksModule,
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
