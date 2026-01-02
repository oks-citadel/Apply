import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from '../modules/users/entities/user.entity';
import { AIGeneration } from '../modules/ai/entities/ai-generation.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
  entities: [User, AIGeneration],
  // Migrations configuration - run on startup in production
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsRun: configService.get<string>('nodeEnv') === 'production' ||
    configService.get<boolean>('database.runMigrations', false),
  migrationsTableName: 'typeorm_migrations',
  // SECURITY: Always use false in production - never allow auto-schema sync
  // Use migrations for schema changes instead
  synchronize: configService.get<string>('nodeEnv') === 'production'
    ? false
    : configService.get<boolean>('database.synchronize', false),
  logging: configService.get<boolean>('database.logging'),
  ssl: configService.get<string>('nodeEnv') === 'production' ? {
    rejectUnauthorized: configService.get<string>('database.sslRejectUnauthorized') !== 'false',
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
