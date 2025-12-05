# Track C: Database Layer Implementation Checklist

## Pre-Implementation

- [ ] Review all documentation files:
  - [ ] `DATABASE_UPDATES.md` - Full technical documentation
  - [ ] `TRACK_C_DELIVERABLES.md` - Complete deliverables summary
  - [ ] `QUICK_START_DATABASE.md` - Quick setup guide
  - [ ] This checklist file

- [ ] Backup existing database
  ```bash
  pg_dump -h localhost -U postgres jobpilot > backup_$(date +%Y%m%d).sql
  ```

- [ ] Ensure prerequisites:
  - [ ] PostgreSQL 12+ installed
  - [ ] Node.js and npm installed
  - [ ] Database credentials ready
  - [ ] Development environment set up

---

## Phase 1: Install pgvector Extension

### Option A: Docker (Recommended)

- [ ] Navigate to postgres directory
  ```bash
  cd infrastructure/docker/postgres
  ```

- [ ] Backup existing init script
  ```bash
  cp init.sql init.sql.backup
  ```

- [ ] Use updated init script
  ```bash
  cp init-updated.sql init.sql
  ```

- [ ] Restart PostgreSQL container
  ```bash
  docker-compose down postgres
  docker-compose up -d postgres
  ```

- [ ] Verify pgvector installed
  ```bash
  docker exec -it postgres psql -U postgres -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"
  ```

### Option B: Local Installation

- [ ] Install pgvector
  ```bash
  # Ubuntu/Debian
  sudo apt-get install postgresql-15-pgvector

  # macOS
  brew install pgvector

  # Or compile from source
  git clone https://github.com/pgvector/pgvector.git
  cd pgvector
  make
  sudo make install
  ```

- [ ] Connect to database and enable extension
  ```sql
  psql -h localhost -U postgres -d jobpilot
  CREATE EXTENSION vector;
  \q
  ```

---

## Phase 2: Auth Service Updates

- [ ] Navigate to auth-service
  ```bash
  cd services/auth-service
  ```

- [ ] Verify new files exist:
  - [ ] `src/modules/ai/entities/ai-generation.entity.ts`
  - [ ] `src/modules/users/entities/user.entity-updated.ts`
  - [ ] `src/migrations/1733280000000-AddSubscriptionAndAITracking.ts`
  - [ ] `src/config/typeorm.config.ts`

