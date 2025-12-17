import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantTables1734360000000 implements MigrationInterface {
  name = 'CreateTenantTables1734360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "slug" varchar(100) NOT NULL UNIQUE,
        "type" varchar(50) NOT NULL,
        "status" varchar(50) DEFAULT 'trial' NOT NULL,
        "description" varchar(500),
        "industry" varchar(255),
        "website" varchar(255),
        "admin_email" varchar(255) NOT NULL,
        "admin_phone" varchar(50),
        "billing_email" varchar(255),
        "logo_url" varchar(500),
        "primary_color" varchar(7),
        "secondary_color" varchar(7),
        "custom_domain" varchar(100),
        "branding_settings" jsonb,
        "sso_enabled" boolean DEFAULT false NOT NULL,
        "sso_provider" varchar(50),
        "sso_settings" jsonb,
        "api_key" varchar(255),
        "api_secret" varchar(255),
        "api_enabled" boolean DEFAULT false NOT NULL,
        "settings" jsonb,
        "user_count" integer DEFAULT 0 NOT NULL,
        "trial_ends_at" timestamp,
        "activated_at" timestamp,
        "suspended_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for tenants
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tenants_slug" ON "tenants" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_tenants_status" ON "tenants" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_tenants_type" ON "tenants" ("type")`);

    // Create tenant_licenses table
    await queryRunner.query(`
      CREATE TABLE "tenant_licenses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL UNIQUE,
        "license_type" varchar(50) NOT NULL,
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "monthly_price" decimal(10,2) NOT NULL,
        "annual_price" decimal(10,2),
        "currency" varchar(3) DEFAULT 'USD' NOT NULL,
        "billing_cycle" varchar(50) DEFAULT 'monthly' NOT NULL,
        "billing_start_date" timestamp,
        "billing_end_date" timestamp,
        "next_billing_date" timestamp,
        "stripe_subscription_id" varchar(255),
        "stripe_price_id" varchar(255),
        "max_users" integer,
        "current_users" integer DEFAULT 0 NOT NULL,
        "max_applications_per_month" integer,
        "applications_this_month" integer DEFAULT 0 NOT NULL,
        "max_api_calls_per_day" integer,
        "api_calls_today" integer DEFAULT 0 NOT NULL,
        "max_storage_gb" integer,
        "storage_used_gb" decimal(10,2) DEFAULT 0 NOT NULL,
        "features" jsonb,
        "rate_limits" jsonb,
        "usage_reset_date" timestamp,
        "api_usage_reset_date" timestamp,
        "is_trial" boolean DEFAULT false NOT NULL,
        "trial_start_date" timestamp,
        "trial_end_date" timestamp,
        "cancel_at_period_end" boolean DEFAULT false NOT NULL,
        "cancelled_at" timestamp,
        "cancellation_reason" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for tenant_licenses
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tenant_licenses_tenant_id" ON "tenant_licenses" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tenant_licenses_status" ON "tenant_licenses" ("status")`);

    // Create tenant_users table
    await queryRunner.query(`
      CREATE TABLE "tenant_users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "department_id" uuid,
        "role" varchar(50) DEFAULT 'member' NOT NULL,
        "job_title" varchar(255),
        "employee_id" varchar(100),
        "manager_email" varchar(255),
        "student_id" varchar(100),
        "cohort" varchar(100),
        "graduation_year" varchar(100),
        "major" varchar(255),
        "is_active" boolean DEFAULT true NOT NULL,
        "invited_at" timestamp,
        "joined_at" timestamp,
        "deactivated_at" timestamp,
        "permissions" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for tenant_users
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tenant_users_tenant_user" ON "tenant_users" ("tenant_id", "user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tenant_users_tenant_id" ON "tenant_users" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tenant_users_user_id" ON "tenant_users" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tenant_users_role" ON "tenant_users" ("role")`);

    // Create tenant_departments table
    await queryRunner.query(`
      CREATE TABLE "tenant_departments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "code" varchar(100),
        "description" text,
        "parent_department_id" uuid,
        "manager_user_id" uuid,
        "annual_budget" decimal(12,2),
        "headcount" integer DEFAULT 0 NOT NULL,
        "target_headcount" integer,
        "total_applications" integer DEFAULT 0 NOT NULL,
        "successful_placements" integer DEFAULT 0 NOT NULL,
        "placement_rate" decimal(5,2) DEFAULT 0 NOT NULL,
        "average_salary_placed" decimal(10,2),
        "is_active" boolean DEFAULT true NOT NULL,
        "deactivated_at" timestamp,
        "settings" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for tenant_departments
    await queryRunner.query(`CREATE INDEX "IDX_tenant_departments_tenant_id" ON "tenant_departments" ("tenant_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tenant_departments_tenant_name" ON "tenant_departments" ("tenant_id", "name")`);

    // Create cohorts table
    await queryRunner.query(`
      CREATE TABLE "cohorts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "program" varchar(100) NOT NULL,
        "description" text,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "graduation_date" date,
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "enrolled_count" integer DEFAULT 0 NOT NULL,
        "target_enrollment" integer,
        "graduated_count" integer DEFAULT 0 NOT NULL,
        "instructors" jsonb,
        "coordinator_email" varchar(255),
        "placed_count" integer DEFAULT 0 NOT NULL,
        "placement_rate" decimal(5,2) DEFAULT 0 NOT NULL,
        "average_salary" decimal(10,2),
        "average_days_to_placement" decimal(5,1),
        "resources" jsonb,
        "settings" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for cohorts
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cohorts_tenant_name" ON "cohorts" ("tenant_id", "name")`);
    await queryRunner.query(`CREATE INDEX "IDX_cohorts_tenant_id" ON "cohorts" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_cohorts_status" ON "cohorts" ("status")`);

    // Create placement_tracking table
    await queryRunner.query(`
      CREATE TABLE "placement_tracking" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "student_id" varchar(100),
        "student_name" varchar(255) NOT NULL,
        "student_email" varchar(255) NOT NULL,
        "cohort" varchar(100) NOT NULL,
        "program" varchar(100),
        "major" varchar(100),
        "graduation_year" varchar(50),
        "graduation_date" date,
        "placement_status" varchar(50) DEFAULT 'pending' NOT NULL,
        "company_name" varchar(255),
        "job_title" varchar(255),
        "industry" varchar(100),
        "location" varchar(255),
        "employment_type" varchar(50),
        "salary" decimal(12,2),
        "salary_currency" varchar(3),
        "start_date" date,
        "placement_date" date,
        "days_to_placement" integer,
        "total_applications" integer DEFAULT 0 NOT NULL,
        "interviews_attended" integer DEFAULT 0 NOT NULL,
        "offers_received" integer DEFAULT 0 NOT NULL,
        "job_source" varchar(50),
        "used_platform" boolean DEFAULT false NOT NULL,
        "attended_career_services" boolean DEFAULT false NOT NULL,
        "notes" text,
        "skills" jsonb,
        "certifications" jsonb,
        "last_contact_date" date,
        "next_followup_date" date,
        "is_verified" boolean DEFAULT true NOT NULL,
        "verified_at" timestamp,
        "verified_by" varchar(255),
        "satisfaction_score" integer,
        "feedback" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for placement_tracking
    await queryRunner.query(`CREATE INDEX "IDX_placement_tracking_tenant_cohort" ON "placement_tracking" ("tenant_id", "cohort")`);
    await queryRunner.query(`CREATE INDEX "IDX_placement_tracking_tenant_user" ON "placement_tracking" ("tenant_id", "user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_placement_tracking_placement_date" ON "placement_tracking" ("placement_date")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "tenant_licenses"
      ADD CONSTRAINT "FK_tenant_licenses_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_users"
      ADD CONSTRAINT "FK_tenant_users_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_users"
      ADD CONSTRAINT "FK_tenant_users_department"
      FOREIGN KEY ("department_id") REFERENCES "tenant_departments"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_departments"
      ADD CONSTRAINT "FK_tenant_departments_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "cohorts"
      ADD CONSTRAINT "FK_cohorts_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "placement_tracking"
      ADD CONSTRAINT "FK_placement_tracking_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "placement_tracking" DROP CONSTRAINT "FK_placement_tracking_tenant"`);
    await queryRunner.query(`ALTER TABLE "cohorts" DROP CONSTRAINT "FK_cohorts_tenant"`);
    await queryRunner.query(`ALTER TABLE "tenant_departments" DROP CONSTRAINT "FK_tenant_departments_tenant"`);
    await queryRunner.query(`ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_tenant_users_department"`);
    await queryRunner.query(`ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_tenant_users_tenant"`);
    await queryRunner.query(`ALTER TABLE "tenant_licenses" DROP CONSTRAINT "FK_tenant_licenses_tenant"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_placement_tracking_placement_date"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_tracking_tenant_user"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_tracking_tenant_cohort"`);
    await queryRunner.query(`DROP INDEX "IDX_cohorts_status"`);
    await queryRunner.query(`DROP INDEX "IDX_cohorts_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_cohorts_tenant_name"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_departments_tenant_name"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_departments_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_users_role"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_users_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_users_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_users_tenant_user"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_licenses_status"`);
    await queryRunner.query(`DROP INDEX "IDX_tenant_licenses_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_tenants_type"`);
    await queryRunner.query(`DROP INDEX "IDX_tenants_status"`);
    await queryRunner.query(`DROP INDEX "IDX_tenants_slug"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "placement_tracking"`);
    await queryRunner.query(`DROP TABLE "cohorts"`);
    await queryRunner.query(`DROP TABLE "tenant_departments"`);
    await queryRunner.query(`DROP TABLE "tenant_users"`);
    await queryRunner.query(`DROP TABLE "tenant_licenses"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
