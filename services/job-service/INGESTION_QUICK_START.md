# Job Ingestion Engine - Quick Start Guide

Get the job ingestion engine up and running in minutes.

## Prerequisites

- PostgreSQL database running
- Redis running (for Bull queues)
- Node.js 18+ installed
- API keys for job sources (optional, but needed for production use)

## Step 1: Database Setup

The ingestion module uses three new database tables. They will be created automatically in development mode when you start the service.

Tables created:
- `job_sources` - Configuration for each job source
- `ingestion_jobs` - Tracks each ingestion run
- `raw_job_listings` - Stores raw job data before normalization

## Step 2: Environment Variables

Add the following to your `.env` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=applyforus

# Redis (for Bull queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Optional: API Keys for job sources
LINKEDIN_API_KEY=your-linkedin-api-key
INDEED_API_KEY=your-indeed-publisher-id
GLASSDOOR_API_KEY=your-glassdoor-api-key
GOOGLE_JOBS_PROJECT_ID=your-google-cloud-project-id
ZIPRECRUITER_API_KEY=your-ziprecruiter-api-key

# ATS Platforms (if using)
GREENHOUSE_BOARD_TOKEN=company-board-token
LEVER_COMPANY_SUBDOMAIN=your-company
WORKDAY_COMPANY_URL=https://company.wd5.myworkdayjobs.com/site
BAMBOOHR_SUBDOMAIN=your-company
BAMBOOHR_API_KEY=your-api-key

# Government (if using)
USAJOBS_API_KEY=your-usajobs-api-key
USAJOBS_EMAIL=your-email@example.com
```

## Step 3: Start the Service

```bash
# Install dependencies (if not already done)
pnpm install

# Start the job-service
cd services/job-service
pnpm run start:dev
```

The service will start on `http://localhost:3002` (or your configured port).

## Step 4: Register Your First Job Source

Let's register Indeed as a job source:

```bash
curl -X POST http://localhost:3002/api/v1/ingestion/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Indeed US Jobs",
    "provider": "indeed",
    "type": "job_board",
    "credentials": {
      "api_key": "YOUR_INDEED_PUBLISHER_ID"
    },
    "config": {
      "requests_per_minute": 100,
      "requests_per_day": 10000,
      "countries": ["us"],
      "page_size": 50
    },
    "sync_interval_minutes": 60
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Indeed US Jobs",
    "provider": "indeed",
    "status": "active",
    "is_enabled": true,
    "next_sync_at": "2025-01-15T11:00:00Z"
  }
}
```

## Step 5: Trigger Manual Ingestion

Trigger a manual ingestion to test:

```bash
# Replace :sourceId with the ID from step 4
curl -X POST http://localhost:3002/api/v1/ingestion/run/:sourceId
```

Response:
```json
{
  "success": true,
  "message": "Ingestion job queued successfully",
  "data": {
    "jobId": "ingestion-job-uuid",
    "sourceId": "source-uuid",
    "status": "pending"
  }
}
```

## Step 6: Monitor Ingestion Progress

Check the ingestion status:

```bash
# Overall status
curl http://localhost:3002/api/v1/ingestion/status

# Detailed statistics
curl http://localhost:3002/api/v1/ingestion/stats

# List ingestion jobs
curl http://localhost:3002/api/v1/ingestion/jobs

# Get specific job details
curl http://localhost:3002/api/v1/ingestion/jobs/:jobId
```

## Step 7: View Ingested Jobs

Check the jobs table:

```bash
curl http://localhost:3002/api/v1/jobs?limit=10
```

You should see newly ingested jobs from Indeed!

## Testing with Free Sources

Some sources don't require API keys for testing:

### RemoteOK (No API key needed)

```bash
curl -X POST http://localhost:3002/api/v1/ingestion/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RemoteOK Jobs",
    "provider": "remoteok",
    "type": "remote_platform",
    "config": {
      "page_size": 50
    },
    "sync_interval_minutes": 120
  }'
```

### We Work Remotely (No API key needed)

