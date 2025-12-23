import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddWebhookTables1734950000000 implements MigrationInterface {
  name = 'AddWebhookTables1734950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create webhook_subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'webhook_subscriptions',
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
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '2048',
            isNullable: false,
          },
          {
            name: 'secret',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'events',
            type: 'text',
            isNullable: false,
            default: "''",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'headers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'failure_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'last_triggered_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'last_success_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'last_failure_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'last_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'max_retries',
            type: 'integer',
            default: 3,
          },
          {
            name: 'timeout_ms',
            type: 'integer',
            default: 30000,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for webhook_subscriptions
    await queryRunner.createIndex(
      'webhook_subscriptions',
      new TableIndex({
        name: 'IDX_webhook_subscriptions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'webhook_subscriptions',
      new TableIndex({
        name: 'IDX_webhook_subscriptions_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'webhook_subscriptions',
      new TableIndex({
        name: 'IDX_webhook_subscriptions_status',
        columnNames: ['status'],
      }),
    );

    // Create webhook_deliveries table
    await queryRunner.createTable(
      new Table({
        name: 'webhook_deliveries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'subscription_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'response_status_code',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'response_body',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'response_time_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'attempt_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'next_retry_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'request_headers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'idempotency_key',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for webhook_deliveries
    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_subscription_id',
        columnNames: ['subscription_id'],
      }),
    );

    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_event_type',
        columnNames: ['event_type'],
      }),
    );

    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_idempotency_key',
        columnNames: ['idempotency_key'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'webhook_deliveries',
      new TableIndex({
        name: 'IDX_webhook_deliveries_next_retry_at',
        columnNames: ['next_retry_at'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'webhook_deliveries',
      new TableForeignKey({
        name: 'FK_webhook_deliveries_subscription',
        columnNames: ['subscription_id'],
        referencedTableName: 'webhook_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('webhook_deliveries', 'FK_webhook_deliveries_subscription');

    // Drop webhook_deliveries indexes
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_next_retry_at');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_idempotency_key');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_status');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_event_type');
    await queryRunner.dropIndex('webhook_deliveries', 'IDX_webhook_deliveries_subscription_id');

    // Drop webhook_subscriptions indexes
    await queryRunner.dropIndex('webhook_subscriptions', 'IDX_webhook_subscriptions_status');
    await queryRunner.dropIndex('webhook_subscriptions', 'IDX_webhook_subscriptions_tenant_id');
    await queryRunner.dropIndex('webhook_subscriptions', 'IDX_webhook_subscriptions_user_id');

    // Drop tables
    await queryRunner.dropTable('webhook_deliveries');
    await queryRunner.dropTable('webhook_subscriptions');
  }
}
