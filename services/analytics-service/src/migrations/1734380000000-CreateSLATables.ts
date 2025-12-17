import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSLATables1734380000000 implements MigrationInterface {
  name = 'CreateSLATables1734380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sla_contracts table
    await queryRunner.query(`
      CREATE TABLE "sla_contracts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "tier" varchar(50) NOT NULL,
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "guaranteedInterviews" integer NOT NULL,
        "deadlineDays" integer NOT NULL,
        "minConfidenceThreshold" decimal(3,2) NOT NULL,
        "contractPrice" decimal(10,2) NOT NULL,
        "startDate" timestamp NOT NULL,
        "endDate" timestamp NOT NULL,
        "pausedAt" timestamp,
        "completedAt" timestamp,
        "cancelledAt" timestamp,
        "extensionDays" integer DEFAULT 0 NOT NULL,
        "extendedEndDate" timestamp,
        "stripePaymentIntentId" varchar(255),
        "stripeSubscriptionId" varchar(255),
        "isPaid" boolean DEFAULT false NOT NULL,
        "paidAt" timestamp,
        "isEligible" boolean DEFAULT true NOT NULL,
        "eligibilityCheckResult" jsonb,
        "totalApplicationsSent" integer DEFAULT 0 NOT NULL,
        "totalEmployerResponses" integer DEFAULT 0 NOT NULL,
        "totalInterviewsScheduled" integer DEFAULT 0 NOT NULL,
        "totalInterviewsCompleted" integer DEFAULT 0 NOT NULL,
        "totalOffersReceived" integer DEFAULT 0 NOT NULL,
        "metadata" jsonb,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for sla_contracts
    await queryRunner.query(`CREATE INDEX "IDX_sla_contracts_userId" ON "sla_contracts" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_contracts_tier" ON "sla_contracts" ("tier")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_contracts_status" ON "sla_contracts" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_contracts_endDate" ON "sla_contracts" ("endDate")`);

    // Create sla_progress table
    await queryRunner.query(`
      CREATE TABLE "sla_progress" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "contractId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "eventType" varchar(50) NOT NULL,
        "applicationId" uuid,
        "jobId" uuid,
        "jobTitle" varchar(500),
        "companyName" varchar(500),
        "confidenceScore" decimal(3,2),
        "meetsConfidenceThreshold" boolean DEFAULT true NOT NULL,
        "interviewScheduledAt" timestamp,
        "interviewType" varchar(100),
        "interviewLocation" varchar(255),
        "responseContent" text,
        "responseType" varchar(100),
        "isVerified" boolean DEFAULT false NOT NULL,
        "verifiedAt" timestamp,
        "verifiedBy" varchar(255),
        "source" varchar(100),
        "sourceReference" varchar(255),
        "metadata" jsonb,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for sla_progress
    await queryRunner.query(`CREATE INDEX "IDX_sla_progress_contractId" ON "sla_progress" ("contractId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_progress_userId" ON "sla_progress" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_progress_eventType" ON "sla_progress" ("eventType")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_progress_createdAt" ON "sla_progress" ("createdAt")`);

    // Create sla_violations table
    await queryRunner.query(`
      CREATE TABLE "sla_violations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "contractId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "violationType" varchar(50) NOT NULL,
        "detectedAt" timestamp NOT NULL,
        "guaranteedInterviews" integer NOT NULL,
        "actualInterviews" integer NOT NULL,
        "interviewsShortfall" integer NOT NULL,
        "daysOverDeadline" integer,
        "totalApplicationsSent" integer NOT NULL,
        "totalEmployerResponses" integer NOT NULL,
        "responseRate" decimal(5,2) NOT NULL,
        "interviewRate" decimal(5,2) NOT NULL,
        "analysisNotes" text,
        "rootCauseFactors" jsonb,
        "isEscalated" boolean DEFAULT false NOT NULL,
        "escalatedAt" timestamp,
        "escalatedTo" varchar(255),
        "escalationTicketId" varchar(255),
        "isResolved" boolean DEFAULT false NOT NULL,
        "resolvedAt" timestamp,
        "resolutionNotes" text,
        "userNotified" boolean DEFAULT false NOT NULL,
        "userNotifiedAt" timestamp,
        "notificationDetails" jsonb,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for sla_violations
    await queryRunner.query(`CREATE INDEX "IDX_sla_violations_contractId" ON "sla_violations" ("contractId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_violations_userId" ON "sla_violations" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_violations_violationType" ON "sla_violations" ("violationType")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_violations_detectedAt" ON "sla_violations" ("detectedAt")`);

    // Create sla_remedies table
    await queryRunner.query(`
      CREATE TABLE "sla_remedies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "violationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "contractId" uuid NOT NULL,
        "remedyType" varchar(50) NOT NULL,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "description" text,
        "remedyDetails" jsonb,
        "issuedAt" timestamp,
        "issuedBy" varchar(255),
        "executedAt" timestamp,
        "executedBy" varchar(255),
        "completedAt" timestamp,
        "failedAt" timestamp,
        "failureReason" text,
        "requiresApproval" boolean DEFAULT false NOT NULL,
        "isApproved" boolean DEFAULT false NOT NULL,
        "approvedAt" timestamp,
        "approvedBy" varchar(255),
        "approvalNotes" text,
        "financialImpact" decimal(10,2),
        "currency" varchar(10) DEFAULT 'USD' NOT NULL,
        "userNotified" boolean DEFAULT false NOT NULL,
        "userNotifiedAt" timestamp,
        "userAcknowledged" boolean DEFAULT false NOT NULL,
        "userAcknowledgedAt" timestamp,
        "executionLog" jsonb,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for sla_remedies
    await queryRunner.query(`CREATE INDEX "IDX_sla_remedies_violationId" ON "sla_remedies" ("violationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_remedies_userId" ON "sla_remedies" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_remedies_remedyType" ON "sla_remedies" ("remedyType")`);
    await queryRunner.query(`CREATE INDEX "IDX_sla_remedies_status" ON "sla_remedies" ("status")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "sla_progress"
      ADD CONSTRAINT "FK_sla_progress_contract"
      FOREIGN KEY ("contractId") REFERENCES "sla_contracts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sla_violations"
      ADD CONSTRAINT "FK_sla_violations_contract"
      FOREIGN KEY ("contractId") REFERENCES "sla_contracts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sla_remedies"
      ADD CONSTRAINT "FK_sla_remedies_violation"
      FOREIGN KEY ("violationId") REFERENCES "sla_violations"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "sla_remedies" DROP CONSTRAINT "FK_sla_remedies_violation"`);
    await queryRunner.query(`ALTER TABLE "sla_violations" DROP CONSTRAINT "FK_sla_violations_contract"`);
    await queryRunner.query(`ALTER TABLE "sla_progress" DROP CONSTRAINT "FK_sla_progress_contract"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_sla_remedies_status"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_remedies_remedyType"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_remedies_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_remedies_violationId"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_violations_detectedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_violations_violationType"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_violations_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_violations_contractId"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_progress_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_progress_eventType"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_progress_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_progress_contractId"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_contracts_endDate"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_contracts_status"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_contracts_tier"`);
    await queryRunner.query(`DROP INDEX "IDX_sla_contracts_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "sla_remedies"`);
    await queryRunner.query(`DROP TABLE "sla_violations"`);
    await queryRunner.query(`DROP TABLE "sla_progress"`);
    await queryRunner.query(`DROP TABLE "sla_contracts"`);
  }
}
