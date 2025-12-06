# Analytics Service

The Analytics Service is a microservice for the JobPilot AI Platform that handles analytics tracking, metrics aggregation, and data export functionality.

## Features

- Event tracking for user actions and system events
- Dashboard metrics aggregation
- Application funnel analysis
- Recent activity feed
- Data export (CSV/JSON formats)
- Health check endpoint
- Rate limiting and throttling
- Comprehensive logging
- Swagger API documentation

## Tech Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with TypeORM
- **Language**: TypeScript
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory (use `.env.example` as template):

```bash
cp .env.example .env
```

Configure the following environment variables:

### Application Settings
- `NODE_ENV`: Environment (development/production)
- `PORT`: Service port (default: 8006)

### Database Settings
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (jobpilot_analytics)

### Analytics Settings
- `ANALYTICS_RETENTION_DAYS`: Days to retain analytics data (default: 90)
- `ANALYTICS_AGGREGATION_INTERVAL`: Aggregation interval in ms (default: 3600000)
- `ANALYTICS_ENABLE_REALTIME`: Enable real-time analytics (default: true)

## Running the Service

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The service will be available at `http://localhost:8006`

## API Documentation

Once the service is running, access the Swagger documentation at:
```
http://localhost:8006/api/docs
```

## API Endpoints

### Analytics Endpoints

#### POST /api/v1/analytics/events
Track a new analytics event
- Body: Event data (eventType, category, userId, metadata, etc.)
- Returns: Event confirmation with ID

#### GET /api/v1/analytics/dashboard
Get dashboard metrics
- Query params: startDate, endDate, userId (optional)
- Returns: Aggregated dashboard metrics including:
  - Total users
  - Total applications
  - Today's applications
  - Active users today
  - Success rate
  - Page views
  - Average session duration
  - Application trend
  - Status distribution

#### GET /api/v1/analytics/applications
Get application funnel statistics
- Query params: startDate, endDate, userId (optional)
- Returns: Funnel metrics including:
  - Job views
  - Job saves
  - Applications started/submitted
  - Applications accepted
  - Conversion rates
  - Funnel breakdown by stage

#### GET /api/v1/analytics/activity
Get recent activity
- Query params: startDate, endDate, userId, eventType, category, page, limit
- Returns: Paginated list of recent events

#### GET /api/v1/analytics/export
Export analytics data
- Query params: format (csv/json), startDate, endDate, userId, eventType, category
- Returns: Analytics data in requested format

#### GET /api/v1/analytics/health
Health check endpoint
- Returns: Service health status

## Event Types

The service tracks the following event types:

- `page_view`: Page view events
- `application_submitted`: Application submission
- `application_viewed`: Application viewed
- `application_accepted`: Application accepted
- `application_rejected`: Application rejected
- `job_searched`: Job search performed
- `job_viewed`: Job posting viewed
- `job_saved`: Job posting saved
- `resume_generated`: Resume generated
- `cover_letter_generated`: Cover letter generated
- `ai_suggestion_used`: AI suggestion used
- `user_registered`: User registration
- `user_login`: User login
- `profile_updated`: Profile update
- `export_data`: Data export
- `error_occurred`: Error event

## Event Categories

- `user`: User-related events
- `application`: Application-related events
- `job`: Job-related events
- `ai`: AI-related events
- `system`: System events

## Database Schema

### analytics_events table
- `id`: UUID primary key
- `eventType`: Event type enum
- `category`: Event category enum
- `userId`: User ID (optional)
- `sessionId`: Session ID (optional)
- `applicationId`: Application ID (optional)
- `jobId`: Job ID (optional)
- `metadata`: JSONB metadata
- `userAgent`: User agent string
- `ipAddress`: IP address
- `referrer`: Referrer URL
- `path`: URL path
- `count`: Event count
- `duration`: Duration in milliseconds
- `isSuccessful`: Success flag
- `errorMessage`: Error message (if failed)
- `timestamp`: Event timestamp
- `eventDate`: Date for aggregation

## Development

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

## Database Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Performance Considerations

- Indexes on frequently queried columns (timestamp, userId, eventType, category)
- Configurable data retention period
- Efficient aggregation queries
- Connection pooling for database
- Rate limiting to prevent abuse

## Security

- Input validation using class-validator
- Rate limiting with @nestjs/throttler
- CORS configuration
- Environment variable validation
- SQL injection prevention with TypeORM

## Error Handling

- Global exception filter
- Structured error responses
- Comprehensive logging
- Stack traces in development mode

## Monitoring

- Health check endpoint for liveness/readiness probes
- Request/response logging
- Query performance logging
- Error tracking

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Run linter before committing

## License

MIT
