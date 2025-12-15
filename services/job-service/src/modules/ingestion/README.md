# Job Ingestion Engine

A comprehensive, real-time job ingestion system that pulls jobs from multiple verified sources globally.

## Features

- **Multi-Source Support**: Integrates with 14+ job sources including LinkedIn, Indeed, Glassdoor, Google Jobs, ZipRecruiter, and more
- **ATS Integration**: Supports major ATS platforms (Greenhouse, Lever, Workday, BambooHR)
- **Remote Job Platforms**: Integrates with Wellfound, RemoteOK, We Work Remotely
- **Government Jobs**: Supports USAJobs and UK Civil Service
- **Near Real-Time**: Configurable sync intervals from 1 minute to hours
- **Intelligent Deduplication**: Advanced fingerprinting and similarity matching
- **Rate Limit Compliance**: Built-in rate limiting for each source
- **Health Monitoring**: Automatic health checks and error recovery
- **Scheduled Ingestion**: Cron-based automatic syncing
- **Queue-Based Processing**: Uses Bull queues for scalable processing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ingestion Module                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Sources    │───▶│   Adapters   │───▶│ Processors   │  │
│  │  Management  │    │   Factory    │    │   (Queue)    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Scheduler   │    │Deduplication │    │  Raw Jobs    │  │
│  │  (Cron)      │    │   Service    │    │   Storage    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Supported Sources

### Job Boards (5)
- **LinkedIn**: LinkedIn Jobs API
- **Indeed**: Indeed Publisher API
- **Glassdoor**: Glassdoor API
- **Google Jobs**: Google Cloud Talent Solution
- **ZipRecruiter**: ZipRecruiter API

### ATS Platforms (4)
- **Greenhouse**: Job Board API
- **Lever**: Public postings API
- **Workday**: Job board feeds
- **BambooHR**: Applicant tracking API

### Remote Platforms (3)
- **Wellfound**: AngelList Talent API
- **RemoteOK**: Public API
- **We Work Remotely**: Job feed

### Government (2)
- **USAJobs**: Official API
- **UK Civil Service**: Civil Service Jobs API

## Database Entities

### JobSource
Stores configuration for each job source.

```typescript
{
  id: uuid
  name: string
  provider: SourceProvider
  type: SourceType
  status: SourceStatus
  credentials: { api_key, api_secret, etc. }
  config: { rate_limits, filters, etc. }
  sync_interval_minutes: number
  last_sync_at: timestamp
  next_sync_at: timestamp
  total_jobs_ingested: number
  consecutive_failures: number
  // ... more fields
}
```

### IngestionJob
Tracks each ingestion run.

```typescript
{
  id: uuid
  job_source_id: uuid
  status: IngestionStatus
  trigger: IngestionTrigger
  started_at: timestamp
  completed_at: timestamp
  total_fetched: number
  total_new: number
  total_updated: number
  total_duplicates: number
  total_errors: number
  // ... more fields
}
```

### RawJobListing
Stores raw job data before normalization.

```typescript
{
  id: uuid
  job_source_id: uuid
  external_id: string
  fingerprint: string (SHA256 hash)
  raw_data: jsonb
  processing_status: ProcessingStatus
  duplicate_of_id: uuid
  processed_job_id: uuid
  is_latest: boolean
  // ... more fields
}
```

## API Endpoints

### Source Management

```bash
# Register a new job source
POST /api/v1/ingestion/sources
{
  "name": "LinkedIn Jobs",
  "provider": "linkedin",
  "type": "job_board",
  "credentials": {
    "api_key": "your-api-key"
  },
  "config": {
    "requests_per_minute": 60,
    "sync_interval_minutes": 30
  }
}

# List all sources
GET /api/v1/ingestion/sources?status=active

# Get source details
GET /api/v1/ingestion/sources/:id

# Pause a source
POST /api/v1/ingestion/sources/:id/pause

# Resume a source
POST /api/v1/ingestion/sources/:id/resume

# Check source health
POST /api/v1/ingestion/sources/:id/health-check
```

### Ingestion Control

```bash
# Trigger manual ingestion for a source
POST /api/v1/ingestion/run/:sourceId

# Trigger ingestion for all active sources
POST /api/v1/ingestion/run-all

# Get ingestion status
GET /api/v1/ingestion/status?sourceId=:id

# Get ingestion statistics
GET /api/v1/ingestion/stats?sourceId=:id

# List ingestion jobs
GET /api/v1/ingestion/jobs?sourceId=:id&status=completed&limit=50

# Get ingestion job details
GET /api/v1/ingestion/jobs/:id

# Get supported providers
GET /api/v1/ingestion/providers
```

## Usage Examples

### 1. Register Indeed as a Source

```typescript
const response = await fetch('/api/v1/ingestion/sources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Indeed US Jobs',
    provider: 'indeed',
    type: 'job_board',
    credentials: {
      api_key: process.env.INDEED_API_KEY,
    },
    config: {
      requests_per_minute: 100,
      requests_per_day: 10000,
      countries: ['us'],
      page_size: 50,
    },
    sync_interval_minutes: 60, // Sync every hour
  }),
});
```

