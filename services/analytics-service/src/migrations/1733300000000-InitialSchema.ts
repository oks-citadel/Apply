import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1733300000000 implements MigrationInterface {
  name = 'InitialSchema1733300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE event_type AS ENUM (
          'page_view',
          'application_submitted',
          'application_viewed',
          'application_accepted',
          'application_rejected',
          'job_searched',
          'job_viewed',
          'job_saved',
          'resume_generated',
          'cover_letter_generated',
          'ai_suggestion_used',
          'user_registered',
          'user_login',
          'profile_updated',
          'export_data',
          'error_occurred'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE event_category AS ENUM ('user', 'application', 'job', 'ai', 'system');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create analytics_events table
    await queryRunner.createTable(
      new Table({
        name: 'analytics_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'eventType',
            type: 'enum',
            enum: [
              'page_view',
              'application_submitted',
              'application_viewed',
              'application_accepted',
              'application_rejected',
              'job_searched',
              'job_viewed',
              'job_saved',
              'resume_generated',
              'cover_letter_generated',
              'ai_suggestion_used',
              'user_registered',
              'user_login',
              'profile_updated',
              'export_data',
              'error_occurred',
            ],
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['user', 'application', 'job', 'ai', 'system'],
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'applicationId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'jobId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'referrer',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'count',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'duration',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'isSuccessful',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'eventDate',
            type: 'date',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes on analytics_events
    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_EVENT_TYPE',
        columnNames: ['eventType'],
      })
    );

    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_CATEGORY',
        columnNames: ['category'],
      })
    );

    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_USER_ID',
        columnNames: ['userId'],
      })
    );

    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_TIMESTAMP',
        columnNames: ['timestamp'],
      })
    );

    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_EVENT_DATE',
        columnNames: ['eventDate'],
      })
    );

    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_EVENT_TYPE_TIMESTAMP',
        columnNames: ['eventType', 'timestamp'],
      })
    );

    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_USER_ID_TIMESTAMP',
        columnNames: ['userId', 'timestamp'],
      })
    );

    await queryRunner.createIndex(
      'analytics_events',
      new TableIndex({
        name: 'IDX_ANALYTICS_EVENTS_CATEGORY_TIMESTAMP',
        columnNames: ['category', 'timestamp'],
      })
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE analytics_events IS 'Analytics events tracking user behavior and system performance';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN analytics_events."eventType" IS 'Type of event being tracked';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN analytics_events."category" IS 'Category of the event for grouping and filtering';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN analytics_events."duration" IS 'Duration of the event in milliseconds';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN analytics_events."eventDate" IS 'Date for efficient date-based aggregation queries';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_CATEGORY_TIMESTAMP');
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_USER_ID_TIMESTAMP');
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_EVENT_TYPE_TIMESTAMP');
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_EVENT_DATE');
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_TIMESTAMP');
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_USER_ID');
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_CATEGORY');
    await queryRunner.dropIndex('analytics_events', 'IDX_ANALYTICS_EVENTS_EVENT_TYPE');

    // Drop table
    await queryRunner.dropTable('analytics_events');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS event_category`);
    await queryRunner.query(`DROP TYPE IF EXISTS event_type`);
  }
}
