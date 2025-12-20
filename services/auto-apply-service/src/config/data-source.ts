import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Application } from '../modules/applications/entities/application.entity';
import { AutoApplySettings } from '../modules/applications/entities/auto-apply-settings.entity';
import { FormMapping } from '../modules/form-mapping/entities/form-mapping.entity';

import type { DataSourceOptions } from 'typeorm';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'applyforus',
  entities: [Application, AutoApplySettings, FormMapping],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
