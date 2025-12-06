import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddDeviceTokens1733500000000 implements MigrationInterface {
  name = 'AddDeviceTokens1733500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for device platform and status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE device_status AS ENUM ('active', 'inactive', 'invalid');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create device_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'device_tokens',
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
            name: 'token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'enum',
            enum: ['ios', 'android', 'web'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'invalid'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'device_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'device_model',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'os_version',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'app_version',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'language',
            type: 'varchar',
            length: '10',
            default: "'en'",
            isNullable: false,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'invalid_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'invalid_reason',
            type: 'text',
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

    // Create indexes on device_tokens
    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_TOKEN',
        columnNames: ['token'],
      })
    );

    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_PLATFORM',
        columnNames: ['platform'],
      })
    );

    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_USER_ID_PLATFORM',
        columnNames: ['user_id', 'platform'],
      })
    );

    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_LAST_USED_AT',
        columnNames: ['last_used_at'],
      })
    );

    // Create unique constraint on token and platform
    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'UQ_DEVICE_TOKENS_TOKEN_PLATFORM',
        columnNames: ['token', 'platform'],
        isUnique: true,
      })
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE device_tokens IS 'Device tokens for push notifications (FCM/APNs)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN device_tokens.token IS 'FCM or APNs device token for push notifications';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN device_tokens.platform IS 'Device platform (ios, android, web)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN device_tokens.status IS 'Token status (active, inactive, invalid)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN device_tokens.metadata IS 'Additional device metadata in JSON format';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN device_tokens.last_used_at IS 'Last time this token was used to send a notification';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN device_tokens.invalid_at IS 'When this token was marked as invalid';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN device_tokens.invalid_reason IS 'Reason why token was marked as invalid';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('device_tokens', 'UQ_DEVICE_TOKENS_TOKEN_PLATFORM');
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_LAST_USED_AT');
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_USER_ID_PLATFORM');
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_STATUS');
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_PLATFORM');
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_TOKEN');
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_USER_ID');

    // Drop table
    await queryRunner.dropTable('device_tokens');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS device_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS device_platform`);
  }
}