```bash
curl -X POST http://localhost:3002/api/v1/ingestion/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "We Work Remotely",
    "provider": "weworkremotely",
    "type": "remote_platform",
    "config": {
      "page_size": 50
    },
    "sync_interval_minutes": 180
  }'
```

## Common Operations

### List All Sources

```bash
curl http://localhost:3002/api/v1/ingestion/sources
```

### Get Supported Providers

```bash
curl http://localhost:3002/api/v1/ingestion/providers
```

### Pause a Source

```bash
curl -X POST http://localhost:3002/api/v1/ingestion/sources/:sourceId/pause
```

### Resume a Source

```bash
curl -X POST http://localhost:3002/api/v1/ingestion/sources/:sourceId/resume
```

### Check Source Health

```bash
curl -X POST http://localhost:3002/api/v1/ingestion/sources/:sourceId/health-check
```

### Trigger All Sources

```bash
curl -X POST http://localhost:3002/api/v1/ingestion/run-all
```

## Scheduled Ingestion

The system automatically runs ingestion based on `sync_interval_minutes`:

- **Every 1 minute**: Checks high-priority sources (interval ≤ 5 min)
- **Every 5 minutes**: Checks all scheduled sources
- **Every hour**: Updates source health metrics
- **Daily at 2 AM**: Archives old raw listings
- **Daily at 9 AM**: Generates daily report

No manual intervention needed!

## Viewing Logs

Watch the logs to see ingestion activity:

```bash
# In the job-service directory
tail -f logs/app.log

# Or if running in dev mode, watch the console
```

You'll see logs like:
```
[IngestionService] Starting ingestion for Indeed US Jobs (Job: uuid)
[IngestionService] Completed ingestion: 50 new, 10 updated, 5 duplicates
```

## Production Setup

For production:

1. **Get API Keys**: Register with each job board/platform
2. **Configure Rate Limits**: Set appropriate limits based on your API tier
3. **Adjust Sync Intervals**: Balance freshness vs. API costs
4. **Monitor Health**: Set up alerts for failed ingestions
5. **Database Indexes**: Ensure proper indexes are created (automatic in dev)
6. **Scale Redis**: Use Redis Cluster for high throughput
7. **Scale Workers**: Increase Bull queue workers if needed

## Troubleshooting

### Jobs not appearing?

1. Check ingestion job status:
   ```bash
   curl http://localhost:3002/api/v1/ingestion/jobs?limit=5
   ```

2. Look for errors in the response

3. Check source is active:
   ```bash
   curl http://localhost:3002/api/v1/ingestion/sources/:sourceId
   ```

### Source keeps failing?

1. Check health:
   ```bash
   curl -X POST http://localhost:3002/api/v1/ingestion/sources/:sourceId/health-check
   ```

2. Verify API credentials

3. Check rate limits aren't exceeded

4. Review error logs

### High duplicate rate?

This is normal! The deduplication system prevents storing the same job multiple times.

Expected duplicate rates:
- **10-20%**: Normal (jobs reposted, updated, or cross-posted)
- **>50%**: May indicate over-fetching or sources with lots of reposts

## Next Steps

1. **Add More Sources**: Register LinkedIn, Glassdoor, Google Jobs, etc.
2. **Configure ATS**: Add Greenhouse, Lever for company-specific jobs
3. **Set Up Monitoring**: Use the stats endpoints to track performance
4. **Customize Adapters**: Modify adapters for specific use cases
5. **Build Dashboard**: Create a UI to manage sources and view stats

## Support

For issues or questions:
- Check the main README: `services/job-service/src/modules/ingestion/README.md`
- Review adapter code for specific sources
- Check NestJS logs for detailed error messages

## Summary

You now have a production-ready job ingestion engine running! It will:

- ✅ Automatically fetch jobs from configured sources
- ✅ Deduplicate incoming jobs
- ✅ Handle rate limits and retries
- ✅ Monitor source health
- ✅ Provide real-time statistics
- ✅ Scale with your needs

Happy job hunting! 🚀
