import { TableColumn, Table, TableIndex, TableForeignKey } from 'typeorm';

import type { MigrationInterface, QueryRunner} from 'typeorm';

export class AddSubscriptionAndAITracking1733280000000 implements MigrationInterface {
  name = 'AddSubscriptionAndAITracking1733280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription_tier enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create generation_type enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE generation_type AS ENUM (
          'summary',
          'bullets',
          'cover_letter',
          'ats_score',
          'job_match',
          'interview_questions'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add subscription and tracking columns to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'subscription_tier',
        type: 'enum',
        enum: ['free', 'pro', 'premium', 'enterprise'],
        default: "'free'",
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'subscription_expires_at',
        type: 'timestamp with time zone',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verified_at',
        type: 'timestamp with time zone',
        isNullable: true,
      })
    );

    // Create indexes on new user columns
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_SUBSCRIPTION_TIER',
        columnNames: ['subscription_tier'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_SUBSCRIPTION_EXPIRES_AT',
        columnNames: ['subscription_expires_at'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL_VERIFIED_AT',
        columnNames: ['email_verified_at'],
      })
    );

    // Create ai_generations table
    await queryRunner.createTable(
      new Table({
        name: 'ai_generations',
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
            name: 'generation_type',
            type: 'enum',
            enum: [
              'summary',
              'bullets',
              'cover_letter',
              'ats_score',
              'job_match',
              'interview_questions',
            ],
            isNullable: false,
          },
          {
            name: 'input_data',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'output_data',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'model_used',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'tokens_used',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'latency_ms',
            type: 'integer',
            isNullable: false,
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

    // Create indexes on ai_generations table
    await queryRunner.createIndex(
      'ai_generations',
      new TableIndex({
        name: 'IDX_AI_GENERATIONS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'ai_generations',
      new TableIndex({
        name: 'IDX_AI_GENERATIONS_TYPE',
        columnNames: ['generation_type'],
      })
    );

    await queryRunner.createIndex(
      'ai_generations',
      new TableIndex({
        name: 'IDX_AI_GENERATIONS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'ai_generations',
      new TableIndex({
        name: 'IDX_AI_GENERATIONS_MODEL_USED',
        columnNames: ['model_used'],
      })
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'ai_generations',
      new TableForeignKey({
        name: 'FK_AI_GENERATIONS_USER',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add comment to table
    await queryRunner.query(`
      COMMENT ON TABLE ai_generations IS 'Tracks AI generation usage for billing and analytics';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN ai_generations.generation_type IS 'Type of AI generation performed';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN ai_generations.tokens_used IS 'Number of tokens consumed by the generation';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN ai_generations.latency_ms IS 'Latency of the AI generation in milliseconds';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('ai_generations', 'FK_AI_GENERATIONS_USER');

    // Drop indexes on ai_generations
    await queryRunner.dropIndex('ai_generations', 'IDX_AI_GENERATIONS_MODEL_USED');
    await queryRunner.dropIndex('ai_generations', 'IDX_AI_GENERATIONS_CREATED_AT');
    await queryRunner.dropIndex('ai_generations', 'IDX_AI_GENERATIONS_TYPE');
    await queryRunner.dropIndex('ai_generations', 'IDX_AI_GENERATIONS_USER_ID');

    // Drop ai_generations table
    await queryRunner.dropTable('ai_generations');

    // Drop indexes on users
    await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL_VERIFIED_AT');
    await queryRunner.dropIndex('users', 'IDX_USERS_SUBSCRIPTION_EXPIRES_AT');
    await queryRunner.dropIndex('users', 'IDX_USERS_SUBSCRIPTION_TIER');

    // Drop columns from users table
    await queryRunner.dropColumn('users', 'email_verified_at');
    await queryRunner.dropColumn('users', 'subscription_expires_at');
    await queryRunner.dropColumn('users', 'subscription_tier');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS generation_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_tier`);
  }
}
