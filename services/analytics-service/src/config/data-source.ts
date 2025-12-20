import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { AnalyticsEvent } from '../modules/analytics/entities/analytics-event.entity';
import { SLAContract } from '../modules/sla/entities/sla-contract.entity';
import { SLAProgress } from '../modules/sla/entities/sla-progress.entity';
import { SLAViolation } from '../modules/sla/entities/sla-violation.entity';
import { SLARemedy } from '../modules/sla/entities/sla-remedy.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'applyforus_analytics',
  entities: [AnalyticsEvent, SLAContract, SLAProgress, SLAViolation, SLARemedy],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('azure')
      ? { rejectUnauthorized: false }
      : false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
