import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecruiterTables1734350000000 implements MigrationInterface {
  name = 'CreateRecruiterTables1734350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create recruiter_profiles table
    await queryRunner.query(`
      CREATE TABLE "recruiter_profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL UNIQUE,
        "company_name" varchar(255) NOT NULL,
        "company_website" varchar(500),
        "bio" text,
        "years_of_experience" integer DEFAULT 0 NOT NULL,
        "linkedin_url" varchar(500),
        "certification" varchar(255),
        "certification_url" varchar(500),
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "tier" varchar(50) DEFAULT 'standard' NOT NULL,
        "industries" text,
        "roles" text,
        "regions" text,
        "languages" text,
        "total_placements" integer DEFAULT 0 NOT NULL,
        "successful_placements" integer DEFAULT 0 NOT NULL,
        "active_assignments" integer DEFAULT 0 NOT NULL,
        "total_assignments" integer DEFAULT 0 NOT NULL,
        "success_rate" float DEFAULT 0 NOT NULL,
        "average_time_to_placement" float DEFAULT 0 NOT NULL,
        "average_rating" float DEFAULT 0 NOT NULL,
        "total_reviews" integer DEFAULT 0 NOT NULL,
        "quality_score" float DEFAULT 50 NOT NULL,
        "max_concurrent_assignments" integer DEFAULT 5 NOT NULL,
        "accepting_new_assignments" boolean DEFAULT true NOT NULL,
        "available_hours" text,
        "timezone" varchar(100),
        "placement_fee_percentage" decimal(10,2) DEFAULT 0 NOT NULL,
        "total_revenue" decimal(10,2) DEFAULT 0 NOT NULL,
        "pending_revenue" decimal(10,2) DEFAULT 0 NOT NULL,
        "paid_revenue" decimal(10,2) DEFAULT 0 NOT NULL,
        "stripe_account_id" varchar(255),
        "payouts_enabled" boolean DEFAULT false NOT NULL,
        "is_verified" boolean DEFAULT false NOT NULL,
        "verified_at" timestamp,
        "verified_by" uuid,
        "verification_notes" text,
        "id_document_url" varchar(500),
        "business_license_url" varchar(500),
        "certification_document_url" varchar(500),
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for recruiter_profiles
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_recruiter_profiles_user_id" ON "recruiter_profiles" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_profiles_status_tier" ON "recruiter_profiles" ("status", "tier")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_profiles_quality_score" ON "recruiter_profiles" ("quality_score")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_profiles_status" ON "recruiter_profiles" ("status")`);

    // Create recruiter_assignments table
    await queryRunner.query(`
      CREATE TABLE "recruiter_assignments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "recruiter_id" uuid NOT NULL,
        "status" varchar(50) DEFAULT 'requested' NOT NULL,
        "assignment_type" varchar(50) DEFAULT 'full_service' NOT NULL,
        "priority" varchar(50) DEFAULT 'normal' NOT NULL,
        "user_requirements" text,
        "recruiter_notes" text,
        "target_industries" text,
        "target_roles" text,
        "target_locations" text,
        "target_salary_min" decimal(10,2),
        "target_salary_max" decimal(10,2),
        "salary_currency" varchar(10),
        "accepted_at" timestamp,
        "started_at" timestamp,
        "completed_at" timestamp,
        "deadline" timestamp,
        "applications_submitted" integer DEFAULT 0 NOT NULL,
        "interviews_scheduled" integer DEFAULT 0 NOT NULL,
        "offers_received" integer DEFAULT 0 NOT NULL,
        "progress_percentage" integer DEFAULT 0 NOT NULL,
        "last_activity_at" timestamp,
        "messages_count" integer DEFAULT 0 NOT NULL,
        "last_message_at" timestamp,
        "last_message_by" uuid,
        "agreed_fee" decimal(10,2),
        "fee_currency" varchar(10) DEFAULT 'USD' NOT NULL,
        "platform_fee_percentage" decimal(10,2) DEFAULT 0 NOT NULL,
        "total_revenue" decimal(10,2) DEFAULT 0 NOT NULL,
        "payment_completed" boolean DEFAULT false NOT NULL,
        "payment_completed_at" timestamp,
        "escalated_from_application_id" uuid,
        "escalation_reason" text,
        "is_escalation" boolean DEFAULT false NOT NULL,
        "user_satisfaction" integer,
        "user_feedback" text,
        "feedback_submitted_at" timestamp,
        "cancellation_reason" text,
        "cancelled_by" uuid,
        "cancelled_at" timestamp,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for recruiter_assignments
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_assignments_user_id_status" ON "recruiter_assignments" ("user_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_assignments_recruiter_id_status" ON "recruiter_assignments" ("recruiter_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_assignments_status_created_at" ON "recruiter_assignments" ("status", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_assignments_user_id" ON "recruiter_assignments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_assignments_recruiter_id" ON "recruiter_assignments" ("recruiter_id")`);

    // Create placement_outcomes table
    await queryRunner.query(`
      CREATE TABLE "placement_outcomes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "assignment_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "recruiter_id" uuid NOT NULL,
        "application_id" uuid,
        "company_name" varchar(255) NOT NULL,
        "position_title" varchar(255) NOT NULL,
        "job_location" varchar(255),
        "job_type" varchar(100),
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "interview_date" timestamp,
        "interview_stage" varchar(50),
        "interview_count" integer DEFAULT 0 NOT NULL,
        "interview_notes" text,
        "interview_calendar_link" varchar(500),
        "offered_salary" decimal(12,2),
        "salary_currency" varchar(10),
        "offer_benefits" text,
        "offer_received_at" timestamp,
        "offer_deadline" timestamp,
        "offer_accepted_at" timestamp,
        "start_date" date,
        "placement_fee" decimal(10,2),
        "fee_currency" varchar(10) DEFAULT 'USD' NOT NULL,
        "fee_percentage" decimal(5,2) DEFAULT 0 NOT NULL,
        "recruiter_payout" decimal(10,2) DEFAULT 0 NOT NULL,
        "platform_commission" decimal(10,2) DEFAULT 0 NOT NULL,
        "fee_paid" boolean DEFAULT false NOT NULL,
        "fee_paid_at" timestamp,
        "payment_transaction_id" varchar(255),
        "guarantee_period_days" integer DEFAULT 90 NOT NULL,
        "guarantee_end_date" timestamp,
        "guarantee_claimed" boolean DEFAULT false NOT NULL,
        "guarantee_claim_reason" text,
        "rejection_reason" text,
        "rejected_at" timestamp,
        "withdrawal_reason" text,
        "withdrawn_at" timestamp,
        "company_feedback" text,
        "candidate_feedback" text,
        "days_to_hire" integer,
        "total_interview_rounds" integer,
        "offer_letter_url" varchar(500),
        "contract_url" varchar(500),
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for placement_outcomes
    await queryRunner.query(`CREATE INDEX "IDX_placement_outcomes_assignment_id_status" ON "placement_outcomes" ("assignment_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_placement_outcomes_user_id_status" ON "placement_outcomes" ("user_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_placement_outcomes_status_created_at" ON "placement_outcomes" ("status", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_placement_outcomes_assignment_id" ON "placement_outcomes" ("assignment_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_placement_outcomes_user_id" ON "placement_outcomes" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_placement_outcomes_recruiter_id" ON "placement_outcomes" ("recruiter_id")`);

    // Create recruiter_reviews table
    await queryRunner.query(`
      CREATE TABLE "recruiter_reviews" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "recruiter_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "assignment_id" uuid,
        "rating" integer NOT NULL,
        "communication_rating" integer,
        "professionalism_rating" integer,
        "expertise_rating" integer,
        "responsiveness_rating" integer,
        "review_text" text,
        "review_title" text,
        "pros" text,
        "cons" text,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "is_verified_placement" boolean DEFAULT false NOT NULL,
        "would_recommend" boolean DEFAULT false NOT NULL,
        "helpful_count" integer DEFAULT 0 NOT NULL,
        "not_helpful_count" integer DEFAULT 0 NOT NULL,
        "flag_count" integer DEFAULT 0 NOT NULL,
        "flag_reason" text,
        "moderated_by" uuid,
        "moderated_at" timestamp,
        "moderation_notes" text,
        "recruiter_response" text,
        "recruiter_response_at" timestamp,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for recruiter_reviews
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_reviews_recruiter_id_status" ON "recruiter_reviews" ("recruiter_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_reviews_user_id" ON "recruiter_reviews" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_reviews_rating_created_at" ON "recruiter_reviews" ("rating", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_reviews_recruiter_id" ON "recruiter_reviews" ("recruiter_id")`);

    // Create recruiter_revenue table
    await queryRunner.query(`
      CREATE TABLE "recruiter_revenue" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "recruiter_id" uuid NOT NULL,
        "placement_id" uuid,
        "assignment_id" uuid,
        "revenue_type" varchar(50) DEFAULT 'placement_fee' NOT NULL,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "gross_amount" decimal(12,2) NOT NULL,
        "platform_commission" decimal(10,2) NOT NULL,
        "platform_commission_rate" decimal(5,2) NOT NULL,
        "net_amount" decimal(10,2) NOT NULL,
        "currency" varchar(10) DEFAULT 'USD' NOT NULL,
        "payment_method" varchar(255),
        "transaction_id" varchar(255),
        "stripe_transfer_id" varchar(255),
        "paid_at" timestamp,
        "expected_payout_date" timestamp,
        "tax_withheld" decimal(10,2) DEFAULT 0 NOT NULL,
        "tax_form_type" varchar(100),
        "tax_form_submitted" boolean DEFAULT false NOT NULL,
        "description" text,
        "notes" text,
        "refund_for_revenue_id" uuid,
        "refund_reason" text,
        "refunded_at" timestamp,
        "dispute_reason" text,
        "disputed_at" timestamp,
        "disputed_by" uuid,
        "dispute_resolution" text,
        "dispute_resolved_at" timestamp,
        "invoice_number" varchar(100),
        "invoice_url" varchar(500),
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for recruiter_revenue
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_revenue_recruiter_id_status" ON "recruiter_revenue" ("recruiter_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_revenue_placement_id" ON "recruiter_revenue" ("placement_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_revenue_created_at" ON "recruiter_revenue" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_recruiter_revenue_recruiter_id" ON "recruiter_revenue" ("recruiter_id")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "recruiter_assignments"
      ADD CONSTRAINT "FK_recruiter_assignments_recruiter"
      FOREIGN KEY ("recruiter_id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "placement_outcomes"
      ADD CONSTRAINT "FK_placement_outcomes_assignment"
      FOREIGN KEY ("assignment_id") REFERENCES "recruiter_assignments"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "recruiter_reviews"
      ADD CONSTRAINT "FK_recruiter_reviews_recruiter"
      FOREIGN KEY ("recruiter_id") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "recruiter_reviews" DROP CONSTRAINT "FK_recruiter_reviews_recruiter"`);
    await queryRunner.query(`ALTER TABLE "placement_outcomes" DROP CONSTRAINT "FK_placement_outcomes_assignment"`);
    await queryRunner.query(`ALTER TABLE "recruiter_assignments" DROP CONSTRAINT "FK_recruiter_assignments_recruiter"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_recruiter_revenue_recruiter_id"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_revenue_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_revenue_placement_id"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_revenue_recruiter_id_status"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_reviews_recruiter_id"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_reviews_rating_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_reviews_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_reviews_recruiter_id_status"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_outcomes_recruiter_id"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_outcomes_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_outcomes_assignment_id"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_outcomes_status_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_outcomes_user_id_status"`);
    await queryRunner.query(`DROP INDEX "IDX_placement_outcomes_assignment_id_status"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_assignments_recruiter_id"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_assignments_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_assignments_status_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_assignments_recruiter_id_status"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_assignments_user_id_status"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_profiles_status"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_profiles_quality_score"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_profiles_status_tier"`);
    await queryRunner.query(`DROP INDEX "IDX_recruiter_profiles_user_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "recruiter_revenue"`);
    await queryRunner.query(`DROP TABLE "recruiter_reviews"`);
    await queryRunner.query(`DROP TABLE "placement_outcomes"`);
    await queryRunner.query(`DROP TABLE "recruiter_assignments"`);
    await queryRunner.query(`DROP TABLE "recruiter_profiles"`);
  }
}