### 2. Trigger Manual Ingestion

```typescript
const response = await fetch('/api/v1/ingestion/run/:sourceId', {
  method: 'POST',
});

console.log(response.data.jobId); // Track ingestion job
```

### 3. Monitor Ingestion Progress

```typescript
// Get overall status
const status = await fetch('/api/v1/ingestion/status');
console.log(status.data);
// {
//   total: 150,
//   pending: 5,
//   inProgress: 2,
//   completed: 140,
//   failed: 3,
//   successRate: 93.3
// }

// Get detailed statistics
const stats = await fetch('/api/v1/ingestion/stats');
console.log(stats.data);
// {
//   ingestion: {
//     totalJobs: 50000,
//     totalNew: 30000,
//     totalUpdated: 15000,
//     totalDuplicates: 5000,
//     deduplicationRate: 10
//   },
//   deduplication: {
//     totalRawListings: 55000,
//     uniqueListings: 50000,
//     duplicates: 5000,
//     deduplicationRate: 9.09
//   }
// }
```

## Deduplication

The system uses intelligent deduplication to avoid storing duplicate jobs:

1. **Fingerprinting**: Generates SHA256 hash from key fields (title, company, location, description)
2. **Exact Match**: Checks for exact fingerprint matches
3. **Fuzzy Match**: Uses Levenshtein distance for similarity scoring
4. **Threshold**: Jobs with >85% similarity are marked as duplicates

```typescript
// Deduplication example
const job1 = {
  title: 'Senior Software Engineer',
  companyName: 'Google',
  location: 'Mountain View, CA',
  description: 'Build amazing products...',
};

const job2 = {
  title: 'Sr. Software Engineer',
  companyName: 'Google Inc.',
  location: 'Mountain View, California',
  description: 'Build amazing products...',
};

// These will be detected as duplicates (similarity > 85%)
```

## Scheduled Ingestion

The system automatically runs ingestion based on configured schedules:

```typescript
// Cron Jobs
- Every 1 minute: Check high-priority sources (interval <= 5 min)
- Every 5 minutes: Check all scheduled sources
- Every hour: Update source health
- Daily at 2 AM: Archive old raw listings (90+ days)
- Daily at 9 AM: Generate daily ingestion report
```

## Rate Limiting

Each source respects its configured rate limits:

```typescript
{
  config: {
    requests_per_minute: 60,
    requests_per_hour: 3600,
    requests_per_day: 50000,
    timeout_ms: 30000,
    retry_attempts: 3,
    retry_delay_ms: 1000
  }
}
```

The system automatically:
- Tracks request counts per minute/hour/day
- Waits when limits are reached
- Resets counters at appropriate intervals
- Throws errors for daily limit violations

## Error Handling

The system includes comprehensive error handling:

1. **Retry Logic**: Failed requests are retried with exponential backoff
2. **Source Health**: Sources with 5+ consecutive failures are marked as ERROR
3. **Auto-Recovery**: ERROR sources are automatically re-enabled after recovery
4. **Error Tracking**: All errors are logged with full stack traces
5. **Queue Retries**: Bull queue handles job retries automatically

## Monitoring

Monitor ingestion health:

```bash
# Check source health
GET /api/v1/ingestion/sources/:id/health-check

# Response
{
  "isHealthy": true,
  "latencyMs": 234,
  "message": "Health check passed",
  "timestamp": "2025-01-15T10:30:00Z"
}

# Check ingestion status
GET /api/v1/ingestion/status

# Get detailed statistics
GET /api/v1/ingestion/stats
```

## Performance

- **Concurrent Processing**: Uses Bull queues for parallel processing
- **Batch Processing**: Processes jobs in batches for efficiency
- **Database Optimization**: Indexed queries for fast deduplication
- **Archival**: Automatically archives old raw listings to reduce database size

## Configuration

Environment variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5434
DB_DATABASE=applyforus

# Redis (for Bull queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# API Keys (for each source)
LINKEDIN_API_KEY=your-key
INDEED_API_KEY=your-key
GLASSDOOR_API_KEY=your-key
# ... etc
```

## Development

```bash
# Run migrations
npm run migration:run

# Start development server
npm run start:dev

# Run tests
npm test

# Generate migration
npm run migration:generate -- -n AddIngestionTables
```

## Production Deployment

1. Set all required environment variables
2. Run database migrations
3. Configure API credentials for each source
4. Register job sources via API
5. Monitor ingestion health and statistics

## Troubleshooting

### Source not syncing?
- Check source status: `GET /api/v1/ingestion/sources/:id`
- Check if `status` is `active` and `is_enabled` is `true`
- Check `next_sync_at` timestamp
- Check `consecutive_failures` count

### High duplicate rate?
- Review fingerprinting logic in `deduplication.service.ts`
- Adjust similarity threshold (currently 85%)
- Check if sources are posting duplicate jobs

### Rate limit errors?
- Review source `config.requests_per_*` settings
- Check if limits match API provider's limits
- Review `requests_today/hour/minute` counters

## License

MIT
