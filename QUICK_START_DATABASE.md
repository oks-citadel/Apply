# Quick Start: Database Updates

## TL;DR

New database features added:
- Subscription tiers for users
- AI generation tracking
- Vector embeddings for semantic job search
- Enhanced user preferences

## 5-Minute Setup

### 1. Install pgvector (if not already installed)

**Docker** (Recommended):
```bash
# Use updated init script (includes pgvector)
cd infrastructure/docker/postgres
cp init-updated.sql init.sql
docker-compose up -d postgres
```

**Local PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-15-pgvector

# macOS
brew install pgvector
```

### 2. Run All Migrations

```bash
# Auth Service (TypeORM)
cd services/auth-service
npm run typeorm migration:run

# Job Service (SQL)
psql -h localhost -U postgres -d jobpilot -f src/services/job-service/migrations/001_add_vector_embedding.sql

# User Service (SQL)
psql -h localhost -U postgres -d jobpilot -f src/services/user-service/migrations/001_add_preference_fields.sql
```

### 3. Update User Entity

```bash
cd services/auth-service/src/modules/users/entities
cp user.entity-updated.ts user.entity.ts
```

### 4. Verify Installation

```bash
psql -h localhost -U postgres -d jobpilot -f infrastructure/docker/postgres/verify-schema.sql
```

Done! ✅

---

## What's New

### 1. User Subscriptions

```typescript
// User now has subscription fields
user.subscriptionTier // 'free' | 'pro' | 'premium' | 'enterprise'
user.subscriptionExpiresAt // Date
user.emailVerifiedAt // Date
user.hasActiveSubscription // boolean (getter)
```

**Usage**:
```typescript
// Check subscription
if (user.subscriptionTier === SubscriptionTier.PRO) {
  // Pro features
}

// Check if active
if (user.hasActiveSubscription) {
  // Allow access
}
```

### 2. AI Generation Tracking

```typescript
// New entity: AIGeneration
const generation = new AIGeneration();
generation.userId = user.id;
generation.generationType = GenerationType.SUMMARY;
generation.inputData = { resume: resumeText };
generation.outputData = { summary: generatedSummary };
generation.modelUsed = 'gpt-4';
generation.tokensUsed = 1500;
generation.latencyMs = 2300;
await aiGenerationRepository.save(generation);
```

**Track usage**:
```sql
SELECT COUNT(*), SUM(tokens_used)
FROM ai_generations
WHERE user_id = 'uuid'
AND created_at >= CURRENT_DATE;
```

### 3. Semantic Job Search

```sql
-- Search jobs by meaning, not just keywords
SELECT * FROM search_jobs_by_embedding(
    $1::vector(1536),  -- OpenAI embedding
    0.7,               -- 70% similarity threshold
    20                 -- Top 20 results
);
```

**Generate embeddings**:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI();
const embedding = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: jobDescription,
});

await db.query(
  'UPDATE jobs SET embedding = $1 WHERE id = $2',
  [embedding.data[0].embedding, jobId]
);
```

### 4. Enhanced Preferences

```sql
-- New preference fields
UPDATE preferences SET
  experience_level = 'senior',
  excluded_companies = ARRAY['Company A', 'Company B'],
  target_locations = ARRAY['New York', 'remote']
WHERE profile_id = $1;
```

---

## Common Operations

### Check Subscription Status

```sql
SELECT
  email,
  subscription_tier,
  subscription_expires_at,
  CASE
    WHEN subscription_tier = 'free' THEN true
    WHEN subscription_expires_at > NOW() THEN true
    ELSE false
  END as is_active
FROM users
WHERE id = 'user-uuid';
```

### Track AI Usage

```sql
-- Daily usage by user
SELECT
  user_id,
  COUNT(*) as generations,
  SUM(tokens_used) as tokens,
  AVG(latency_ms) as avg_latency
FROM ai_generations
WHERE created_at >= CURRENT_DATE
GROUP BY user_id;

-- Usage by type
SELECT
  generation_type,
  COUNT(*) as count,
  AVG(tokens_used) as avg_tokens
FROM ai_generations
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY generation_type;
```

### Semantic Search

```typescript
// 1. Generate query embedding
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: userSearchQuery,
});

// 2. Search database
const results = await db.query(`
  SELECT
    id,
    title,
    company_name,
    1 - (embedding <=> $1) as similarity
  FROM jobs
  WHERE status = 'active'
  AND embedding IS NOT NULL
  ORDER BY embedding <=> $1
  LIMIT 20
`, [queryEmbedding.data[0].embedding]);
```

### Filter by Preferences

```sql
-- Get jobs matching user preferences
WITH user_prefs AS (
  SELECT * FROM get_user_job_preferences('user-uuid')
)
SELECT j.*
FROM jobs j, user_prefs p
WHERE j.status = 'active'
AND j.experience_level = p.experience_level
AND j.salary_max >= p.salary_min
AND NOT (j.company_name = ANY(p.excluded_companies))
AND (
  j.location = ANY(p.target_locations)
  OR j.remote_policy = 'remote'
  OR 'remote' = ANY(p.target_locations)
);
```

