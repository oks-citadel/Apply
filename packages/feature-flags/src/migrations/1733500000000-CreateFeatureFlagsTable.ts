import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateFeatureFlagsTable1733500000000 implements MigrationInterface {
  name = 'CreateFeatureFlagsTable1733500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE feature_flag_type_enum AS ENUM ('boolean', 'percentage', 'user_list');
    `);

    await queryRunner.query(`
      CREATE TYPE feature_flag_status_enum AS ENUM ('enabled', 'disabled', 'deprecated');
    `);

    // Create feature_flags table
    await queryRunner.createTable(
      new Table({
        name: 'feature_flags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
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
            name: 'type',
            type: 'feature_flag_type_enum',
            default: "'boolean'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'feature_flag_status_enum',
            default: "'enabled'",
            isNullable: false,
          },
          {
            name: 'defaultValue',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'rolloutPercentage',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'enabledUserIds',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
          },
          {
            name: 'disabledUserIds',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'feature_flags',
      new TableIndex({
        name: 'IDX_FEATURE_FLAGS_KEY',
        columnNames: ['key'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'feature_flags',
      new TableIndex({
        name: 'IDX_FEATURE_FLAGS_STATUS',
        columnNames: ['status'],
      }),
    );

    // Insert default feature flags
    await queryRunner.query(`
      INSERT INTO feature_flags (key, name, description, type, status, "defaultValue")
      VALUES
        ('FEATURE_AUTO_APPLY', 'Auto Apply Feature', 'Enable automated job application functionality', 'boolean', 'enabled', true),
        ('FEATURE_AI_RESUME_BUILDER', 'AI Resume Builder', 'Enable AI-powered resume building and optimization', 'boolean', 'enabled', true),
        ('FEATURE_ANALYTICS_DASHBOARD', 'Analytics Dashboard', 'Enable analytics dashboard for job search insights', 'boolean', 'enabled', true),
        ('FEATURE_CHROME_EXTENSION', 'Chrome Extension', 'Enable Chrome extension for quick-apply features', 'boolean', 'enabled', false),
        ('AI_SUGGESTIONS_ENABLED', 'AI Suggestions', 'Enable AI-powered job suggestions and recommendations', 'boolean', 'enabled', true),
        ('RESUME_OPTIMIZATION_ENABLED', 'Resume Optimization', 'Enable AI-powered resume optimization', 'boolean', 'enabled', true),
        ('SALARY_PREDICTION_ENABLED', 'Salary Prediction', 'Enable AI-powered salary prediction for job listings', 'boolean', 'enabled', true),
        ('LINKEDIN_AUTO_APPLY_ENABLED', 'LinkedIn Auto Apply', 'Enable auto-apply for LinkedIn job postings', 'boolean', 'enabled', true),
        ('INDEED_AUTO_APPLY_ENABLED', 'Indeed Auto Apply', 'Enable auto-apply for Indeed job postings', 'boolean', 'enabled', true),
        ('GLASSDOOR_AUTO_APPLY_ENABLED', 'Glassdoor Auto Apply', 'Enable auto-apply for Glassdoor job postings', 'boolean', 'enabled', false),
        ('EMAIL_NOTIFICATIONS_ENABLED', 'Email Notifications', 'Enable email notifications for application updates', 'boolean', 'enabled', true),
        ('PUSH_NOTIFICATIONS_ENABLED', 'Push Notifications', 'Enable push notifications for real-time updates', 'boolean', 'enabled', true),
        ('ENABLE_VERSION_CONTROL', 'Version Control', 'Enable version control for resumes', 'boolean', 'enabled', true),
        ('ENABLE_ANALYTICS', 'Analytics', 'Enable analytics tracking and reporting', 'boolean', 'enabled', true),
        ('VIRUS_SCAN_ENABLED', 'Virus Scanning', 'Enable virus scanning for uploaded files', 'boolean', 'enabled', false),
        ('AUTO_BACKUP_ENABLED', 'Auto Backup', 'Enable automatic backup of user data', 'boolean', 'enabled', false),
        ('ADMIN_DASHBOARD_ENABLED', 'Admin Dashboard', 'Enable admin dashboard for platform management', 'boolean', 'enabled', true),
        ('USER_IMPERSONATION_ENABLED', 'User Impersonation', 'Enable user impersonation for admin support', 'boolean', 'disabled', false),
        ('PREMIUM_TEMPLATES_ENABLED', 'Premium Templates', 'Enable premium resume templates', 'boolean', 'enabled', false),
        ('ADVANCED_ANALYTICS_ENABLED', 'Advanced Analytics', 'Enable advanced analytics and insights', 'boolean', 'enabled', false),
        ('PRIORITY_SUPPORT_ENABLED', 'Priority Support', 'Enable priority customer support', 'boolean', 'enabled', false);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('feature_flags', 'IDX_FEATURE_FLAGS_STATUS');
    await queryRunner.dropIndex('feature_flags', 'IDX_FEATURE_FLAGS_KEY');

    // Drop table
    await queryRunner.dropTable('feature_flags');

    // Drop enum types
    await queryRunner.query('DROP TYPE feature_flag_status_enum');
    await queryRunner.query('DROP TYPE feature_flag_type_enum');
  }
}
