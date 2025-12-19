# API Gateway - Quick Start Guide

## Prerequisites
- Node.js 20+
- pnpm 8+
- Running backend services (or mock them)

## Quick Start (Development)

### 1. Install Dependencies
```bash
cd services/api-gateway
pnpm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# - JWT_SECRET (must match auth-service)
# - Backend service URLs
```

### 3. Start Development Server
```bash
pnpm run start:dev
```

The gateway will start on http://localhost:8080

### 4. Verify Installation
```bash
# Check gateway health
curl http://localhost:8080/health

# Check Swagger docs
open http://localhost:8080/docs
```

## Testing the Gateway

### Test Health Endpoints
```bash
# Basic health
curl http://localhost:8080/health

# Liveness probe
curl http://localhost:8080/health/live

# Readiness probe
curl http://localhost:8080/health/ready

# All services health
curl http://localhost:8080/health/services

# Specific service health
curl http://localhost:8080/health/services/auth-service
```

### Test Proxy (without auth)
```bash
# Auth endpoints don't require authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Test Proxy (with auth)
```bash
# Get a JWT token first (from auth-service)
TOKEN="your-jwt-token-here"

# Access protected endpoint
curl http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Make a request to any service
curl http://localhost:8080/api/jobs \
  -H "Authorization: Bearer $TOKEN"
```

### Test Rate Limiting
```bash
# Make multiple requests quickly
for i in {1..70}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:8080/api/jobs \
    -H "Authorization: Bearer $TOKEN"
done

# You should see 429 (Too Many Requests) after 60 requests for free tier
```

## Development Workflow

### File Watching
The dev server automatically reloads on file changes:
```bash
pnpm run start:dev
```

### Building
```bash
# Build for production
pnpm run build

# Output in dist/
```

### Testing
```bash
# Run tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov
```

### Linting
```bash
# Lint and fix
pnpm run lint

# Format code
pnpm run format
```

## Docker Development

### Build Image
```bash
# From repository root
docker build -t applyforus-api-gateway -f services/api-gateway/Dockerfile .
```

### Run Container
```bash
docker run -p 8080:8080 \
  -e JWT_SECRET=your-secret \
  -e AUTH_SERVICE_URL=http://host.docker.internal:8081 \
  -e USER_SERVICE_URL=http://host.docker.internal:8082 \
  applyforus-api-gateway
```

## Common Issues

### Port Already in Use
```bash
# Change port in .env
PORT=8090

# Or use different port
PORT=8090 pnpm run start:dev
```

### Backend Services Not Available
```bash
# Check service URLs in .env
# Ensure services are running
# Use health check to verify

curl http://localhost:8080/health/services
```

### JWT Validation Fails
```bash
# Ensure JWT_SECRET matches auth-service
# Check token is not expired
# Verify token format: "Bearer <token>"
```

### CORS Errors
```bash
# Add your origin to .env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Or allow all in development (not recommended)
```

## Environment Variables Reference

### Required
```env
JWT_SECRET=your-super-secret-key
AUTH_SERVICE_URL=http://localhost:8081
USER_SERVICE_URL=http://localhost:8082
RESUME_SERVICE_URL=http://localhost:8083
JOB_SERVICE_URL=http://localhost:8084
AUTO_APPLY_SERVICE_URL=http://localhost:8085
ANALYTICS_SERVICE_URL=http://localhost:8086
NOTIFICATION_SERVICE_URL=http://localhost:8087
PAYMENT_SERVICE_URL=http://localhost:8088
AI_SERVICE_URL=http://localhost:8089
ORCHESTRATOR_SERVICE_URL=http://localhost:8090
```

### Optional
```env
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

## API Routes

### Public Routes (No Auth Required)
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `GET /health/*`

### Protected Routes (Auth Required)
- `/api/users/*`
- `/api/resumes/*`
- `/api/jobs/*`
- `/api/applications/*`
- `/api/analytics/*`
- `/api/notifications/*`
- `/api/billing/*`
- `/api/ai/*`
- `/api/orchestrator/*`

## Monitoring

### Prometheus Metrics
```bash
# Available at /metrics
curl http://localhost:8080/metrics
```

### Logs
Structured JSON logs to console in development:
```bash
# View logs with pretty printing
pnpm run start:dev | pino-pretty
```

## Next Steps

1. **Run Backend Services**: Ensure all backend services are running
2. **Test Integration**: Test proxy to each service
3. **Load Testing**: Test rate limits with load
4. **Add Tests**: Write unit and E2E tests
5. **Deploy**: Deploy to staging environment

## Support

For issues or questions:
1. Check logs for errors
2. Verify environment variables
3. Check health endpoints
4. Review README.md for detailed docs
5. Check IMPLEMENTATION_SUMMARY.md for architecture

## Useful Commands

```bash
# Development
pnpm run start:dev        # Start with watch mode
pnpm run start:debug      # Start with debugging

# Production
pnpm run build            # Build
pnpm run start:prod       # Start production

# Testing
pnpm run test             # Run tests
pnpm run test:watch       # Watch mode
pnpm run test:cov         # Coverage

# Code Quality
pnpm run lint             # Lint
pnpm run format           # Format
```

## Example .env File

```env
# Server
NODE_ENV=development
PORT=8080

# Security
JWT_SECRET=super-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000

# Services (adjust ports as needed)
AUTH_SERVICE_URL=http://localhost:8081
USER_SERVICE_URL=http://localhost:8082
RESUME_SERVICE_URL=http://localhost:8083
JOB_SERVICE_URL=http://localhost:8084
AUTO_APPLY_SERVICE_URL=http://localhost:8085
ANALYTICS_SERVICE_URL=http://localhost:8086
NOTIFICATION_SERVICE_URL=http://localhost:8087
PAYMENT_SERVICE_URL=http://localhost:8088
ORCHESTRATOR_SERVICE_URL=http://localhost:8090
AI_SERVICE_URL=http://localhost:8089

# Logging
LOG_LEVEL=debug
```

Happy coding!
