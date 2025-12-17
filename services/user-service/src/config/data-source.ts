import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Profile } from '../modules/profile/entities/profile.entity';
import { WorkExperience } from '../modules/career/entities/work-experience.entity';
import { Education } from '../modules/career/entities/education.entity';
import { Skill } from '../modules/skills/entities/skill.entity';
import { Preference } from '../modules/preferences/entities/preference.entity';
import { Subscription } from '../modules/subscription/entities/subscription.entity';
import { Certification } from '../modules/profile/entities/certification.entity';
import { RecruiterProfile } from '../modules/recruiter/entities/recruiter-profile.entity';
import { RecruiterAssignment } from '../modules/recruiter/entities/recruiter-assignment.entity';
import { RecruiterRevenue } from '../modules/recruiter/entities/recruiter-revenue.entity';
import { RecruiterReview } from '../modules/recruiter/entities/recruiter-review.entity';
import { PlacementOutcome } from '../modules/recruiter/entities/placement-outcome.entity';
import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { TenantUser } from '../modules/tenant/entities/tenant-user.entity';
import { TenantDepartment } from '../modules/tenant/entities/tenant-department.entity';
import { TenantLicense } from '../modules/tenant/entities/tenant-license.entity';
import { Cohort } from '../modules/tenant/entities/cohort.entity';
import { PlacementTracking } from '../modules/tenant/entities/placement-tracking.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'applyforus_user',
  entities: [
    Profile,
    WorkExperience,
    Education,
    Skill,
    Preference,
    Subscription,
    Certification,
    RecruiterProfile,
    RecruiterAssignment,
    RecruiterRevenue,
    RecruiterReview,
    PlacementOutcome,
    Tenant,
    TenantUser,
    TenantDepartment,
    TenantLicense,
    Cohort,
    PlacementTracking,
  ],
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
