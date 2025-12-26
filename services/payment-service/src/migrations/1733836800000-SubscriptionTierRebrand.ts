import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Subscription Tier Rebrand
 *
 * Renames subscription tiers from old naming to new 2025 rebrand:
 * - FREE -> FREEMIUM
 * - STARTER -> STARTER (unchanged)
 * - BASIC -> BASIC (unchanged)
 * - PRO -> PROFESSIONAL
 * - BUSINESS -> ADVANCED_CAREER
 * - ENTERPRISE -> EXECUTIVE_ELITE
 *
 * Note: The tier column is varchar, not an enum type.
 */
export class SubscriptionTierRebrand1733836800000 implements MigrationInterface {
  name = 'SubscriptionTierRebrand1733836800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The tier column is varchar (not enum), so we just update values directly

    // Step 1: Migrate existing subscriptions to new tier names
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'FREEMIUM' WHERE tier = 'FREE';
    `);
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'PROFESSIONAL' WHERE tier = 'PRO';
    `);
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'ADVANCED_CAREER' WHERE tier = 'BUSINESS';
    `);
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'EXECUTIVE_ELITE' WHERE tier = 'ENTERPRISE';
    `);

    // Step 2: Update default value for new subscriptions
    await queryRunner.query(`
      ALTER TABLE subscriptions ALTER COLUMN tier SET DEFAULT 'FREEMIUM';
    `);

    // Step 3: Create migration_audit table if it doesn't exist and log
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS migration_audit (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        details TEXT,
        CONSTRAINT uq_migration_name UNIQUE (migration_name)
      );
    `);
    await queryRunner.query(`
      INSERT INTO migration_audit (migration_name, executed_at, details)
      VALUES (
        'SubscriptionTierRebrand1733836800000',
        NOW(),
        'Rebranded subscription tiers: FREE->FREEMIUM, PRO->PROFESSIONAL, BUSINESS->ADVANCED_CAREER, ENTERPRISE->EXECUTIVE_ELITE'
      )
      ON CONFLICT (migration_name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert tier names back to old values
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'FREE' WHERE tier = 'FREEMIUM';
    `);
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'PRO' WHERE tier = 'PROFESSIONAL';
    `);
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'BUSINESS' WHERE tier = 'ADVANCED_CAREER';
    `);
    await queryRunner.query(`
      UPDATE subscriptions SET tier = 'ENTERPRISE' WHERE tier = 'EXECUTIVE_ELITE';
    `);

    // Reset default
    await queryRunner.query(`
      ALTER TABLE subscriptions ALTER COLUMN tier SET DEFAULT 'FREE';
    `);
  }
}
