# Job Service - Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL running on port 5434
- ✅ Redis running on port 6381

## Step-by-Step Setup

### 1. Navigate to Service Directory
```bash
cd services/job-service
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment
```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and ensure these values are set:
```env
NODE_ENV=development
PORT=8004
API_PREFIX=api/v1

DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=job_service_db

REDIS_HOST=localhost
REDIS_PORT=6381

AI_SERVICE_URL=http://localhost:8001/api/v1
```

### 4. Create Database
```bash
# Using psql
psql -h localhost -p 5434 -U postgres -c "CREATE DATABASE job_service_db;"

# Or using createdb
createdb -h localhost -p 5434 -U postgres job_service_db
```

### 5. Seed Sample Data
```bash
# This will create 8 sample job listings
npm run seed
```

Expected output:
```
Seeding database...
Starting job seeding...
Successfully seeded 8 jobs
Seeding completed!
```

### 6. Start the Service
```bash
npm run start:dev
```

Expected output:
```
=====================================================
🚀 Job Service is running!
📝 API: http://localhost:8004/api/v1
📚 Swagger Docs: http://localhost:8004/api/v1/docs
🌍 Environment: development
=====================================================
```

### 7. Test the API

Open your browser or use curl to test:

**View Swagger Documentation:**
```
http://localhost:8004/api/v1/docs
```

**Search for jobs:**
```bash
curl "http://localhost:8004/api/v1/jobs/search?keywords=developer&limit=5"
```

**Get a specific job:**
```bash
# First, get a job ID from the search results, then:
curl "http://localhost:8004/api/v1/jobs/{job-id}"
```

**Test salary prediction:**
```bash
curl -X POST "http://localhost:8004/api/v1/jobs/salary-prediction" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Full Stack Developer",
    "location": "San Francisco, CA",
    "experienceYears": 5,
    "skills": ["React", "Node.js", "TypeScript"]
  }'
```

## Available NPM Scripts

```bash
# Development
npm run start:dev          # Start in watch mode
npm run start:debug        # Start with debugger

# Build & Production
npm run build              # Build the service
npm run start:prod         # Run production build

# Database Seeding
npm run seed              # Seed sample jobs
npm run seed:clear        # Clear all jobs
npm run seed:reseed       # Clear and re-seed

# Testing
npm run test              # Run unit tests
npm run test:e2e          # Run end-to-end tests
npm run test:cov          # Run with coverage

# Code Quality
npm run lint              # Lint the code
npm run format            # Format with Prettier
```

## API Endpoints Overview

### Public Endpoints
- `GET /jobs/search` - Search jobs with filters
- `GET /jobs/:id` - Get job details
- `GET /jobs/:id/similar` - Get similar jobs
- `POST /jobs/salary-prediction` - Predict salary

### Protected Endpoints (Require Auth)
- `GET /jobs/recommended` - Get personalized recommendations
- `GET /jobs/saved` - List saved jobs
- `POST /jobs/saved` - Save a job
- `PATCH /jobs/saved/:id` - Update saved job
- `DELETE /jobs/saved/:id` - Unsave a job
- `POST /jobs/match-score` - Calculate match score
- `GET /jobs/:id/interview-questions` - Get interview questions
- `POST /jobs/:id/report` - Report a job

## Troubleshooting

### Database Connection Error
**Error:** `ECONNREFUSED` or `Connection refused`

**Solution:**
1. Check if PostgreSQL is running: `pg_isready -h localhost -p 5434`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -h localhost -p 5434 -U postgres -l`

### Redis Connection Error
**Error:** `Redis connection failed`

**Solution:**
1. Check if Redis is running: `redis-cli -p 6381 ping`
2. Verify port in `.env`
3. Service will work without Redis (caching disabled)

### Port Already in Use
**Error:** `Port 8004 is already in use`

**Solution:**
1. Change port in `.env`: `PORT=8005`
2. Or kill the process using the port

### Seed Command Not Working
**Error:** `Cannot find module`

**Solution:**
1. Ensure dependencies are installed: `npm install`
2. Build the project first: `npm run build`
3. Or use: `npx ts-node -r tsconfig-paths/register src/seeds/seed.ts seed`

## Verifying the Installation

Run these checks to verify everything is working:

1. **Health Check:**
   ```bash
   curl http://localhost:8004/api/v1/health
   ```
   Should return: `{ "status": "ok" }`

2. **Count Jobs:**
   ```bash
   curl "http://localhost:8004/api/v1/jobs/search?limit=1" | jq '.pagination.total'
   ```
   Should return: `8`

3. **Check Swagger:**
   Open: http://localhost:8004/api/v1/docs
   Should see interactive API documentation

## Next Steps

1. **Integrate with Frontend:**
   - Update frontend API client to point to `http://localhost:8004/api/v1`
   - Test all endpoints from the web app

2. **Set Up AI Service:**
   - Start the AI service on port 8001
   - Test recommendation and match score features

3. **Configure Elasticsearch (Optional):**
   - Install and start Elasticsearch
   - Update `.env` with Elasticsearch URL
   - Restart service to enable advanced search

4. **Add More Jobs:**
   - Use the aggregator service to fetch real jobs
   - Or manually add jobs via the API

## Support

For issues or questions:
- Check the main README.md
- Review IMPLEMENTATION_SUMMARY.md
- Check Swagger docs for API details
- Review logs in console for error messages
