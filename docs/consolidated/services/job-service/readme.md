# Job Service

The Job Service is a NestJS-based microservice that handles job listings, search, aggregation, and recommendations for the Job-Apply-Platform.

## Features

- Job search with advanced filters (location, salary, remote type, experience level, skills)
- Elasticsearch integration for fast and relevant search results
- Job recommendations powered by AI service
- Saved jobs management (bookmark, tag, notes)
- Resume-to-job match scoring
- Interview questions generation
- Salary prediction
- Job reporting system
- Similar jobs recommendations
- Multi-source job aggregation support

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Search Engine**: Elasticsearch
- **Cache**: Redis with cache-manager
- **Queue**: Bull (Redis-based)
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Elasticsearch 8+ (optional, can use DB-based search initially)

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
```

## Database Setup

The service uses PostgreSQL. Update your `.env` file with database connection details:

```env
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=job_service_db
```

Run migrations (if any):

```bash
npm run migration:run
```

## Seeding Data

To populate the database with sample job listings for testing:

```bash
# Seed the database with sample jobs
npm run seed

# Clear all jobs from the database
npm run seed:clear

# Clear and re-seed the database
npm run seed:reseed
```

## Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The service will be available at:
- API: http://localhost:8004/api/v1
- Swagger Docs: http://localhost:8004/api/v1/docs

## API Endpoints

### Job Search and Retrieval

- `GET /jobs/search` - Search jobs with filters
  - Query params: `keywords`, `location`, `remote_type`, `salary_min`, `salary_max`, `experience_level`, `employment_type`, `skills`, `page`, `limit`, `sort_by`, `sort_order`

- `GET /jobs/:id` - Get job details by ID

- `GET /jobs/recommended` - Get AI-recommended jobs (requires auth)
  - Query params: `limit`, `resumeId`

- `GET /jobs/:id/similar` - Get similar jobs
  - Query params: `limit`

### Saved Jobs Management

- `GET /jobs/saved` - List user's saved jobs (requires auth)
  - Query params: `page`, `limit`, `tags`

- `POST /jobs/saved` - Save a job (requires auth)
  - Body: `{ jobId, notes?, tags? }`

- `PATCH /jobs/saved/:id` - Update saved job (requires auth)
  - Body: `{ notes?, tags?, status? }`

- `DELETE /jobs/saved/:id` - Unsave a job (requires auth)

### AI-Powered Features

- `POST /jobs/match-score` - Calculate resume-job match score (requires auth)
  - Body: `{ jobId, resumeId }`
  - Returns: Match percentage, breakdown, matched/missing skills, recommendations

- `GET /jobs/:id/interview-questions` - Get AI-generated interview questions
  - Returns: Technical, behavioral, and company-specific questions

- `POST /jobs/salary-prediction` - Predict salary for given criteria
  - Body: `{ jobTitle, location, experienceYears, skills, education? }`
  - Returns: Predicted salary range, confidence, factors, market data

### Reporting

- `POST /jobs/:id/report` - Report a job posting (requires auth)
  - Body: `{ reason, details? }`

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=8004
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=job_service_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6381
REDIS_PASSWORD=
REDIS_DB=0

# Elasticsearch (optional)
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=

# AI Service
AI_SERVICE_URL=http://localhost:8001/api/v1

# External Job Board APIs
INDEED_API_KEY=
LINKEDIN_API_KEY=
GLASSDOOR_API_KEY=
```

## Architecture

### Database Schema

**Jobs Table**: Stores job listings from various sources
- Core fields: title, company, location, description, requirements, salary
- Metadata: remote_type, experience_level, employment_type, skills
- Tracking: view_count, application_count, save_count
- Status: is_active, is_featured, is_verified

**Saved Jobs Table**: User bookmarks
- Foreign key to jobs table
- User-specific fields: notes, tags, status, applied_at

### Search Implementation

The service uses Elasticsearch for advanced search capabilities:

- Full-text search across job titles, descriptions, and skills
- Faceted search with aggregations (remote types, experience levels, locations)
- Relevance scoring and boosting
- Geo-location based search
- Autocomplete suggestions

Fallback to database-based search is available if Elasticsearch is not configured.

### Caching Strategy

Redis is used for caching:
- Job details (TTL: 5 minutes)
- Search results (TTL: 2 minutes)
- Recommendations (TTL: 10 minutes)
- Aggregation facets (TTL: 15 minutes)

### AI Integration

The service integrates with the AI service for:
- Resume-to-job matching and scoring
- Personalized job recommendations
- Interview question generation
- Salary prediction and analysis

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Development

### Adding a New Job Source

1. Implement the `JobProvider` interface in `src/modules/aggregator/providers/`
2. Add API credentials to `.env`
3. Register the provider in `AggregatorModule`
4. Configure cron schedule in `AggregatorService`

### Customizing Search

Modify Elasticsearch mappings in `src/modules/search/search.service.ts`:
- Adjust analyzers for better text matching
- Add custom fields to the index
- Update aggregations for new facets

## Monitoring and Logging

The service includes:
- Structured logging with correlation IDs
- Health checks at `/health`
- Request/response logging
- Error tracking
- Performance metrics

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong database credentials
3. Enable SSL for PostgreSQL and Redis
4. Configure Elasticsearch security
5. Set up monitoring and alerting
6. Enable rate limiting
7. Use CDN for static assets

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5434`
- Check credentials in `.env`
- Ensure database exists: `createdb job_service_db`

### Elasticsearch Not Working
- Service works without Elasticsearch using DB search
- Check Elasticsearch status: `curl http://localhost:9200`
- Verify node URL in `.env`

### Redis Connection Errors
- Check Redis is running: `redis-cli -p 6381 ping`
- Verify port in `.env`
- Service degrades gracefully without Redis (no caching)

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Update documentation
4. Submit pull request

## License

MIT