- [ ] Update environment variables in `.env`
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=your_password
  DB_NAME=jobpilot
  DB_LOGGING=true
  ```

- [ ] Install dependencies (if needed)
  ```bash
  npm install
  ```

- [ ] Run TypeORM migration
  ```bash
  npm run typeorm migration:run
  ```

- [ ] Verify migration succeeded
  ```bash
  npm run typeorm migration:show
  ```
  Should show: `[X] AddSubscriptionAndAITracking1733280000000`

- [ ] Update User entity file
  ```bash
  cd src/modules/users/entities
  cp user.entity.ts user.entity.ts.old
  cp user.entity-updated.ts user.entity.ts
  ```

- [ ] Rebuild application
  ```bash
  cd ../../..
  npm run build
  ```

- [ ] Test compilation
  ```bash
  npm run test
  ```

---

## Phase 3: Job Service Updates

- [ ] Navigate to job service migrations
  ```bash
  cd src/services/job-service/migrations
  ```

- [ ] Verify migration file exists
  - [ ] `001_add_vector_embedding.sql`

- [ ] Connect to database
  ```bash
  psql -h localhost -U postgres -d jobpilot
  ```

- [ ] Run migration
  ```sql
  \i 001_add_vector_embedding.sql
  ```

- [ ] Verify changes
  ```sql
  -- Check extension
  \dx vector

  -- Check column
  \d jobs

  -- Should see: embedding | vector(1536) |

  -- Check functions
  \df search_jobs_by_embedding
  \df find_similar_jobs

  -- Check view
  \dv jobs_with_embeddings

  \q
  ```

- [ ] Test vector operations
  ```sql
  psql -h localhost -U postgres -d jobpilot -c "
  SELECT vector_dims('[1,2,3]'::vector);
  "
  ```
  Should return: 3

---

## Phase 4: User Service Updates

- [ ] Navigate to user service migrations
  ```bash
  cd src/services/user-service/migrations
  ```

- [ ] Verify migration file exists
  - [ ] `001_add_preference_fields.sql`

- [ ] Connect to database
  ```bash
  psql -h localhost -U postgres -d jobpilot
  ```

- [ ] Run migration
  ```sql
  \i 001_add_preference_fields.sql
  ```

- [ ] Verify changes
  ```sql
  -- Check enum type
  \dT+ experience_level_enum

  -- Check columns
  \d preferences

  -- Should see:
  -- experience_level | experience_level_enum |
  -- excluded_companies | text[] |
  -- target_locations | text[] |

  -- Check indexes
  \di idx_preferences_*

  -- Check function
  \df get_user_job_preferences

  -- Check view
  \dv active_job_seekers_enhanced

  \q
  ```

---

## Phase 5: Verification

- [ ] Run comprehensive verification script
  ```bash
  psql -h localhost -U postgres -d jobpilot -f infrastructure/docker/postgres/verify-schema.sql
  ```

- [ ] Review output for any MISSING items

- [ ] Check all extensions installed
  - [ ] uuid-ossp ✓
  - [ ] pgcrypto ✓
  - [ ] pg_trgm ✓
  - [ ] vector ✓

- [ ] Check all enum types created
  - [ ] subscription_tier ✓
  - [ ] generation_type ✓
  - [ ] experience_level_enum ✓

- [ ] Check all tables exist
  - [ ] users (updated) ✓
  - [ ] ai_generations (new) ✓
  - [ ] jobs (updated) ✓
  - [ ] preferences (updated) ✓
  - [ ] audit_log ✓

- [ ] Check all indexes created (at least):
  - [ ] IDX_USERS_SUBSCRIPTION_TIER ✓
  - [ ] IDX_AI_GENERATIONS_USER_ID ✓
  - [ ] idx_jobs_embedding_hnsw ✓
  - [ ] idx_preferences_experience_level ✓

- [ ] Check all functions created
  - [ ] search_jobs_by_embedding ✓
  - [ ] find_similar_jobs ✓
  - [ ] get_user_job_preferences ✓
  - [ ] audit_trigger_function ✓
  - [ ] enable_audit_trigger ✓

- [ ] Check all views created
  - [ ] jobs_with_embeddings ✓
  - [ ] active_job_seekers_enhanced ✓

---

## Phase 6: Enable Audit Logging

- [ ] Connect to database
  ```bash
  psql -h localhost -U postgres -d jobpilot
  ```

- [ ] Enable audit triggers on critical tables
  ```sql
  SELECT enable_audit_trigger('users');
  SELECT enable_audit_trigger('ai_generations');
  SELECT enable_audit_trigger('jobs');
  SELECT enable_audit_trigger('preferences');
  SELECT enable_audit_trigger('profiles');
  SELECT enable_audit_trigger('career_history');
  ```

- [ ] Verify triggers created
  ```sql
  SELECT
    trigger_schema,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
  FROM information_schema.triggers
  WHERE trigger_name LIKE 'audit_trigger_%'
  ORDER BY event_object_table;
  ```

- [ ] Test audit logging
  ```sql
  -- Make a test change
  UPDATE users SET first_name = 'Test' WHERE id = (SELECT id FROM users LIMIT 1);

  -- Check audit log
  SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5;
  ```

---

## Phase 7: Testing

### Database Tests

- [ ] Test user subscription
  ```sql
  -- Insert test user
  INSERT INTO users (email, username, subscription_tier, subscription_expires_at)
  VALUES ('test@example.com', 'testuser', 'pro', NOW() + INTERVAL '30 days')
  RETURNING id, subscription_tier, subscription_expires_at;
  ```

- [ ] Test AI generation tracking
  ```sql
  -- Insert test generation (replace user_id with actual UUID)
  INSERT INTO ai_generations (
    user_id,
    generation_type,
    input_data,
    output_data,
    model_used,
    tokens_used,
    latency_ms
  ) VALUES (
    'user-uuid-here',
    'summary',
    '{"test": true}'::jsonb,
    '{"result": "test"}'::jsonb,
    'gpt-4',
    100,
    1000
  ) RETURNING *;
  ```

- [ ] Test vector operations
  ```sql
  -- Create test embedding
  UPDATE jobs
  SET embedding = array_fill(0.1::float, ARRAY[1536])::vector
  WHERE id = (SELECT id FROM jobs LIMIT 1)
  RETURNING id, title, embedding IS NOT NULL as has_embedding;

  -- Test similarity search
  SELECT * FROM search_jobs_by_embedding(
    array_fill(0.1::float, ARRAY[1536])::vector,
    0.5,
    5
  );
  ```

- [ ] Test preferences
  ```sql
  -- Update test preferences (replace profile_id with actual UUID)
  UPDATE preferences
  SET
    experience_level = 'senior',
    excluded_companies = ARRAY['Test Corp'],
    target_locations = ARRAY['New York', 'remote']
  WHERE profile_id = 'profile-uuid-here'
  RETURNING *;

  -- Test function
  SELECT * FROM get_user_job_preferences('user-uuid-here');
  ```

### Application Tests

- [ ] Start auth service
  ```bash
  cd services/auth-service
  npm run start:dev
  ```

- [ ] Test health endpoint
  ```bash
  curl http://localhost:3000/health
  ```

- [ ] Test user creation with new fields
  ```bash
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "newuser@example.com",
      "password": "Test123!",
      "subscriptionTier": "free"
    }'
  ```

- [ ] Check application logs for errors

---

## Phase 8: Performance Testing

- [ ] Test vector search performance
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM search_jobs_by_embedding(
    array_fill(random()::float, ARRAY[1536])::vector,
    0.7,
    20
  );
  ```
  Should complete in < 50ms for 100K jobs

