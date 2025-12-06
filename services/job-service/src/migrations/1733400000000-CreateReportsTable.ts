import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateReportsTable1733400000000 implements MigrationInterface {
  name = 'CreateReportsTable1733400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for reports
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE report_type AS ENUM ('spam', 'expired', 'misleading', 'duplicate', 'inappropriate', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create job_reports table
    await queryRunner.createTable(
      new Table({
        name: 'job_reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'report_type',
            type: 'enum',
            enum: ['spam', 'expired', 'misleading', 'duplicate', 'inappropriate', 'other'],
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'resolved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resolved_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'resolution_notes',
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

    // Create indexes on job_reports
    await queryRunner.createIndex(
      'job_reports',
      new TableIndex({
        name: 'IDX_JOB_REPORTS_JOB_ID',
        columnNames: ['job_id'],
      })
    );

    await queryRunner.createIndex(
      'job_reports',
      new TableIndex({
        name: 'IDX_JOB_REPORTS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'job_reports',
      new TableIndex({
        name: 'IDX_JOB_REPORTS_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'job_reports',
      new TableIndex({
        name: 'IDX_JOB_REPORTS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'job_reports',
      new TableIndex({
        name: 'IDX_JOB_REPORTS_REPORT_TYPE',
        columnNames: ['report_type'],
      })
    );

    // Create unique index to prevent duplicate reports from same user for same job
    await queryRunner.createIndex(
      'job_reports',
      new TableIndex({
        name: 'IDX_JOB_REPORTS_USER_JOB_UNIQUE',
        columnNames: ['user_id', 'job_id'],
        isUnique: true,
      })
    );

    // Add foreign key for job_reports -> jobs
    await queryRunner.createForeignKey(
      'job_reports',
      new TableForeignKey({
        name: 'FK_JOB_REPORTS_JOB',
        columnNames: ['job_id'],
        referencedTableName: 'jobs',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add comment
    await queryRunner.query(`
      COMMENT ON TABLE job_reports IS 'User reports for job postings';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN job_reports.report_type IS 'Type of report (spam, expired, misleading, etc.)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN job_reports.status IS 'Current status of the report (pending, reviewed, resolved, dismissed)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('job_reports', 'FK_JOB_REPORTS_JOB');

    // Drop indexes
    await queryRunner.dropIndex('job_reports', 'IDX_JOB_REPORTS_USER_JOB_UNIQUE');
    await queryRunner.dropIndex('job_reports', 'IDX_JOB_REPORTS_REPORT_TYPE');
    await queryRunner.dropIndex('job_reports', 'IDX_JOB_REPORTS_CREATED_AT');
    await queryRunner.dropIndex('job_reports', 'IDX_JOB_REPORTS_STATUS');
    await queryRunner.dropIndex('job_reports', 'IDX_JOB_REPORTS_USER_ID');
    await queryRunner.dropIndex('job_reports', 'IDX_JOB_REPORTS_JOB_ID');

    // Drop table
    await queryRunner.dropTable('job_reports');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS report_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS report_type`);
  }
}
