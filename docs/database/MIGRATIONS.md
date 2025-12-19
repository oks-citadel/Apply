# Database Migrations Documentation

## Overview

This document provides a comprehensive overview of all database migrations across the Job Apply Platform microservices architecture. Each service maintains its own PostgreSQL database on Azure Database for PostgreSQL.

**Last Updated:** December 2025

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Service Database Summary](#service-database-summary)
3. [Migration Details by Service](#migration-details-by-service)
4. [Running Migrations](#running-migrations)
5. [Rollback Procedures](#rollback-procedures)
6. [Best Practices](#best-practices)

---

## Database Architecture

### Connection Details

- **Host:** `applyforus-postgres.postgres.database.azure.com`
- **Port:** 5432 (default PostgreSQL port)
- **SSL:** Required for Azure PostgreSQL connections
- **Migration Tool:** TypeORM

### Database Naming Convention

Each service has its own isolated database:
- `applyforus_auth` - Authentication & Authorization
- `user_service_db` - User Profiles & Preferences
- `job_service_db` - Job Listings & Company Data
- `notification_service_db` - Notifications & Device Tokens
- `payment_service_db` - Subscriptions & Invoices
- `resume_service_db` - Resumes & Templates
- `analytics_service_db` - Analytics Events & SLA Tracking
- `auto_apply_service_db` - Applications & Form Mappings

---

## Service Database Summary

| Service | Database Name | Total Migrations | Tables Created | Enums | Key Features |
|---------|---------------|------------------|----------------|-------|--------------|
| **auth-service** | applyforus_auth | 3 | 3 | 5 | User auth, AI tracking, RBAC |
| **user-service** | user_service_db | 4 | 16 | 4 | Profiles, careers, recruiters, tenants |
| **job-service** | job_service_db | 3 | 6 + 1 view | 7 | Jobs, companies, alerts, reports |
| **notification-service** | notification_service_db | 3 | 3 | 4 | Notifications, preferences, devices |
| **payment-service** | payment_service_db | 2 | 2 | 0 | Subscriptions, invoices |
| **resume-service** | resume_service_db | 3 | 7 | 1 | Resumes, templates, alignment |
| **analytics-service** | analytics_service_db | 2 | 5 | 2 | Events, SLA contracts |
| **auto-apply-service** | auto_apply_service_db | 1 | 3 | 2 | Applications, auto-apply |
| **orchestrator-service** | N/A | 0 | 0 | 0 | No database (stateless) |

**Total:** 21 migrations across 8 databases creating 45+ tables

---

## Migration Details by Service

### 1. Auth Service (`applyforus_auth`)

**Migrations:**

#### Migration 1: InitialSchema (1733200000000)
- **File:** `services/auth-service/src/migrations/1733200000000-InitialSchema.ts`
- **Purpose:** Create core authentication tables and user management
- **Tables:**
  - `users` - Main user table with authentication details
- **Enums:**
  - `user_role`: admin, user, recruiter, moderator
  - `user_status`: active, inactive, suspended, pending_verification
  - `auth_provider`: local, google, linkedin, github
- **Indexes:**
  - Email, username (unique)
  - Role, status, auth provider
  - Email verification token
  - Password reset token
- **Key Features:**
  - OAuth provider support
  - MFA (Multi-Factor Authentication)
  - Account locking mechanism
  - Email verification workflow
  - Password reset functionality

#### Migration 2: SeedRolesAndPermissions (1733210000000)
- **File:** `services/auth-service/src/migrations/1733210000000-SeedRolesAndPermissions.ts`
- **Purpose:** Seed default roles and admin user
- **Tables:**
  - `roles` - RBAC role definitions
- **Data Seeded:**
  - Default admin user (admin@applyforus.com)
  - 4 default roles with permissions (admin, user, recruiter, moderator)
- **Security Note:** Default admin password should be changed immediately after deployment

#### Migration 3: AddSubscriptionAndAITracking (1733280000000)
- **File:** `services/auth-service/src/migrations/1733280000000-AddSubscriptionAndAITracking.ts`
- **Purpose:** Add subscription tiers and AI usage tracking
- **Tables:**
  - `ai_generations` - Track AI feature usage for billing
- **Columns Added to users:**
  - `subscription_tier` (free, pro, premium, enterprise)
  - `subscription_expires_at`
  - `email_verified_at`
- **Enums:**
  - `subscription_tier`: free, pro, premium, enterprise
  - `generation_type`: summary, bullets, cover_letter, ats_score, job_match, interview_questions
- **Key Features:**
  - AI usage tracking for billing
  - Token consumption monitoring
  - Performance metrics (latency tracking)

---

### 2. User Service (`user_service_db`)

**Migrations:**

#### Migration 1: InitialSchema (1733300000000)
- **File:** `services/user-service/src/migrations/1733300000000-InitialSchema.ts`
- **Purpose:** Create user profile and career management tables
- **Tables:**
  - `profiles` - User profile information
  - `work_experiences` - Work history
  - `education` - Educational background
  - `skills` - User skills with proficiency levels
  - `preferences` - Job search preferences
  - `subscriptions` - User subscription details
- **Enums:**
  - `subscription_tier`: free, basic, pro, enterprise
  - `subscription_status`: active, inactive, cancelled, past_due, trialing
  - `remote_preference`: remote, hybrid, onsite, any
  - `experience_level`: entry, junior, mid, senior, lead, principal, executive
  - `skill_proficiency`: beginner, intermediate, advanced, expert
- **Key Features:**
  - Profile completeness scoring
  - Salary range preferences
  - Industry and company preferences
  - Stripe integration for billing

#### Migration 2: CreateRecruiterTables (1734350000000)
- **File:** `services/user-service/src/migrations/1734350000000-CreateRecruiterTables.ts`
- **Purpose:** Enable recruiter marketplace functionality
- **Tables:**
  - `recruiter_profiles` - Recruiter information and metrics
  - `recruiter_assignments` - Assignment tracking
  - `placement_outcomes` - Placement results
  - `recruiter_reviews` - User reviews of recruiters
  - `recruiter_revenue` - Revenue and payout tracking
- **Key Features:**
  - Quality scoring algorithm
  - Revenue sharing with platform commission
  - Placement guarantee tracking
  - Verification workflow
  - Stripe Connect integration

#### Migration 3: CreateTenantTables (1734360000000)
- **File:** `services/user-service/src/migrations/1734360000000-CreateTenantTables.ts`
- **Purpose:** Enable B2B/Enterprise multi-tenancy
- **Tables:**
  - `tenants` - Organization accounts
  - `tenant_licenses` - License management
  - `tenant_users` - User-to-tenant relationships
  - `tenant_departments` - Department structure
  - `cohorts` - Educational cohort tracking
  - `placement_tracking` - Student placement analytics
- **Key Features:**
  - SSO support
  - Custom branding per tenant
  - API key management
  - Usage-based billing
  - Placement rate tracking for universities

#### Migration 4: AddCertificationsTable (1734370000000)
- **File:** `services/user-service/src/migrations/1734370000000-AddCertificationsTable.ts`
- **Purpose:** Add professional certifications tracking
- **Tables:**
  - `certifications` - Professional certifications
- **Key Features:**
  - Expiration date tracking
  - Credential verification links
  - Foreign key to profiles

---

### 3. Job Service (`job_service_db`)

**Migrations:**

#### Migration 1: InitialSchema (1733300000000)
- **File:** `services/job-service/src/migrations/1733300000000-InitialSchema.ts`
- **Purpose:** Create job listing and company data tables
- **Tables:**
  - `companies` - Company profiles
  - `jobs` - Job postings
  - `saved_jobs` - User-saved jobs
  - `company_reviews` - Company reviews from multiple sources
  - `job_alerts` - User job alert subscriptions
- **Enums:**
  - `company_size`: startup, small, medium, large, enterprise
  - `remote_type`: onsite, remote, hybrid
  - `job_source`: indeed, linkedin, glassdoor, direct
  - `experience_level`: entry, junior, mid, senior, lead, executive
  - `employment_type`: full_time, part_time, contract, temporary, internship
  - `review_source`: glassdoor, indeed, internal
  - `alert_frequency`: instant, daily, weekly
- **Key Features:**
  - Multi-source job aggregation
  - ATS platform detection
  - Vector embeddings for semantic search
  - Company culture and benefits tracking

#### Migration 2: CreateReportsTable (1733400000000)
- **File:** `services/job-service/src/migrations/1733400000000-CreateReportsTable.ts`
- **Purpose:** User-generated job reports and moderation
- **Tables:**
  - `job_reports` - User reports for job postings
- **Enums:**
  - `report_type`: spam, expired, misleading, duplicate, inappropriate, other
  - `report_status`: pending, reviewed, resolved, dismissed
- **Key Features:**
  - Duplicate prevention (one report per user per job)
  - Moderation workflow
  - Resolution tracking

#### Migration 3: AddPerformanceIndexes (1733500000000)
- **File:** `services/job-service/src/migrations/1733500000000-AddPerformanceIndexes.ts`
- **Purpose:** Performance optimization for high-traffic queries
- **Objects Created:**
  - 13 composite indexes (including partial and BRIN)
  - 3 GIN indexes for full-text search and arrays
  - 1 materialized view (`job_statistics`)
  - 1 stored function (`refresh_job_statistics()`)
- **Key Features:**
  - Full-text search on title, description, company
  - Array search for skills, requirements, tags
  - Time-series optimization with BRIN indexes
  - Daily statistics aggregation

---

### 4. Notification Service (`notification_service_db`)

**Migrations:**

#### Migration 1: InitialSchema (1733300000000)
- **File:** `services/notification-service/src/migrations/1733300000000-InitialSchema.ts`
- **Purpose:** Multi-channel notification system
- **Tables:**
  - `notifications` - Notification records
- **Enums:**
  - `notification_type`: email, push, sms, in_app
  - `notification_status`: pending, sent, failed, read
  - `notification_priority`: low, medium, high, urgent
- **Key Features:**
  - Multi-channel delivery (email, push, SMS, in-app)
  - Priority-based queuing
  - Retry mechanism
  - Expiration handling
  - Read receipts

#### Migration 2: AddNotificationPreferences (1733400000000)
- **File:** `services/notification-service/src/migrations/1733400000000-AddNotificationPreferences.ts`
- **Purpose:** User notification preferences
- **Tables:**
  - `notification_preferences` - Per-user notification settings
- **Key Features:**
  - Granular channel control (email, push, SMS)
  - Quiet hours support
  - Timezone-aware delivery
  - Digest frequency settings
  - Marketing opt-in/out

#### Migration 3: AddDeviceTokens (1733500000000)
- **File:** `services/notification-service/src/migrations/1733500000000-AddDeviceTokens.ts`
- **Purpose:** Push notification device management
- **Tables:**
  - `device_tokens` - FCM/APNs device tokens
- **Enums:**
  - `device_platform`: ios, android, web
  - `device_status`: active, inactive, invalid
- **Key Features:**
  - Multi-device support per user
  - Token invalidation tracking
  - Device metadata (model, OS version, app version)
  - Last usage tracking

---

### 5. Payment Service (`payment_service_db`)

**Migrations:**

#### Migration 1: InitialSchema (1733290000000)
- **File:** `services/payment-service/src/migrations/1733290000000-InitialSchema.ts`
- **Purpose:** Stripe billing integration
- **Tables:**
  - `subscriptions` - Subscription records
  - `invoices` - Invoice history
- **Key Features:**
  - Stripe customer and subscription ID tracking
  - Trial period support
  - Cancellation handling
  - Invoice PDF URL storage
  - Foreign key relationship (invoices -> subscriptions)

#### Migration 2: SubscriptionTierRebrand (1733836800000)
- **File:** `services/payment-service/src/migrations/1733836800000-SubscriptionTierRebrand.ts`
- **Purpose:** 2025 subscription tier rebranding
- **Changes:**
  - FREE → FREEMIUM
  - PRO → PROFESSIONAL
  - BUSINESS → ADVANCED_CAREER
  - ENTERPRISE → EXECUTIVE_ELITE
- **Notes:**
  - Data migration included
  - Backward compatible enum values
  - Audit log entry created

---

### 6. Resume Service (`resume_service_db`)

**Migrations:**

#### Migration 1: EnableUuidExtension (1733200000000)
- **File:** `services/resume-service/src/migrations/1733200000000-EnableUuidExtension.ts`
- **Purpose:** Enable PostgreSQL UUID extension
- **Operations:**
  - Install uuid-ossp extension
  - Verification check

#### Migration 2: InitialSchema (1733300000000)
- **File:** `services/resume-service/src/migrations/1733300000000-InitialSchema.ts`
- **Purpose:** Resume management system
- **Tables:**
  - `resumes` - Resume records
  - `resume_versions` - Version history
  - `sections` - Resume sections
  - `templates` - Resume templates
- **Enums:**
  - `section_type`: summary, experience, education, skills, certifications, projects, languages, custom
- **Key Features:**
  - Version control for resumes
  - Template-based resume creation
  - ATS score tracking
  - Soft delete support
  - File storage integration

#### Migration 3: CreateAlignmentTables (1734287000000)
- **File:** `services/resume-service/src/migrations/1734287000000-CreateAlignmentTables.ts`
- **Purpose:** AI-powered job alignment
- **Tables:**
  - `aligned_resumes` - Job-tailored resumes
  - `generated_cover_letters` - AI-generated cover letters
  - `alignment_analyses` - Detailed match analysis
- **Key Features:**
  - Match scoring (skill, experience, education)
  - Keyword density analysis
  - Gap analysis
  - Improvement suggestions
  - Strength/weakness identification

---

### 7. Analytics Service (`analytics_service_db`)

**Migrations:**

#### Migration 1: InitialSchema (1733300000000)
- **File:** `services/analytics-service/src/migrations/1733300000000-InitialSchema.ts`
- **Purpose:** Event tracking and analytics
- **Tables:**
  - `analytics_events` - Event tracking
- **Enums:**
  - `event_type`: page_view, application_submitted, application_viewed, application_accepted, application_rejected, job_searched, job_viewed, job_saved, resume_generated, cover_letter_generated, ai_suggestion_used, user_registered, user_login, profile_updated, export_data, error_occurred
  - `event_category`: user, application, job, ai, system
- **Key Features:**
  - Session tracking
  - Duration measurement
  - Error tracking
  - Date-based aggregation support
  - Metadata storage (JSONB)

#### Migration 2: CreateSLATables (1734380000000)
- **File:** `services/analytics-service/src/migrations/1734380000000-CreateSLATables.ts`
- **Purpose:** Service Level Agreement tracking
- **Tables:**
  - `sla_contracts` - SLA contracts
  - `sla_progress` - Progress tracking
  - `sla_violations` - Violation detection
  - `sla_remedies` - Remediation actions
- **Key Features:**
  - Interview guarantee tracking
  - Deadline monitoring
  - Violation detection and alerting
  - Automated remedy issuance
  - Financial impact tracking
  - Approval workflow for remedies

---

### 8. Auto-Apply Service (`auto_apply_service_db`)

**Migrations:**

#### Migration 1: InitialSchema (1733300000000)
- **File:** `services/auto-apply-service/src/migrations/1733300000000-InitialSchema.ts`
- **Purpose:** Automated job application system
- **Tables:**
  - `applications` - Application records
  - `auto_apply_settings` - User auto-apply configuration
  - `form_mappings` - Learned ATS form field mappings
- **Enums:**
  - `application_status`: applied, viewed, interviewing, offered, rejected, withdrawn
  - `application_source`: manual, auto_apply, quick_apply
- **Key Features:**
  - Match score tracking
  - Screenshot evidence
  - Form response storage
  - Error logging with retry mechanism
  - ATS platform detection
  - ML-based form field mapping
  - Confidence scoring for mappings

---

### 9. Orchestrator Service

**Status:** No database

The orchestrator service is stateless and does not require a database. It coordinates between other services but stores no persistent data.

---

## Running Migrations

### Prerequisites

1. Ensure PostgreSQL is accessible
2. Environment variables configured:
   ```bash
   DB_HOST=applyforus-postgres.postgres.database.azure.com
   DB_PORT=5432
   DB_USERNAME=<username>
   DB_PASSWORD=<password>
   DB_SSL=true
   ```

### Running Migrations for a Service

Each service has its own migration commands:

```bash
# Navigate to service directory
cd services/<service-name>

# Install dependencies
npm install

# Run migrations
npm run migration:run

# Generate new migration (after entity changes)
npm run migration:generate -- -n MigrationName

# Create blank migration
npm run migration:create -- -n MigrationName

# Revert last migration
npm run migration:revert
```

### Example Commands by Service

```bash
# Auth Service
cd services/auth-service
npm run migration:run

# User Service
cd services/user-service
npm run migration:run

# Job Service
cd services/job-service
npm run migration:run

# And so on for other services...
```

### Production Deployment

Migrations can be configured to run automatically on service startup:

**Option 1: Automatic on Startup** (configured in most services)
```typescript
// In data-source.ts or database.config.ts
migrationsRun: process.env.NODE_ENV === 'production'
```

**Option 2: Manual Pre-Deployment**
```bash
# Run migrations before deploying
npm run migration:run

# Then deploy service
docker build -t service-name .
docker push service-name
```

---

## Rollback Procedures

### Single Migration Rollback

```bash
cd services/<service-name>
npm run migration:revert
```

This reverts the most recently executed migration.

### Multiple Migration Rollback

To rollback multiple migrations:

```bash
# Revert 3 migrations
npm run migration:revert
npm run migration:revert
npm run migration:revert
```

### Emergency Rollback

If migrations fail in production:

1. **Stop affected service instances**
   ```bash
   kubectl scale deployment <service-name> --replicas=0
   ```

2. **Connect to database directly**
   ```bash
   psql -h applyforus-postgres.postgres.database.azure.com \
        -U <username> \
        -d <database_name>
   ```

3. **Check migration status**
   ```sql
   SELECT * FROM typeorm_migrations ORDER BY id DESC;
   ```

4. **Manual rollback if needed**
   - Run the `down()` method SQL from the migration file
   - Delete the migration record:
     ```sql
     DELETE FROM typeorm_migrations
     WHERE name = 'MigrationName1234567890';
     ```

5. **Restart services**
   ```bash
   kubectl scale deployment <service-name> --replicas=3
   ```

---

## Best Practices

### Migration Development

1. **Never modify existing migrations** - Always create new migrations for schema changes
2. **Always include down() methods** - Enable rollback capability
3. **Test migrations locally** - Run up() and down() before committing
4. **Use transactions** - Migrations run in transactions by default
5. **Index wisely** - Add indexes for query optimization but avoid over-indexing

### Migration Naming

Follow the timestamp-based naming convention:
```
YYYYMMDDHHMMSS-DescriptiveName.ts
Example: 1733300000000-InitialSchema.ts
```

### Data Migrations

When migrating data:
1. **Create backup** before running data migrations
2. **Use batch processing** for large datasets
3. **Add validation** to verify data integrity
4. **Log progress** for debugging

Example:
```typescript
// Good - Batch processing
const batchSize = 1000;
const total = await queryRunner.query('SELECT COUNT(*) FROM users');

for (let offset = 0; offset < total; offset += batchSize) {
  await queryRunner.query(`
    UPDATE users SET new_field = old_field
    WHERE id IN (
      SELECT id FROM users
      ORDER BY id LIMIT ${batchSize} OFFSET ${offset}
    )
  `);
}
```

### Schema Changes

1. **Additive changes first** - Add new columns/tables before removing old ones
2. **Use nullable columns** when adding to existing tables
3. **Default values** for new NOT NULL columns
4. **Deprecation period** for column/table removal

### Production Safety

1. **Backup before migrations**
   ```bash
   pg_dump -h applyforus-postgres.postgres.database.azure.com \
           -U username -d database_name > backup.sql
   ```

2. **Test on staging** environment first
3. **Run during low-traffic periods**
4. **Monitor performance** - Some migrations lock tables
5. **Use CONCURRENTLY** for index creation when possible:
   ```sql
   CREATE INDEX CONCURRENTLY idx_name ON table(column);
   ```

### Foreign Key Considerations

- Use `CASCADE` carefully - understand downstream effects
- Prefer `SET NULL` or `RESTRICT` when appropriate
- Document all foreign key relationships

### Enum Management

Enums in PostgreSQL have limitations:
- **Cannot remove values** from existing enums
- **Can only add values** with ALTER TYPE
- Consider using lookup tables for frequently changing classifications

---

## Monitoring and Maintenance

### Check Migration Status

```sql
-- Check applied migrations
SELECT * FROM typeorm_migrations ORDER BY timestamp DESC;

-- Check pending migrations (run from app)
npm run migration:show
```

### Performance Monitoring

Monitor these metrics after migrations:
- Query performance (use `EXPLAIN ANALYZE`)
- Table sizes (`pg_total_relation_size`)
- Index usage (`pg_stat_user_indexes`)
- Database connection pool status

### Cleanup Tasks

Periodically review:
1. **Unused indexes** - Drop if not used
2. **Bloated tables** - VACUUM ANALYZE
3. **Old data** - Archive or delete based on retention policy

---

## Entity Relationship Overview

### Cross-Service Relationships

The platform uses a microservices architecture with separate databases. Cross-service relationships are managed through:

1. **User ID references** - UUID references to users in auth-service
2. **Job ID references** - UUID references to jobs in job-service
3. **Event-driven sync** - Service events trigger updates in other services

### Key Entity Relationships by Service

**Auth Service:**
- users → ai_generations (1:many)
- users → roles (many:many via user.role enum)

**User Service:**
- profiles → certifications (1:many)
- profiles → work_experiences (1:many)
- profiles → education (1:many)
- profiles → skills (1:many)
- recruiter_profiles → recruiter_assignments (1:many)
- recruiter_assignments → placement_outcomes (1:many)
- recruiter_profiles → recruiter_reviews (1:many)
- tenants → tenant_users (1:many)
- tenants → tenant_departments (1:many)
- tenants → cohorts (1:many)

**Job Service:**
- companies → jobs (1:many)
- companies → company_reviews (1:many)
- jobs → saved_jobs (1:many)
- jobs → job_reports (1:many)

**Resume Service:**
- resumes → sections (1:many)
- resumes → resume_versions (1:many)
- templates → resumes (1:many)
- resumes → aligned_resumes (1:many)
- aligned_resumes → generated_cover_letters (1:many)
- aligned_resumes → alignment_analyses (1:many)

**Analytics Service:**
- sla_contracts → sla_progress (1:many)
- sla_contracts → sla_violations (1:many)
- sla_violations → sla_remedies (1:many)

**Payment Service:**
- subscriptions → invoices (1:many)

---

## Troubleshooting

### Common Issues

**1. Migration Already Executed**
```
Error: Migration "MigrationName" has already been executed.
```
Solution: The migration was already run. Check `typeorm_migrations` table.

**2. Cannot Connect to Database**
```
Error: connect ETIMEDOUT
```
Solutions:
- Check Azure PostgreSQL firewall rules
- Verify SSL configuration
- Check connection string

**3. Table Already Exists**
```
Error: relation "table_name" already exists
```
Solution: Database out of sync. Either:
- Drop the table manually if safe
- Skip the migration if already applied manually

**4. Foreign Key Violation**
```
Error: violates foreign key constraint
```
Solution: Ensure referenced records exist or use ON DELETE CASCADE/SET NULL.

**5. Enum Value Conflicts**
```
Error: enum label "value" already exists
```
Solution: Enum values can't be removed. Add new values only, or create new enum type.

---

## Database Backup Strategy

### Automated Backups

Azure PostgreSQL provides:
- Automatic backups (retained for 7-35 days)
- Point-in-time restore capability
- Geo-redundant backup option

### Manual Backup Before Migrations

```bash
# Full database backup
pg_dump -h applyforus-postgres.postgres.database.azure.com \
        -U username \
        -d database_name \
        -F c \
        -f backup_$(date +%Y%m%d_%H%M%S).dump

# Schema-only backup
pg_dump -h applyforus-postgres.postgres.database.azure.com \
        -U username \
        -d database_name \
        --schema-only \
        -f schema_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
# Restore full backup
pg_restore -h applyforus-postgres.postgres.database.azure.com \
           -U username \
           -d database_name \
           -c \
           backup_20251219_120000.dump
```

---

## Migration Checklist

Before running migrations in production:

- [ ] Migrations tested locally
- [ ] Migrations tested on staging
- [ ] Database backup created
- [ ] Downtime window scheduled (if needed)
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring alerts configured
- [ ] Performance impact assessed
- [ ] Foreign key cascades reviewed
- [ ] Index creation strategy (CONCURRENTLY if needed)

---

## Support and Resources

### Documentation
- TypeORM Migrations: https://typeorm.io/migrations
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Azure PostgreSQL: https://docs.microsoft.com/azure/postgresql/

### Internal Resources
- Database Schema Diagrams: `/docs/database/diagrams/`
- Entity Relationship Diagrams: `/docs/database/erd/`
- Service Documentation: `/docs/services/`

### Getting Help
- Platform Team: platform-team@applyforus.com
- Database Issues: Create ticket in JIRA with label `database`
- Emergency: Contact on-call engineer

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-19 | 1.0.0 | Initial documentation | Claude AI |

---

**Last Updated:** December 19, 2025
**Document Owner:** Platform Engineering Team
**Review Cycle:** Quarterly
