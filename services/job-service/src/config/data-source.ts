import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Job } from '../modules/jobs/entities/job.entity';
import { SavedJob } from '../modules/jobs/entities/saved-job.entity';
import { Company } from '../modules/companies/entities/company.entity';
import { CompanyReview } from '../modules/companies/entities/company-review.entity';
import { JobAlert } from '../modules/alerts/entities/job-alert.entity';
import { JobReport } from '../modules/reports/entities/report.entity';
import { JobSource } from '../modules/ingestion/entities/job-source.entity';
import { IngestionJob } from '../modules/ingestion/entities/ingestion-job.entity';
import { RawJobListing } from '../modules/ingestion/entities/raw-job-listing.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'applyforus_job',
  entities: [Job, SavedJob, Company, CompanyReview, JobAlert, JobReport, JobSource, IngestionJob, RawJobListing],
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
