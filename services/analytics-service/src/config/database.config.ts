import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AnalyticsEvent } from '../modules/analytics/entities/analytics-event.entity';
import { SLAContract } from '../modules/sla/entities/sla-contract.entity';
import { SLAProgress } from '../modules/sla/entities/sla-progress.entity';
import { SLAViolation } from '../modules/sla/entities/sla-violation.entity';
import { SLARemedy } from '../modules/sla/entities/sla-remedy.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
  entities: [AnalyticsEvent, SLAContract, SLAProgress, SLAViolation, SLARemedy],
  // SECURITY: Always use false in production - never allow auto-schema sync
  // Use migrations for schema changes instead
  synchronize: configService.get<string>('nodeEnv') === 'production'
    ? false
    : configService.get<boolean>('database.synchronize', false),
  logging: configService.get<boolean>('database.logging'),
  ssl: configService.get<string>('nodeEnv') === 'production' ? {
    rejectUnauthorized: true,
    ca: configService.get<string>('database.sslCaCert'),
  } : false,
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
  },
  poolSize: 10,
  maxQueryExecutionTime: 1000, // Log queries that take longer than 1 second
});
