import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1733290000000 implements MigrationInterface {
  name = 'InitialSchema1733290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying(255) NOT NULL,
        "stripeCustomerId" character varying(255),
        "stripeSubscriptionId" character varying(255),
        "tier" character varying NOT NULL DEFAULT 'FREE',
        "status" character varying NOT NULL DEFAULT 'active',
        "currentPeriodStart" TIMESTAMP,
        "currentPeriodEnd" TIMESTAMP,
        "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false,
        "canceledAt" TIMESTAMP,
        "trialStart" TIMESTAMP,
        "trialEnd" TIMESTAMP,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stripe_subscription_id" UNIQUE ("stripeSubscriptionId"),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for subscriptions
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_userId" ON "subscriptions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_stripeCustomerId" ON "subscriptions" ("stripeCustomerId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_subscriptions_stripeSubscriptionId" ON "subscriptions" ("stripeSubscriptionId")`,
    );

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscriptionId" uuid NOT NULL,
        "stripeInvoiceId" character varying(255) NOT NULL,
        "stripeCustomerId" character varying(255) NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'usd',
        "status" character varying NOT NULL DEFAULT 'draft',
        "paidAt" TIMESTAMP,
        "invoiceUrl" character varying(500),
        "invoicePdfUrl" character varying(500),
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stripe_invoice_id" UNIQUE ("stripeInvoiceId"),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for invoices
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_subscriptionId" ON "invoices" ("subscriptionId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_invoices_stripeInvoiceId" ON "invoices" ("stripeInvoiceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_stripeCustomerId" ON "invoices" ("stripeCustomerId")`,
    );

    // Create foreign key relationship
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD CONSTRAINT "FK_invoices_subscriptionId"
      FOREIGN KEY ("subscriptionId")
      REFERENCES "subscriptions"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_subscriptionId"`,
    );

    // Drop invoices table and indexes
    await queryRunner.query(`DROP INDEX "IDX_invoices_stripeCustomerId"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_stripeInvoiceId"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_subscriptionId"`);
    await queryRunner.query(`DROP TABLE "invoices"`);

    // Drop subscriptions table and indexes
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_stripeSubscriptionId"`);
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_stripeCustomerId"`);
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_userId"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
  }
}
