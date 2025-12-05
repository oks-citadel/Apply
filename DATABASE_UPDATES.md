# Database Layer Updates - Track C

This document outlines all database schema updates and migrations created for the Job-Apply-Platform.

## Overview

The following updates have been implemented across the database layer:

1. **User Entity Updates** - Added subscription and tracking fields
2. **AI Generations Entity** - New table for tracking AI usage
3. **Job Service Updates** - Added vector embeddings for semantic search
4. **User Preferences Updates** - Enhanced preference fields
5. **PostgreSQL Init Script** - Updated with all extensions and enums
6. **TypeORM Migration** - Complete migration for auth-service changes

---

## 1. User Entity Updates

**File**: `services/auth-service/src/modules/users/entities/user.entity.ts`
**Updated File**: `services/auth-service/src/modules/users/entities/user.entity-updated.ts`

### New Enum: SubscriptionTier

```typescript
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}
```

### New Columns Added

| Column Name | Type | Description | Default | Nullable |
|------------|------|-------------|---------|----------|
| `subscriptionTier` | enum | User's subscription level | 'free' | No |
| `subscriptionExpiresAt` | timestamp | When subscription expires | null | Yes |
| `emailVerifiedAt` | timestamp | When email was verified | null | Yes |

### New Virtual Property

```typescript
get hasActiveSubscription(): boolean {
  if (this.subscriptionTier === SubscriptionTier.FREE) {
    return true;
  }
  return this.subscriptionExpiresAt && this.subscriptionExpiresAt > new Date();
}
```

### Indexes Created
- Index on `subscriptionTier`
- Index on `subscriptionExpiresAt`
- Index on `emailVerifiedAt`

---

## 2. AI Generations Entity

**File**: `services/auth-service/src/modules/ai/entities/ai-generation.entity.ts`

### New Entity Structure

```typescript
@Entity('ai_generations')
export class AIGeneration {
  id: string;                           // UUID primary key
  userId: string;                       // UUID foreign key to users
  generationType: GenerationType;       // Type of AI generation
  inputData: Record<string, any>;       // JSONB input
  outputData: Record<string, any>;      // JSONB output
  modelUsed: string;                    // AI model identifier
  tokensUsed: number;                   // Token consumption
  latencyMs: number;                    // Generation latency
  createdAt: Date;                      // Timestamp
}
```

### Generation Types

```typescript
export enum GenerationType {
  SUMMARY = 'summary',
  BULLETS = 'bullets',
  COVER_LETTER = 'cover_letter',
  ATS_SCORE = 'ats_score',
  JOB_MATCH = 'job_match',
  INTERVIEW_QUESTIONS = 'interview_questions',
}
```

### Purpose
- Track AI generation usage for billing
- Monitor token consumption per user
- Analyze model performance (latency)
- Audit trail for AI operations
- Generate usage reports

### Indexes
- `userId` - For user-specific queries
- `generationType` - For type-based analytics
- `createdAt` - For time-based queries
- `modelUsed` - For model performance analysis

---

## 3. TypeORM Migration for Auth Service

**File**: `services/auth-service/src/migrations/1733280000000-AddSubscriptionAndAITracking.ts`

### Migration Details

This migration handles:
1. Creation of `subscription_tier` enum type
2. Creation of `generation_type` enum type
3. Adding subscription columns to `users` table
4. Creating `ai_generations` table
5. Creating all necessary indexes
6. Creating foreign key constraints
7. Adding table and column comments

### Running the Migration

```bash
# From auth-service directory
npm run typeorm migration:run

# To rollback
npm run typeorm migration:revert
```

### Up Migration Steps
1. Create enum types (with duplicate protection)
2. Add columns to users table
3. Create indexes on user columns
4. Create ai_generations table
5. Create indexes on ai_generations
6. Add foreign key constraint
7. Add documentation comments

### Down Migration Steps
- Reverses all changes in proper order
- Drops foreign keys first
- Drops indexes
- Drops tables
- Drops columns
- Drops enum types

