# Job Service

Job discovery, search, and management microservice for ApplyForUs AI Platform.

## Overview

The Job Service is responsible for job listing management, search functionality, job aggregation from multiple sources, saved jobs, job alerts, company information, and AI-powered job matching features.

## Features

- Job Search with filters (location, salary, remote type, experience level)
- Job Aggregation from multiple sources (LinkedIn, Indeed, Glassdoor)
- Saved Jobs with notes and tags
- Job Alerts based on user preferences
- Company Profiles and reviews
- AI-Powered Matching (job-resume match scoring)
- Interview Prep (AI-generated interview questions)
- Salary Prediction
- Redis Caching for high performance

## Tech Stack

- Runtime: Node.js 20+
- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL (via TypeORM)
- Cache: Redis
- Queue: Bull (Redis-based)

## API Endpoints

### Jobs - Public

- GET /api/v1/jobs/search - Search jobs with filters
- GET /api/v1/jobs/:id - Get job details
- GET /api/v1/jobs/:id/similar - Get similar jobs
- GET /api/v1/jobs/:id/interview-questions - Get interview questions
- POST /api/v1/jobs/salary-prediction - Get salary prediction
- GET /api/v1/jobs/health - Health check

### Jobs - Protected

- GET /api/v1/jobs/recommended - Get recommendations
- GET /api/v1/jobs/saved - Get saved jobs
- POST /api/v1/jobs/saved - Save a job
- DELETE /api/v1/jobs/saved/:id - Remove saved job
- PATCH /api/v1/jobs/saved/:id - Update saved job
- POST /api/v1/jobs/match-score - Calculate match score
- POST /api/v1/jobs/:id/report - Report a job

### Companies

- GET /api/v1/companies/search - Search companies
- GET /api/v1/companies/:id - Get company details
- GET /api/v1/companies/:id/jobs - Get company jobs
- GET /api/v1/companies/:id/reviews - Get reviews

## Environment Variables

- PORT (8002)
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- REDIS_HOST, REDIS_PORT
- AI_SERVICE_URL
- JWT_SECRET

## Database Schema Overview

### Jobs
id, external_id, source, title, company_id, location, remote_type, salary_min, salary_max, description, skills[], experience_level, employment_type, is_active

### Saved Jobs
id, user_id, job_id, notes, tags[], status

### Job Alerts
id, user_id, name, keywords, frequency, is_active

### Companies
id, name, description, industry, average_rating

## Getting Started

pnpm install && cp .env.example .env && pnpm migration:run && pnpm start:dev

Service runs on http://localhost:8002

## Caching

Search Results: 5min, Job Details: 10min, Similar Jobs: 5min, Recommended: 2min

## Deployment

docker build -t applyforus/job-service:latest .
docker run -p 8002:8002 --env-file .env applyforus/job-service:latest

## License

MIT