---

## Environment Variables

Add to `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=jobpilot

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Optional
DB_LOGGING=true
DB_SSL=false
DB_MAX_CONNECTIONS=20
```

---

## API Examples

### Subscription Endpoints (to implement)

```typescript
// GET /users/me/subscription
{
  tier: 'pro',
  expiresAt: '2024-12-31T23:59:59Z',
  isActive: true
}

// POST /users/me/subscription
{
  tier: 'premium',
  billingPeriod: 'monthly' | 'yearly'
}
```

### AI Generation Endpoints (to implement)

```typescript
// POST /ai/generate
{
  type: 'summary' | 'bullets' | 'cover_letter',
  input: { ... }
}
// Response:
{
  output: { ... },
  tokensUsed: 1500,
  latencyMs: 2300
}

// GET /ai/usage
{
  today: { generations: 15, tokens: 25000 },
  thisMonth: { generations: 450, tokens: 750000 },
  limit: 1000000 // based on subscription
}
```

### Semantic Search Endpoint (to implement)

```typescript
// POST /jobs/search/semantic
{
  query: "senior backend engineer python kubernetes",
  threshold: 0.7,
  limit: 20
}
// Response:
{
  jobs: [
    {
      id: '...',
      title: '...',
      similarity: 0.89
    }
  ]
}
```

---

## Troubleshooting

### pgvector not found

```bash
# Check if installed
psql -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"

# Install
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### Migration fails

```bash
# Check connection
psql -h localhost -U postgres -d jobpilot -c "SELECT version();"

# Check existing tables
psql -h localhost -U postgres -d jobpilot -c "\dt"

# Rollback and retry
npm run typeorm migration:revert
npm run typeorm migration:run
```

### Slow vector search

```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM search_jobs_by_embedding($1, 0.7, 20);

-- Rebuild index if needed
REINDEX INDEX idx_jobs_embedding_hnsw;
```

---

## Testing

### Unit Tests

```typescript
// User subscription
describe('User Subscription', () => {
  it('should check active subscription', () => {
    const user = new User();
    user.subscriptionTier = SubscriptionTier.PRO;
    user.subscriptionExpiresAt = new Date('2024-12-31');
    expect(user.hasActiveSubscription).toBe(true);
  });
});

// AI Generation
describe('AI Generation', () => {
  it('should track generation', async () => {
    const generation = await aiService.generate({
      type: GenerationType.SUMMARY,
      input: { resume: 'test' }
    });
    expect(generation.tokensUsed).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// Semantic search
describe('Semantic Job Search', () => {
  it('should find similar jobs', async () => {
    const results = await jobService.searchSemantic(
      'python developer',
      0.7,
      10
    );
    expect(results.length).toBeLessThanOrEqual(10);
    expect(results[0].similarity).toBeGreaterThan(0.7);
  });
});
```

---

## Performance Tips

1. **Vector Search**
   - Use appropriate threshold (0.7 is good default)
   - Limit results (20-50 max)
   - Consider caching frequent queries

2. **AI Tracking**
   - Batch inserts if tracking many generations
   - Archive old records (>6 months)
   - Index by user_id and created_at

3. **Preferences**
   - Use GIN indexes for array columns
   - Cache user preferences in Redis
   - Update preferences sparingly

---

## Monitoring

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE tablename IN ('users', 'ai_generations', 'jobs')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Next Steps

1. **Implement API endpoints** for new features
2. **Update frontend** to use new fields
3. **Set up monitoring** for AI usage and costs
4. **Configure billing** based on subscription tiers
5. **Generate embeddings** for existing jobs

---

## Resources

- Full Documentation: `DATABASE_UPDATES.md`
- Deliverables Summary: `TRACK_C_DELIVERABLES.md`
- Verification Script: `infrastructure/docker/postgres/verify-schema.sql`
- Migration Files:
  - Auth: `services/auth-service/src/migrations/1733280000000-AddSubscriptionAndAITracking.ts`
  - Jobs: `src/services/job-service/migrations/001_add_vector_embedding.sql`
  - Users: `src/services/user-service/migrations/001_add_preference_fields.sql`

---

## Support

Questions? Check:
1. `DATABASE_UPDATES.md` - Comprehensive guide
2. Verify installation: Run `verify-schema.sql`
3. Check logs: TypeORM and PostgreSQL logs
4. Test connection: `psql -h localhost -U postgres -d jobpilot`

---

**Quick Start Complete!** 🚀

Now you have:
- ✅ Subscription management
- ✅ AI usage tracking
- ✅ Semantic job search
- ✅ Enhanced preferences
- ✅ Audit logging

Start building features! 💪