---

## 4. Job Service Updates - Vector Embeddings

**File**: `src/services/job-service/migrations/001_add_vector_embedding.sql`

### Changes

#### New Extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### New Column
```sql
ALTER TABLE jobs
ADD COLUMN embedding vector(1536);
```

#### Indexes
- HNSW index for fast similarity search
- Alternative IVFFlat index option (commented)

### New Functions

#### 1. search_jobs_by_embedding
Search jobs using semantic similarity with a query embedding.

```sql
SELECT * FROM search_jobs_by_embedding(
    query_embedding := '[0.1, 0.2, ...]'::vector(1536),
    match_threshold := 0.7,
    match_count := 20
);
```

**Parameters:**
- `query_embedding`: Vector representation of search query
- `match_threshold`: Minimum similarity score (0.0-1.0)
- `match_count`: Maximum number of results

**Returns:**
- job_id, title, company_name, location, similarity

#### 2. find_similar_jobs
Find jobs similar to a given job based on embedding.

```sql
SELECT * FROM find_similar_jobs(
    p_job_id := 'uuid-here',
    match_count := 10
);
```

**Parameters:**
- `p_job_id`: UUID of the source job
- `match_count`: Number of similar jobs to return

**Returns:**
- job_id, title, company_name, similarity

### New View: jobs_with_embeddings
Shows active jobs with embedding status.

```sql
SELECT * FROM jobs_with_embeddings
WHERE has_embedding = TRUE;
```

### Vector Search Performance

**Cosine Distance Operator**: `<=>`
- Range: 0.0 (identical) to 2.0 (opposite)
- Similarity = 1 - distance

**Index Types:**
- **HNSW**: Better for smaller datasets, faster queries
- **IVFFlat**: Better for larger datasets (>1M rows)

### Usage Example

```typescript
// Generate embedding using OpenAI
const embedding = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: jobDescription,
});

// Store in database
await db.query(
  'UPDATE jobs SET embedding = $1 WHERE id = $2',
  [embedding.data[0].embedding, jobId]
);

// Search
const results = await db.query(
  'SELECT * FROM search_jobs_by_embedding($1, 0.7, 20)',
  [queryEmbedding]
);
```

---

## 5. User Service Updates - Enhanced Preferences

**File**: `src/services/user-service/migrations/001_add_preference_fields.sql`

### New Enum Type

```sql
CREATE TYPE experience_level_enum AS ENUM (
    'entry',
    'junior',
    'mid',
    'senior',
    'lead',
    'executive'
);
```

### New Columns

| Column Name | Type | Description | Indexed |
|------------|------|-------------|---------|
| `experience_level` | enum | User's experience level | Yes |
| `excluded_companies` | text[] | Companies to exclude | Yes (GIN) |
| `target_locations` | text[] | Target job locations | Yes (GIN) |

### New Function: get_user_job_preferences

Retrieve complete job preferences for a user.

```sql
SELECT * FROM get_user_job_preferences('user-uuid-here');
```

**Returns:**
- desired_titles
- experience_level
- salary_min, salary_max
- remote_preference
- target_locations
- excluded_companies
- job_types

### Updated View: active_job_seekers_enhanced

Enhanced view with new preference fields and counts.

```sql
SELECT * FROM active_job_seekers_enhanced
WHERE experience_level = 'senior'
AND target_locations_count > 0;
```

### Usage Examples

```sql
-- Add excluded companies
UPDATE preferences
SET excluded_companies = ARRAY['Company A', 'Company B']
WHERE profile_id = 'uuid';

-- Add target locations
UPDATE preferences
SET target_locations = ARRAY['New York, NY', 'San Francisco, CA', 'remote']
WHERE profile_id = 'uuid';

-- Set experience level
UPDATE preferences
SET experience_level = 'senior'
WHERE profile_id = 'uuid';

-- Search with exclusions
SELECT * FROM jobs
WHERE company_name != ALL(
    SELECT excluded_companies FROM preferences WHERE profile_id = 'uuid'
);
```

