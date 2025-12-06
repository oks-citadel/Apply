import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddNotificationPreferences1733400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification_preferences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'email_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_welcome',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_verification',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_password_reset',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_application_status',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_job_alerts',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_weekly_digest',
            type: 'boolean',
            default: true,
          },
          {
            name: 'email_marketing',
            type: 'boolean',
            default: false,
          },
          {
            name: 'push_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'push_application_status',
            type: 'boolean',
            default: true,
          },
          {
            name: 'push_job_alerts',
            type: 'boolean',
            default: true,
          },
          {
            name: 'push_messages',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sms_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sms_application_status',
            type: 'boolean',
            default: false,
          },
          {
            name: 'digest_frequency',
            type: 'varchar',
            default: "'immediate'",
          },
          {
            name: 'quiet_hours_start',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'quiet_hours_end',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            default: "'UTC'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique index on user_id
    await queryRunner.createIndex(
      'notification_preferences',
      new TableIndex({
        name: 'IDX_notification_preferences_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification_preferences');
  }
}
