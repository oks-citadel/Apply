import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
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

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
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
