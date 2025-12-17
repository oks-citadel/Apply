import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';
import { Resume } from '../modules/resumes/entities/resume.entity';
import { ResumeVersion } from '../modules/resumes/entities/resume-version.entity';
import { Section } from '../modules/sections/entities/section.entity';
import { Template } from '../modules/templates/entities/template.entity';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'resume_service'),
  entities: [Resume, ResumeVersion, Section, Template],
  // Migrations configuration - run on startup in production
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsRun: configService.get('NODE_ENV') === 'production' ||
    configService.get('RUN_MIGRATIONS', 'false') === 'true',
  migrationsTableName: 'typeorm_migrations',
  synchronize: false, // Never use synchronize in production - use migrations instead,
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
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
