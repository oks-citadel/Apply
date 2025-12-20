import { Table, TableIndex, TableForeignKey } from 'typeorm';

import type { MigrationInterface, QueryRunner} from 'typeorm';

export class InitialSchema1733300000000 implements MigrationInterface {
  name = 'InitialSchema1733300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE company_size AS ENUM ('startup', 'small', 'medium', 'large', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE remote_type AS ENUM ('onsite', 'remote', 'hybrid');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE job_source AS ENUM ('indeed', 'linkedin', 'glassdoor', 'direct');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'internship');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE review_source AS ENUM ('glassdoor', 'indeed', 'internal');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE alert_frequency AS ENUM ('instant', 'daily', 'weekly');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create companies table
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'headquarters',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'industry',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'size',
            type: 'enum',
            enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
            isNullable: true,
          },
          {
            name: 'employee_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'founded_year',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'specialties',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'linkedin_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'glassdoor_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'indeed_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'review_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'culture_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'benefits',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'tech_stack',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on companies
    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'IDX_COMPANIES_NAME',
        columnNames: ['name'],
      })
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'IDX_COMPANIES_IS_VERIFIED',
        columnNames: ['is_verified'],
      })
    );

    // Create jobs table
    await queryRunner.createTable(
      new Table({
        name: 'jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'source',
            type: 'enum',
            enum: ['indeed', 'linkedin', 'glassdoor', 'direct'],
            default: "'direct'",
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'company_logo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'remote_type',
            type: 'enum',
            enum: ['onsite', 'remote', 'hybrid'],
            default: "'onsite'",
            isNullable: false,
          },
          {
            name: 'salary_min',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'salary_max',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'salary_currency',
            type: 'varchar',
            length: '50',
            default: "'USD'",
            isNullable: false,
          },
          {
            name: 'salary_period',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'requirements',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'benefits',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'skills',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'experience_level',
            type: 'enum',
            enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
            isNullable: true,
          },
          {
            name: 'experience_years_min',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'experience_years_max',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'employment_type',
            type: 'enum',
            enum: ['full_time', 'part_time', 'contract', 'temporary', 'internship'],
            default: "'full_time'",
            isNullable: false,
          },
          {
            name: 'posted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'application_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ats_platform',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'ats_metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'view_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'application_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'save_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'embedding',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on jobs
    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_EXTERNAL_ID',
        columnNames: ['external_id'],
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_SOURCE_EXTERNAL_ID',
        columnNames: ['source', 'external_id'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_TITLE',
        columnNames: ['title'],
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_COMPANY_ID',
        columnNames: ['company_id'],
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_LOCATION',
        columnNames: ['location'],
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_REMOTE_TYPE',
        columnNames: ['remote_type'],
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_POSTED_AT',
        columnNames: ['posted_at'],
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_EXPIRES_AT',
        columnNames: ['expires_at'],
      })
    );

    await queryRunner.createIndex(
      'jobs',
      new TableIndex({
        name: 'IDX_JOBS_IS_ACTIVE',
        columnNames: ['is_active'],
      })
    );

    // Add foreign key for jobs -> companies
    await queryRunner.createForeignKey(
      'jobs',
      new TableForeignKey({
        name: 'FK_JOBS_COMPANY',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Create saved_jobs table
    await queryRunner.createTable(
      new Table({
        name: 'saved_jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'applied_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on saved_jobs
    await queryRunner.createIndex(
      'saved_jobs',
      new TableIndex({
        name: 'IDX_SAVED_JOBS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'saved_jobs',
      new TableIndex({
        name: 'IDX_SAVED_JOBS_JOB_ID',
        columnNames: ['job_id'],
      })
    );

    await queryRunner.createIndex(
      'saved_jobs',
      new TableIndex({
        name: 'IDX_SAVED_JOBS_USER_JOB',
        columnNames: ['user_id', 'job_id'],
        isUnique: true,
      })
    );

    // Add foreign key for saved_jobs -> jobs
    await queryRunner.createForeignKey(
      'saved_jobs',
      new TableForeignKey({
        name: 'FK_SAVED_JOBS_JOB',
        columnNames: ['job_id'],
        referencedTableName: 'jobs',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Create company_reviews table
    await queryRunner.createTable(
      new Table({
        name: 'company_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'enum',
            enum: ['glassdoor', 'indeed', 'internal'],
            default: "'internal'",
            isNullable: false,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'review_text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'pros',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cons',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'overall_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'work_life_balance_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'culture_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'career_opportunities_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'compensation_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'management_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'job_title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'employment_status',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'years_at_company',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'recommend_to_friend',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'approve_of_ceo',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'helpful_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'reviewed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on company_reviews
    await queryRunner.createIndex(
      'company_reviews',
      new TableIndex({
        name: 'IDX_COMPANY_REVIEWS_COMPANY_ID',
        columnNames: ['company_id'],
      })
    );

    await queryRunner.createIndex(
      'company_reviews',
      new TableIndex({
        name: 'IDX_COMPANY_REVIEWS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    // Add foreign key for company_reviews -> companies
    await queryRunner.createForeignKey(
      'company_reviews',
      new TableForeignKey({
        name: 'FK_COMPANY_REVIEWS_COMPANY',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Create job_alerts table
    await queryRunner.createTable(
      new Table({
        name: 'job_alerts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'keywords',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'remote_type',
            type: 'enum',
            enum: ['onsite', 'remote', 'hybrid'],
            isNullable: true,
          },
          {
            name: 'salary_min',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'salary_max',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'experience_level',
            type: 'enum',
            enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
            isNullable: true,
          },
          {
            name: 'employment_type',
            type: 'enum',
            enum: ['full_time', 'part_time', 'contract', 'temporary', 'internship'],
            isNullable: true,
          },
          {
            name: 'skills',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'frequency',
            type: 'enum',
            enum: ['instant', 'daily', 'weekly'],
            default: "'daily'",
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'last_sent_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'last_checked_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'jobs_sent_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on job_alerts
    await queryRunner.createIndex(
      'job_alerts',
      new TableIndex({
        name: 'IDX_JOB_ALERTS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'job_alerts',
      new TableIndex({
        name: 'IDX_JOB_ALERTS_IS_ACTIVE',
        columnNames: ['is_active'],
      })
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE companies IS 'Company profiles and information';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE jobs IS 'Job postings from various sources';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE saved_jobs IS 'Jobs saved by users';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE company_reviews IS 'Company reviews from various sources';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE job_alerts IS 'User job alert subscriptions';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('job_alerts', 'IDX_JOB_ALERTS_IS_ACTIVE');
    await queryRunner.dropIndex('job_alerts', 'IDX_JOB_ALERTS_USER_ID');
    await queryRunner.dropIndex('company_reviews', 'IDX_COMPANY_REVIEWS_CREATED_AT');
    await queryRunner.dropIndex('company_reviews', 'IDX_COMPANY_REVIEWS_COMPANY_ID');
    await queryRunner.dropIndex('saved_jobs', 'IDX_SAVED_JOBS_USER_JOB');
    await queryRunner.dropIndex('saved_jobs', 'IDX_SAVED_JOBS_JOB_ID');
    await queryRunner.dropIndex('saved_jobs', 'IDX_SAVED_JOBS_USER_ID');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_IS_ACTIVE');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_EXPIRES_AT');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_POSTED_AT');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_REMOTE_TYPE');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_LOCATION');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_COMPANY_ID');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_TITLE');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_SOURCE_EXTERNAL_ID');
    await queryRunner.dropIndex('jobs', 'IDX_JOBS_EXTERNAL_ID');
    await queryRunner.dropIndex('companies', 'IDX_COMPANIES_IS_VERIFIED');
    await queryRunner.dropIndex('companies', 'IDX_COMPANIES_NAME');

    // Drop foreign keys
    await queryRunner.dropForeignKey('company_reviews', 'FK_COMPANY_REVIEWS_COMPANY');
    await queryRunner.dropForeignKey('saved_jobs', 'FK_SAVED_JOBS_JOB');
    await queryRunner.dropForeignKey('jobs', 'FK_JOBS_COMPANY');

    // Drop tables
    await queryRunner.dropTable('job_alerts');
    await queryRunner.dropTable('company_reviews');
    await queryRunner.dropTable('saved_jobs');
    await queryRunner.dropTable('jobs');
    await queryRunner.dropTable('companies');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS alert_frequency`);
    await queryRunner.query(`DROP TYPE IF EXISTS review_source`);
    await queryRunner.query(`DROP TYPE IF EXISTS employment_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS experience_level`);
    await queryRunner.query(`DROP TYPE IF EXISTS job_source`);
    await queryRunner.query(`DROP TYPE IF EXISTS remote_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS company_size`);
  }
}