- [ ] Test AI generation queries
  ```sql
  EXPLAIN ANALYZE
  SELECT COUNT(*), SUM(tokens_used)
  FROM ai_generations
  WHERE user_id = 'user-uuid'
  AND created_at >= CURRENT_DATE;
  ```
  Should complete in < 10ms

- [ ] Check index usage
  ```sql
  SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
  ```

- [ ] Monitor table sizes
  ```sql
  SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  ```

---

## Phase 9: Data Migration (if applicable)

### Migrate Existing Users

- [ ] Set default subscription tier
  ```sql
  UPDATE users
  SET subscription_tier = 'free'
  WHERE subscription_tier IS NULL;
  ```

- [ ] Set email verification timestamp
  ```sql
  UPDATE users
  SET email_verified_at = created_at
  WHERE is_email_verified = true
  AND email_verified_at IS NULL;
  ```

### Generate Embeddings for Existing Jobs

- [ ] Count jobs without embeddings
  ```sql
  SELECT COUNT(*) FROM jobs WHERE embedding IS NULL;
  ```

- [ ] Create batch processing script
  ```typescript
  // Example: batch-generate-embeddings.ts
  import OpenAI from 'openai';

  const openai = new OpenAI();
  const jobs = await db.query('SELECT id, description FROM jobs WHERE embedding IS NULL LIMIT 100');

  for (const job of jobs) {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: job.description,
    });

    await db.query(
      'UPDATE jobs SET embedding = $1 WHERE id = $2',
      [embedding.data[0].embedding, job.id]
    );
  }
  ```

- [ ] Run batch processing (monitor costs!)
  ```bash
  npm run generate-embeddings
  ```

---

## Phase 10: Documentation & Handoff

- [ ] Update API documentation with new endpoints
- [ ] Document new environment variables
- [ ] Create user guides for new features
- [ ] Update architecture diagrams
- [ ] Schedule knowledge transfer session
- [ ] Create monitoring dashboards

---

## Phase 11: Monitoring Setup

- [ ] Set up alerts for:
  - [ ] Subscription expirations (7 days before)
  - [ ] High AI token usage (approaching limits)
  - [ ] Slow vector searches (> 100ms)
  - [ ] Failed audit logs

- [ ] Create monitoring queries
  ```sql
  -- Daily subscription report
  SELECT
    subscription_tier,
    COUNT(*) as users,
    COUNT(CASE WHEN subscription_expires_at < NOW() + INTERVAL '7 days' THEN 1 END) as expiring_soon
  FROM users
  GROUP BY subscription_tier;

  -- AI usage report
  SELECT
    DATE(created_at) as date,
    generation_type,
    COUNT(*) as generations,
    SUM(tokens_used) as total_tokens,
    AVG(latency_ms) as avg_latency
  FROM ai_generations
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(created_at), generation_type
  ORDER BY date DESC, generation_type;
  ```

- [ ] Set up log aggregation
- [ ] Configure performance monitoring
- [ ] Enable query performance insights

