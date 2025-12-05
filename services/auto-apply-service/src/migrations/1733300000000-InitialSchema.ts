import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1733300000000 implements MigrationInterface {
  name = 'InitialSchema1733300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE application_status AS ENUM ('applied', 'viewed', 'interviewing', 'offered', 'rejected', 'withdrawn');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create applications table
    await queryRunner.createTable(
      new Table({
        name: 'applications',
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
            name: 'resume_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'cover_letter_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['applied', 'viewed', 'interviewing', 'offered', 'rejected', 'withdrawn'],
            default: "'applied'",
            isNullable: false,
          },
          {
            name: 'applied_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'response_received_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'match_score',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'auto_applied',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'position_title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'application_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ats_platform',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'application_reference_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'screenshot_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'form_responses',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'error_log',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'queue_status',
            type: 'varchar',
            length: '50',
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

    // Create indexes on applications
    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_APPLICATIONS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_APPLICATIONS_JOB_ID',
        columnNames: ['job_id'],
      })
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_APPLICATIONS_USER_ID_CREATED_AT',
        columnNames: ['user_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_APPLICATIONS_STATUS_CREATED_AT',
        columnNames: ['status', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_APPLICATIONS_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'applications',
      new TableIndex({
        name: 'IDX_APPLICATIONS_AUTO_APPLIED',
        columnNames: ['auto_applied'],
      })
    );

    // Create form_mappings table
    await queryRunner.createTable(
      new Table({
        name: 'form_mappings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'ats_platform',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'field_selector',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'field_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'semantic_field',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'field_attributes',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'confidence_score',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'usage_count',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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

    // Create indexes on form_mappings
    await queryRunner.createIndex(
      'form_mappings',
      new TableIndex({
        name: 'IDX_FORM_MAPPINGS_COMPANY_ATS',
        columnNames: ['company_name', 'ats_platform'],
      })
    );

    await queryRunner.createIndex(
      'form_mappings',
      new TableIndex({
        name: 'IDX_FORM_MAPPINGS_ATS_PLATFORM',
        columnNames: ['ats_platform'],
      })
    );

    await queryRunner.createIndex(
      'form_mappings',
      new TableIndex({
        name: 'IDX_FORM_MAPPINGS_SEMANTIC_FIELD',
        columnNames: ['semantic_field'],
      })
    );

    await queryRunner.createIndex(
      'form_mappings',
      new TableIndex({
        name: 'IDX_FORM_MAPPINGS_IS_ACTIVE',
        columnNames: ['is_active'],
      })
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE applications IS 'Job applications submitted by users';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN applications.auto_applied IS 'Whether the application was submitted automatically';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN applications.match_score IS 'AI-calculated match score between user profile and job';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN applications.form_responses IS 'JSON object containing all form field responses';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN applications.error_log IS 'JSON object containing error details if application failed';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE form_mappings IS 'Learned mappings between ATS form fields and semantic user data';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN form_mappings.field_selector IS 'CSS selector or identifier for the form field';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN form_mappings.semantic_field IS 'Semantic meaning of the field (e.g., first_name, email)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN form_mappings.confidence_score IS 'Confidence level in this mapping (1-10)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('form_mappings', 'IDX_FORM_MAPPINGS_IS_ACTIVE');
    await queryRunner.dropIndex('form_mappings', 'IDX_FORM_MAPPINGS_SEMANTIC_FIELD');
    await queryRunner.dropIndex('form_mappings', 'IDX_FORM_MAPPINGS_ATS_PLATFORM');
    await queryRunner.dropIndex('form_mappings', 'IDX_FORM_MAPPINGS_COMPANY_ATS');
    await queryRunner.dropIndex('applications', 'IDX_APPLICATIONS_AUTO_APPLIED');
    await queryRunner.dropIndex('applications', 'IDX_APPLICATIONS_STATUS');
    await queryRunner.dropIndex('applications', 'IDX_APPLICATIONS_STATUS_CREATED_AT');
    await queryRunner.dropIndex('applications', 'IDX_APPLICATIONS_USER_ID_CREATED_AT');
    await queryRunner.dropIndex('applications', 'IDX_APPLICATIONS_JOB_ID');
    await queryRunner.dropIndex('applications', 'IDX_APPLICATIONS_USER_ID');

    // Drop tables
    await queryRunner.dropTable('form_mappings');
    await queryRunner.dropTable('applications');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS application_status`);
  }
}
