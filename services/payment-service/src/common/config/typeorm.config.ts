import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { Invoice } from '../../modules/invoices/entities/invoice.entity';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_DATABASE', 'payment_service'),
  entities: [Subscription, Invoice],
  // Migrations configuration - run on startup in production
  migrations: [join(__dirname, '../../migrations/*{.ts,.js}')],
  migrationsRun: configService.get<string>('NODE_ENV') === 'production' ||
    configService.get<string>('RUN_MIGRATIONS') === 'true',
  migrationsTableName: 'typeorm_migrations',
  // SECURITY: Never use synchronize in production
  synchronize: configService.get<string>('NODE_ENV') === 'production'
    ? false
    : configService.get<boolean>('DB_SYNCHRONIZE', false),
  logging: configService.get<boolean>('DB_LOGGING', false),
  ssl: configService.get<string>('NODE_ENV') === 'production'
    ? { rejectUnauthorized: false }
    : false,
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
  },
  poolSize: 10,
  maxQueryExecutionTime: 1000,
});

// For TypeORM CLI
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'payment_service',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