---

## 6. PostgreSQL Init Script Updates

**File**: `infrastructure/docker/postgres/init-updated.sql`

### New Extensions
- `vector` - pgvector for semantic search

### All Enum Types Consolidated
- User-related enums
- Job-related enums
- Skill-related enums
- Experience level enums
- Subscription enums
- AI generation enums

### Enhanced Audit System

#### Audit Log Table
Tracks all database changes with:
- Schema and table name
- Operation type (INSERT/UPDATE/DELETE)
- User ID and record ID
- Old and new data (JSONB)
- Changed fields array
- IP address and user agent
- Timestamp

#### Audit Trigger Function
Generic function that can be applied to any table.

```sql
-- Enable auditing on a table
SELECT enable_audit_trigger('users');
SELECT enable_audit_trigger('jobs');
SELECT enable_audit_trigger('ai_generations');
```

#### Query Audit Logs

```sql
-- View all changes to a specific record
SELECT * FROM audit_log
WHERE table_name = 'users'
AND record_id = 'user-uuid-here'
ORDER BY created_at DESC;

-- View recent updates
SELECT * FROM audit_log
WHERE operation = 'UPDATE'
AND created_at > NOW() - INTERVAL '24 hours';

-- View changes by user
SELECT * FROM audit_log
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### Utility Functions

#### update_updated_at_column()
Universal trigger function for updating timestamps.

#### generate_slug(text)
Generate URL-friendly slugs.

```sql
SELECT generate_slug('Full Stack Developer Position');
-- Returns: 'full-stack-developer-position'
```

#### calculate_duration_months(start_date, end_date)
Calculate duration between dates in months.

```sql
SELECT calculate_duration_months('2020-01-01', '2023-06-15');
-- Returns: 41
```

---

## Database Schema Diagram

```
┌─────────────┐
│   users     │
├─────────────┤
│ id          │◄──┐
│ email       │   │
│ username    │   │
│ ...         │   │
│ subscription│   │
│ _tier       │   │
│ subscription│   │
│ _expires_at │   │
│ email       │   │
│ _verified_at│   │
└─────────────┘   │
                  │
                  │ FK
┌─────────────┐   │
│ai_generations│   │
├─────────────┤   │
│ id          │   │
│ user_id     ├───┘
│ generation  │
│ _type       │
│ input_data  │
│ output_data │
│ model_used  │
│ tokens_used │
│ latency_ms  │
│ created_at  │
└─────────────┘

┌─────────────┐
│   jobs      │
├─────────────┤
│ id          │
│ title       │
│ description │
│ ...         │
│ embedding   │◄── vector(1536)
└─────────────┘

┌─────────────┐
│ preferences │
├─────────────┤
│ id          │
│ profile_id  │
│ ...         │
│ experience  │
│ _level      │
│ excluded    │
│ _companies  │
│ target      │
│ _locations  │
└─────────────┘
```

---

## Installation & Deployment

### 1. Update Docker PostgreSQL Init

```bash
# Backup existing init script
cp infrastructure/docker/postgres/init.sql infrastructure/docker/postgres/init.sql.backup

# Use updated init script
cp infrastructure/docker/postgres/init-updated.sql infrastructure/docker/postgres/init.sql

# Restart PostgreSQL container
docker-compose down postgres
docker-compose up -d postgres
```

### 2. Install pgvector Extension

If using managed PostgreSQL (Azure, AWS RDS, etc.):

**Azure Database for PostgreSQL:**
```bash
# Enable extension
az postgres server configuration set \
  --resource-group myResourceGroup \
  --server-name myserver \
  --name azure.extensions \
  --value pgvector
```

**AWS RDS:**
```sql
-- Connect as superuser
CREATE EXTENSION vector;
```

### 3. Run Auth Service Migration

```bash
cd services/auth-service

