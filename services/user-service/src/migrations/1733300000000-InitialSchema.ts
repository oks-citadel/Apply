import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialSchema1733300000000 implements MigrationInterface {
  name = 'InitialSchema1733300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due', 'trialing');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE remote_preference AS ENUM ('remote', 'hybrid', 'onsite', 'any');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE skill_proficiency AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create profiles table
    await queryRunner.createTable(
      new Table({
        name: 'profiles',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'headline',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'linkedin_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'github_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'portfolio_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'profile_photo_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'completeness_score',
            type: 'integer',
            default: 0,
            isNullable: false,
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

    // Create indexes on profiles
    await queryRunner.createIndex(
      'profiles',
      new TableIndex({
        name: 'IDX_PROFILES_USER_ID',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );

    // Create work_experiences table
    await queryRunner.createTable(
      new Table({
        name: 'work_experiences',
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
            name: 'company',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'is_current',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'achievements',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'technologies',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
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

    // Create indexes on work_experiences
    await queryRunner.createIndex(
      'work_experiences',
      new TableIndex({
        name: 'IDX_WORK_EXPERIENCES_USER_ID',
        columnNames: ['user_id'],
      })
    );

    // Create education table
    await queryRunner.createTable(
      new Table({
        name: 'education',
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
            name: 'institution',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'degree',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'field_of_study',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'is_current',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'gpa',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'achievements',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
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

    // Create indexes on education
    await queryRunner.createIndex(
      'education',
      new TableIndex({
        name: 'IDX_EDUCATION_USER_ID',
        columnNames: ['user_id'],
      })
    );

    // Create skills table
    await queryRunner.createTable(
      new Table({
        name: 'skills',
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
            name: 'proficiency',
            type: 'enum',
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: "'intermediate'",
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'years_of_experience',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            isNullable: false,
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

    // Create indexes on skills
    await queryRunner.createIndex(
      'skills',
      new TableIndex({
        name: 'IDX_SKILLS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    // Create preferences table
    await queryRunner.createTable(
      new Table({
        name: 'preferences',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'target_job_titles',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'target_locations',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'salary_min',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'salary_max',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'remote_preference',
            type: 'enum',
            enum: ['remote', 'hybrid', 'onsite', 'any'],
            default: "'any'",
            isNullable: false,
          },
          {
            name: 'experience_level',
            type: 'enum',
            enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive'],
            isNullable: true,
          },
          {
            name: 'industries',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'excluded_companies',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'preferred_company_sizes',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'open_to_relocation',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'open_to_sponsorship',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'required_benefits',
            type: 'text',
            isArray: true,
            default: "'{}'",
            isNullable: false,
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

    // Create indexes on preferences
    await queryRunner.createIndex(
      'preferences',
      new TableIndex({
        name: 'IDX_PREFERENCES_USER_ID',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );

    // Create subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'tier',
            type: 'enum',
            enum: ['free', 'basic', 'pro', 'enterprise'],
            default: "'free'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'stripe_customer_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripe_subscription_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripe_price_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'current_period_start',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'current_period_end',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'trial_end',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'cancel_at_period_end',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'applications_this_month',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'ai_cover_letters_this_month',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'resume_uploads',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'usage_reset_date',
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

    // Create indexes on subscriptions
    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_SUBSCRIPTIONS_USER_ID',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_SUBSCRIPTIONS_TIER',
        columnNames: ['tier'],
      })
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_SUBSCRIPTIONS_STATUS',
        columnNames: ['status'],
      })
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE profiles IS 'User profile information and professional details';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE work_experiences IS 'User work experience history';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE education IS 'User education history';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE skills IS 'User skills and proficiency levels';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE preferences IS 'User job search preferences';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE subscriptions IS 'User subscription and billing information';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('subscriptions', 'IDX_SUBSCRIPTIONS_STATUS');
    await queryRunner.dropIndex('subscriptions', 'IDX_SUBSCRIPTIONS_TIER');
    await queryRunner.dropIndex('subscriptions', 'IDX_SUBSCRIPTIONS_USER_ID');
    await queryRunner.dropIndex('preferences', 'IDX_PREFERENCES_USER_ID');
    await queryRunner.dropIndex('skills', 'IDX_SKILLS_USER_ID');
    await queryRunner.dropIndex('education', 'IDX_EDUCATION_USER_ID');
    await queryRunner.dropIndex('work_experiences', 'IDX_WORK_EXPERIENCES_USER_ID');
    await queryRunner.dropIndex('profiles', 'IDX_PROFILES_USER_ID');

    // Drop tables
    await queryRunner.dropTable('subscriptions');
    await queryRunner.dropTable('preferences');
    await queryRunner.dropTable('skills');
    await queryRunner.dropTable('education');
    await queryRunner.dropTable('work_experiences');
    await queryRunner.dropTable('profiles');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS skill_proficiency`);
    await queryRunner.query(`DROP TYPE IF EXISTS experience_level`);
    await queryRunner.query(`DROP TYPE IF EXISTS remote_preference`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_tier`);
  }
}
