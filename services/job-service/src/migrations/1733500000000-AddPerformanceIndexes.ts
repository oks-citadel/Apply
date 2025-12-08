import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add performance-optimized indexes for Job and SavedJob tables
 * These indexes are based on common query patterns in the application
 */
export class AddPerformanceIndexes1733500000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1733500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite indexes for common query patterns on jobs table

    // Index for active jobs sorted by posted date (most common query)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_active_posted_at"
      ON "jobs" ("is_active", "posted_at" DESC)
      WHERE "is_active" = true;
    `);

    // Index for job search by location and remote type
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_location_remote"
      ON "jobs" ("location", "remote_type", "is_active")
      WHERE "is_active" = true;
    `);

    // Index for salary range queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_salary_range"
      ON "jobs" ("salary_min", "salary_max", "is_active")
      WHERE "is_active" = true AND "salary_min" IS NOT NULL;
    `);

    // Index for experience level filtering
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_experience_active"
      ON "jobs" ("experience_level", "is_active", "posted_at" DESC)
      WHERE "is_active" = true;
    `);

    // Index for employment type filtering
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_employment_active"
      ON "jobs" ("employment_type", "is_active", "posted_at" DESC)
      WHERE "is_active" = true;
    `);

    // GIN index for full-text search on title and description
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_fulltext_search"
      ON "jobs" USING GIN (
        to_tsvector('english',
          COALESCE("title", '') || ' ' ||
          COALESCE("description", '') || ' ' ||
          COALESCE("company_name", '')
        )
      );
    `);

    // GIN index for array fields (skills, requirements, benefits, tags)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_skills_gin"
      ON "jobs" USING GIN ("skills");
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_requirements_gin"
      ON "jobs" USING GIN ("requirements");
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_tags_gin"
      ON "jobs" USING GIN ("tags");
    `);

    // Composite index for featured and verified jobs
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_featured_verified"
      ON "jobs" ("is_featured", "is_verified", "is_active", "posted_at" DESC)
      WHERE "is_active" = true;
    `);

    // Index for popular jobs (by view count, save count, application count)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_popularity"
      ON "jobs" ("view_count" DESC, "application_count" DESC, "save_count" DESC)
      WHERE "is_active" = true;
    `);

    // Add indexes for saved_jobs table

    // Composite index for user saved jobs
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_saved_jobs_user_created"
      ON "saved_jobs" ("user_id", "created_at" DESC);
    `);

    // Index for saved jobs by status
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_saved_jobs_user_status"
      ON "saved_jobs" ("user_id", "status", "created_at" DESC);
    `);

    // Index for applied jobs
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_saved_jobs_applied"
      ON "saved_jobs" ("user_id", "applied_at" DESC)
      WHERE "applied_at" IS NOT NULL;
    `);

    // Add BRIN index for time-series data (created_at, updated_at)
    // BRIN indexes are very space-efficient for sequential data
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_created_at_brin"
      ON "jobs" USING BRIN ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_updated_at_brin"
      ON "jobs" USING BRIN ("updated_at");
    `);

    // Add partial index for expired jobs (for cleanup queries)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_expired"
      ON "jobs" ("expires_at")
      WHERE "expires_at" IS NOT NULL AND "expires_at" < NOW();
    `);

    // Create materialized view for job statistics (for analytics)
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS "job_statistics" AS
      SELECT
        DATE_TRUNC('day', "posted_at") as date,
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE "is_active" = true) as active_jobs,
        COUNT(*) FILTER (WHERE "is_featured" = true) as featured_jobs,
        AVG("view_count") as avg_views,
        AVG("application_count") as avg_applications,
        AVG("save_count") as avg_saves
      FROM "jobs"
      WHERE "posted_at" >= NOW() - INTERVAL '90 days'
      GROUP BY DATE_TRUNC('day', "posted_at");
    `);

    // Create index on materialized view
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_job_statistics_date"
      ON "job_statistics" ("date" DESC);
    `);

    // Create function to refresh materialized view
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION refresh_job_statistics()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY "job_statistics";
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Analyze tables to update statistics
    await queryRunner.query(`ANALYZE "jobs";`);
    await queryRunner.query(`ANALYZE "saved_jobs";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_expired";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_updated_at_brin";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_created_at_brin";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_saved_jobs_applied";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_saved_jobs_user_status";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_saved_jobs_user_created";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_popularity";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_featured_verified";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_tags_gin";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_requirements_gin";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_skills_gin";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_fulltext_search";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_employment_active";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_experience_active";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_salary_range";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_location_remote";`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_jobs_active_posted_at";`);

    // Drop materialized view and related objects
    await queryRunner.query(`DROP FUNCTION IF EXISTS refresh_job_statistics();`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_job_statistics_date";`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "job_statistics";`);
  }
}
