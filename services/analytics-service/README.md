# Analytics Service

Analytics and metrics service for ApplyForUs AI Platform, providing event tracking, dashboard metrics, and SLA contract management.

## Overview

The Analytics Service tracks user activity, application events, and platform metrics. It provides dashboard analytics, application funnel statistics, and manages Service Level Agreement (SLA) contracts with interview guarantees for premium users.

## Features

- **Event Tracking**: Track user actions and application events
- **Dashboard Metrics**: Aggregated analytics for dashboards
- **Application Funnel**: Conversion tracking from view to hire
- **SLA Contracts**: Interview guarantee management
- **Violation Handling**: SLA breach detection and remediation
- **Data Export**: CSV and JSON data exports
- **Scheduled Jobs**: Automatic violation checking

## Tech Stack

- Runtime: Node.js 20+
- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL (via TypeORM)
- Scheduling: @nestjs/schedule
- Rate Limiting: @nestjs/throttler

## API Endpoints

### Analytics

- POST /analytics/events - Track analytics event
- GET /analytics/dashboard - Get dashboard metrics
- GET /analytics/applications - Get application funnel stats
- GET /analytics/activity - Get recent activity (paginated)
- GET /analytics/export - Export analytics data (CSV/JSON)
- GET /analytics/health - Health check

### SLA Contracts

- POST /api/v1/sla/contracts - Create new SLA contract
- GET /api/v1/sla/status/:userId - Get SLA status for user
- GET /api/v1/sla/dashboard/:userId - Get SLA dashboard data
- GET /api/v1/sla/eligibility/:userId - Check eligibility for tier
- POST /api/v1/sla/extend/:userId - Extend SLA contract

### SLA Progress Tracking

- POST /api/v1/sla/track-application - Track application sent
- POST /api/v1/sla/track-response - Track employer response
- POST /api/v1/sla/track-interview - Track interview invitation
- POST /api/v1/sla/track-bulk - Bulk track progress events
- PATCH /api/v1/sla/verify-progress - Verify progress event

### SLA Violations & Remedies

- GET /api/v1/sla/violations/:userId - Get contract violations
- GET /api/v1/sla/remedies/:violationId - Get remedies for violation
- POST /api/v1/sla/remedies/:remedyId/approve - Approve remedy (admin)
- POST /api/v1/sla/check-violations - Manual violation check (admin)

## Event Types

- PAGE_VIEW, USER_REGISTERED, USER_LOGIN, PROFILE_UPDATED
- JOB_SEARCHED, JOB_VIEWED, JOB_SAVED
- APPLICATION_SUBMITTED, APPLICATION_VIEWED, APPLICATION_ACCEPTED, APPLICATION_REJECTED
- RESUME_GENERATED, COVER_LETTER_GENERATED, AI_SUGGESTION_USED
- EXPORT_DATA, ERROR_OCCURRED

## Event Categories

- USER - User-related events
- APPLICATION - Application events
- JOB - Job-related events
- AI - AI feature usage
- SYSTEM - System events

## SLA Tiers

### Professional (9.99)
- 3 guaranteed interviews in 60 days
- AI job matching, auto-apply, resume optimization

### Premium (49.99)
- 5 guaranteed interviews in 45 days
- Priority processing, advanced analytics

### Elite (99.99)
- 10 guaranteed interviews in 30 days
- Dedicated recruiter, salary negotiation help

## Remedy Types

- SERVICE_EXTENSION - Extra time added
- HUMAN_RECRUITER_ESCALATION - Human recruiter assigned
- SERVICE_CREDIT - Credit for future use
- PARTIAL_REFUND - Partial money back
- FULL_REFUND - Full money back

## Environment Variables

- PORT (3007)
- NODE_ENV
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- CORS_ORIGINS
- LOG_LEVEL
- APPLICATIONINSIGHTS_CONNECTION_STRING

## Getting Started

pnpm install && cp .env.example .env && pnpm migration:run && pnpm start:dev

Service runs on http://localhost:3007
Swagger docs at http://localhost:3007/api/docs

## Deployment

docker build -t applyforus/analytics-service:latest .
docker run -p 3007:3007 --env-file .env applyforus/analytics-service:latest

## License

MIT