---

## Phase 12: Security Review

- [ ] Review audit log configuration
- [ ] Verify sensitive data encryption
- [ ] Check foreign key constraints
- [ ] Review index permissions
- [ ] Validate input sanitization
- [ ] Test SQL injection prevention
- [ ] Review GDPR compliance (email_verified_at, audit_log)

---

## Rollback Plan

### If Major Issues Occur

- [ ] Rollback TypeORM migration
  ```bash
  cd services/auth-service
  npm run typeorm migration:revert
  ```

- [ ] Rollback Job Service
  ```sql
  -- See rollback section in migration file
  DROP VIEW IF EXISTS jobs_with_embeddings;
  DROP FUNCTION IF EXISTS find_similar_jobs(UUID, INTEGER);
  DROP FUNCTION IF EXISTS search_jobs_by_embedding(vector(1536), FLOAT, INTEGER);
  DROP INDEX IF EXISTS idx_jobs_embedding_hnsw;
  ALTER TABLE jobs DROP COLUMN IF EXISTS embedding;
  ```

- [ ] Rollback User Service
  ```sql
  -- See rollback section in migration file
  DROP VIEW IF EXISTS active_job_seekers_enhanced;
  DROP FUNCTION IF EXISTS get_user_job_preferences(UUID);
  ALTER TABLE preferences DROP COLUMN IF EXISTS target_locations;
  ALTER TABLE preferences DROP COLUMN IF EXISTS excluded_companies;
  ALTER TABLE preferences DROP COLUMN IF EXISTS experience_level;
  ```

- [ ] Restore from backup
  ```bash
  psql -h localhost -U postgres -d jobpilot < backup_YYYYMMDD.sql
  ```

---

## Post-Implementation

- [ ] Monitor application logs for 24 hours
- [ ] Check database performance metrics
- [ ] Verify no data loss
- [ ] Confirm all features working
- [ ] Update team documentation
- [ ] Schedule review meeting

---

## Success Criteria

### All items must be checked:

- [ ] pgvector extension installed and working
- [ ] All migrations completed successfully
- [ ] No data loss or corruption
- [ ] All tests passing
- [ ] Application starts without errors
- [ ] API endpoints responding correctly
- [ ] Performance benchmarks met
- [ ] Audit logging functional
- [ ] Documentation complete
- [ ] Team trained on new features

---

## Files Reference

### Documentation
- `DATABASE_UPDATES.md` - Complete technical documentation
- `TRACK_C_DELIVERABLES.md` - Deliverables summary
- `QUICK_START_DATABASE.md` - Quick setup guide
- `IMPLEMENTATION_CHECKLIST.md` - This file

### Code Files
- `services/auth-service/src/modules/users/entities/user.entity-updated.ts`
- `services/auth-service/src/modules/ai/entities/ai-generation.entity.ts`
- `services/auth-service/src/migrations/1733280000000-AddSubscriptionAndAITracking.ts`
- `services/auth-service/src/config/typeorm.config.ts`

### SQL Migrations
- `src/services/job-service/migrations/001_add_vector_embedding.sql`
- `src/services/user-service/migrations/001_add_preference_fields.sql`
- `infrastructure/docker/postgres/init-updated.sql`
- `infrastructure/docker/postgres/verify-schema.sql`

---

## Support

If you encounter issues:
1. Check the documentation files
2. Run `verify-schema.sql` to diagnose
3. Review migration logs
4. Check PostgreSQL logs
5. Test connection: `psql -h localhost -U postgres -d jobpilot`

---

## Timeline

Estimated time for complete implementation:

- Phase 1: Install pgvector (30 minutes)
- Phase 2: Auth Service (30 minutes)
- Phase 3: Job Service (15 minutes)
- Phase 4: User Service (15 minutes)
- Phase 5: Verification (15 minutes)
- Phase 6: Audit Logging (15 minutes)
- Phase 7: Testing (1 hour)
- Phase 8: Performance Testing (30 minutes)
- Phase 9: Data Migration (varies by data size)
- Phase 10: Documentation (1 hour)

**Total**: ~4-6 hours (excluding data migration)

---

**Implementation Date**: __________
**Implemented By**: __________
**Verified By**: __________
**Sign-off**: __________

---

✅ **Track C: Database Layer - Implementation Complete!**
