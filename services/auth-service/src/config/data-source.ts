import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { AIGeneration } from '../modules/ai/entities/ai-generation.entity';
import { User } from '../modules/users/entities/user.entity';

import type { DataSourceOptions } from 'typeorm';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'applyforus_auth',
  entities: [User, AIGeneration],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('azure')
    ? { rejectUnauthorized: false }
    : false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
