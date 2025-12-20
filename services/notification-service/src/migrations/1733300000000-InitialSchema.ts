import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1733300000000 implements MigrationInterface {
  name = 'InitialSchema1733300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM ('email', 'push', 'sms', 'in_app');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'read');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['email', 'push', 'sms', 'in_app'],
            default: "'in_app'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'failed', 'read'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'urgent'],
            default: "'medium'",
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'action_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'read_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'failed_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'expires_at',
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
      true,
    );

    // Create indexes on notifications
    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_USER_ID_CREATED_AT',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_STATUS_CREATED_AT',
        columnNames: ['status', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_PRIORITY',
        columnNames: ['priority'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_CATEGORY',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_IS_READ',
        columnNames: ['is_read'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_NOTIFICATIONS_EXPIRES_AT',
        columnNames: ['expires_at'],
      }),
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE notifications IS 'User notifications across multiple channels';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN notifications.type IS 'Delivery channel for the notification';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN notifications.status IS 'Current status of the notification delivery';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN notifications.priority IS 'Priority level affecting delivery order';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN notifications.data IS 'Additional structured data for the notification';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN notifications.retry_count IS 'Number of delivery retry attempts';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN notifications.expires_at IS 'When the notification should be automatically removed';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex(
      'notifications',
      'IDX_NOTIFICATIONS_EXPIRES_AT',
    );
    await queryRunner.dropIndex('notifications', 'IDX_NOTIFICATIONS_IS_READ');
    await queryRunner.dropIndex('notifications', 'IDX_NOTIFICATIONS_CATEGORY');
    await queryRunner.dropIndex('notifications', 'IDX_NOTIFICATIONS_PRIORITY');
    await queryRunner.dropIndex('notifications', 'IDX_NOTIFICATIONS_TYPE');
    await queryRunner.dropIndex(
      'notifications',
      'IDX_NOTIFICATIONS_STATUS_CREATED_AT',
    );
    await queryRunner.dropIndex(
      'notifications',
      'IDX_NOTIFICATIONS_USER_ID_CREATED_AT',
    );
    await queryRunner.dropIndex('notifications', 'IDX_NOTIFICATIONS_STATUS');
    await queryRunner.dropIndex('notifications', 'IDX_NOTIFICATIONS_USER_ID');

    // Drop table
    await queryRunner.dropTable('notifications');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS notification_priority`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_type`);
  }
}