# Generate migration (if using TypeORM CLI)
npm run typeorm migration:generate -- -n AddSubscriptionAndAITracking

# Or use the provided migration
npm run typeorm migration:run
```

### 4. Run Job Service Migration

```bash
# Connect to job service database
psql -h localhost -U postgres -d jobpilot

# Run migration
\i src/services/job-service/migrations/001_add_vector_embedding.sql
```

### 5. Run User Service Migration

```bash
# Connect to user service database
psql -h localhost -U postgres -d jobpilot

# Run migration
\i src/services/user-service/migrations/001_add_preference_fields.sql
```

### 6. Enable Audit Triggers

```sql
-- Enable on critical tables
SELECT enable_audit_trigger('users');
SELECT enable_audit_trigger('ai_generations');
SELECT enable_audit_trigger('jobs');
SELECT enable_audit_trigger('preferences');
```

---

## Testing & Verification

### 1. Verify User Entity Changes

```typescript
// Test in auth-service
import { User, SubscriptionTier } from './entities/user.entity';

const user = new User();
user.subscriptionTier = SubscriptionTier.PRO;
user.subscriptionExpiresAt = new Date('2024-12-31');
user.emailVerifiedAt = new Date();

console.log(user.hasActiveSubscription); // true
```

### 2. Test AI Generations

```typescript
// Create AI generation record
const generation = new AIGeneration();
generation.userId = user.id;
generation.generationType = GenerationType.SUMMARY;
generation.inputData = { resume: '...' };
generation.outputData = { summary: '...' };
generation.modelUsed = 'gpt-4';
generation.tokensUsed = 1500;
generation.latencyMs = 2300;

await aiGenerationRepository.save(generation);
```

### 3. Test Vector Search

```sql
-- Insert test job with embedding
INSERT INTO jobs (title, company_name, description, embedding, ...)
VALUES (
    'Senior Software Engineer',
    'Tech Corp',
    'We are looking for...',
    '[0.1, 0.2, 0.3, ...]'::vector(1536),
    ...
);

-- Test semantic search
SELECT * FROM search_jobs_by_embedding(
    '[0.1, 0.2, 0.3, ...]'::vector(1536),
    0.7,
    10
);
```

### 4. Test Preferences

```sql
-- Update user preferences
UPDATE preferences
SET
    experience_level = 'senior',
    excluded_companies = ARRAY['Company X', 'Company Y'],
    target_locations = ARRAY['New York', 'San Francisco', 'remote']
WHERE profile_id = 'uuid';

-- Verify
SELECT * FROM get_user_job_preferences('user-uuid');
```

---

## Performance Considerations

### Indexes Created
- **users.subscription_tier** - For filtering by subscription level
- **users.subscription_expires_at** - For expiration queries
- **ai_generations.user_id** - For user-specific analytics
- **ai_generations.created_at** - For time-based queries
- **jobs.embedding (HNSW)** - For vector similarity search
- **preferences.excluded_companies (GIN)** - For array containment
- **preferences.target_locations (GIN)** - For array containment

### Query Optimization Tips

1. **Vector Search**: Use appropriate match_threshold to limit results
2. **Array Queries**: Use GIN indexes for array containment (`@>`, `&&`)
3. **Audit Logs**: Partition by date for large volumes
4. **AI Generations**: Consider partitioning by created_at

---

## Backup & Recovery

### Before Applying Migrations

```bash
# Full database backup
pg_dump -h localhost -U postgres jobpilot > backup_$(date +%Y%m%d).sql

# Schema only backup
pg_dump -h localhost -U postgres --schema-only jobpilot > schema_backup.sql

# Specific table backup
pg_dump -h localhost -U postgres -t users jobpilot > users_backup.sql
```

### Rollback Procedures

Each migration file includes rollback instructions:

```sql
-- User service rollback
\i src/services/user-service/migrations/001_add_preference_fields.sql
-- See "Rollback instructions" section at bottom

-- Job service rollback
\i src/services/job-service/migrations/001_add_vector_embedding.sql
-- See "Rollback instructions" section at bottom
```

For TypeORM migration:
```bash
npm run typeorm migration:revert
```

---

## Monitoring & Maintenance

### Monitor AI Generation Usage

```sql
-- Daily token usage by user
SELECT
    user_id,
    COUNT(*) as generations,
    SUM(tokens_used) as total_tokens,
    AVG(latency_ms) as avg_latency
FROM ai_generations
WHERE created_at >= CURRENT_DATE
GROUP BY user_id
ORDER BY total_tokens DESC;

-- Model performance
SELECT
    model_used,
    COUNT(*) as count,
    AVG(tokens_used) as avg_tokens,
    AVG(latency_ms) as avg_latency,
    MAX(latency_ms) as max_latency
FROM ai_generations
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY model_used;
```

### Monitor Subscription Expirations

```sql
-- Subscriptions expiring soon
SELECT
    id,
    email,
    subscription_tier,
    subscription_expires_at
FROM users
WHERE subscription_tier != 'free'
AND subscription_expires_at < CURRENT_DATE + INTERVAL '7 days'
ORDER BY subscription_expires_at;
```

### Vector Index Maintenance

```sql
-- Check index size
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%';

-- Rebuild index if needed
REINDEX INDEX idx_jobs_embedding_hnsw;
```

---

## Security Considerations

1. **Audit Logging**: Enabled on sensitive tables
2. **JSONB Data**: Input/output data stored securely
3. **Vector Embeddings**: Consider encrypting at rest
4. **Personal Data**: Email verification timestamps for GDPR compliance
5. **Subscription Data**: Track for billing compliance

---

## Support & Troubleshooting

### Common Issues

#### 1. pgvector Extension Not Found
```bash
# Install pgvector
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

#### 2. TypeORM Migration Fails
```bash
# Check connection
npm run typeorm query "SELECT version()"

# Verify migration files
npm run typeorm migration:show
```

#### 3. Vector Index Build Timeout
```sql
-- Increase maintenance_work_mem temporarily
SET maintenance_work_mem = '2GB';
CREATE INDEX CONCURRENTLY ...;
```

---

## Next Steps

1. **Application Code Updates**
   - Update DTOs to include new fields
   - Update services to handle subscription logic
   - Implement AI generation tracking
   - Integrate vector search in job queries

2. **API Updates**
   - Add subscription endpoints
   - Add AI usage analytics endpoints
   - Add semantic job search endpoint
   - Update preference endpoints

3. **Frontend Updates**
   - Subscription management UI
   - AI usage dashboard
   - Enhanced preference forms
   - Semantic search interface

4. **Documentation**
   - API documentation updates
   - User guides for new features
   - Admin guides for monitoring

---

## Files Summary

### Created Files
1. `services/auth-service/src/modules/ai/entities/ai-generation.entity.ts`
2. `services/auth-service/src/modules/users/entities/user.entity-updated.ts`
3. `services/auth-service/src/migrations/1733280000000-AddSubscriptionAndAITracking.ts`
4. `src/services/job-service/migrations/001_add_vector_embedding.sql`
5. `src/services/user-service/migrations/001_add_preference_fields.sql`
6. `infrastructure/docker/postgres/init-updated.sql`
7. `DATABASE_UPDATES.md` (this file)

### Files to Update Manually
1. `services/auth-service/src/modules/users/entities/user.entity.ts`
   - Replace with content from `user.entity-updated.ts`

---

## Contact & Support

For questions or issues with these database updates:
- Review migration logs
- Check audit_log table for data changes
- Verify indexes are being used (EXPLAIN ANALYZE)
- Monitor query performance

---

**Migration Version**: 1.0.0
**Date**: December 4, 2024
**Author**: Data Engineer Agent (Track C)
