# API Gateway / BFF Service

The API Gateway (Backend-For-Frontend) service acts as the single entry point for all client requests to the ApplyForUs platform. It provides request routing, authentication, rate limiting, and aggregated health checks.

## Features

### 1. Route Aggregation
Proxy requests to backend services:
- `/api/auth/*` → auth-service:8081
- `/api/users/*` → user-service:8082
- `/api/resumes/*` → resume-service:8083
- `/api/jobs/*` → job-service:8084
- `/api/applications/*` → auto-apply-service:8085
- `/api/analytics/*` → analytics-service:8086
- `/api/notifications/*` → notification-service:8087
- `/api/billing/*` → payment-service:8088
- `/api/ai/*` → ai-service:8089

### 2. Authentication
- JWT token validation
- Automatic token validation before proxying requests
- Public routes (auth endpoints) bypass authentication

### 3. Rate Limiting
Tier-based rate limits:
- **Free**: 60 requests/minute
- **Basic**: 300 requests/minute
- **Pro**: 1000 requests/minute
- **Enterprise**: 5000 requests/minute

### 4. Health Checks
- `/health` - Basic health check
- `/health/live` - Liveness probe (K8s)
- `/health/ready` - Readiness probe (K8s)
- `/health/services` - Aggregated health of all backend services
- `/health/services/:serviceName` - Health of specific service

### 5. Request Logging
- All incoming requests are logged
- OpenTelemetry tracing support
- Azure Application Insights integration

### 6. CORS Handling
- Configurable allowed origins
- Secure CORS policy for production

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         API Gateway (8080)          │
│  ┌──────────────────────────────┐  │
│  │  Authentication (JWT)        │  │
│  │  Rate Limiting (Tier-based)  │  │
│  │  Request Logging             │  │
│  └──────────────────────────────┘  │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌──────────┐      ┌──────────┐
│  Auth    │      │  User    │
│ Service  │      │ Service  │
│  :8081   │      │  :8082   │
└──────────┘      └──────────┘
                        ...
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

### Development

```bash
# Start in development mode
pnpm run start:dev

# Build
pnpm run build

# Start in production mode
pnpm run start:prod
```

### Docker

```bash
# Build Docker image
docker build -t applyforus-api-gateway .

# Run container
docker run -p 8080:8080 \
  -e JWT_SECRET=your-secret \
  -e AUTH_SERVICE_URL=http://auth-service:8081 \
  applyforus-api-gateway
```

## Environment Variables

See `.env.example` for all available environment variables.

### Required Variables
- `PORT` - Server port (default: 8080)
- `JWT_SECRET` - Secret key for JWT validation
- Backend service URLs (AUTH_SERVICE_URL, USER_SERVICE_URL, etc.)

### Optional Variables
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `THROTTLE_TTL` - Rate limit window in milliseconds
- `THROTTLE_LIMIT` - Default rate limit
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## API Documentation

Swagger documentation is available at `/docs` in development mode.

```
http://localhost:8080/docs
```

## Rate Limiting

Rate limits are enforced per user and tier. Headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Timestamp when limit resets
- `Retry-After` - Seconds to wait (included when limit exceeded)

## Authentication

Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token should contain:
- `sub` - User ID
- `email` - User email
- `role` - User role (optional)
- `tier` - Subscription tier (optional, defaults to 'free')

## Health Monitoring

The gateway provides comprehensive health monitoring:

### Basic Health
```bash
curl http://localhost:8080/health
```

### Service Health
```bash
curl http://localhost:8080/health/services
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "services": {
    "auth-service": {
      "status": "healthy",
      "responseTime": 45
    },
    "user-service": {
      "status": "healthy",
      "responseTime": 52
    }
  },
  "summary": {
    "total": 9,
    "healthy": 8,
    "unhealthy": 1,
    "unknown": 0
  }
}
```

## Monitoring & Observability

### Metrics
Prometheus metrics available at `/metrics`:
- HTTP request duration
- Request count by route and status
- Active connections
- Rate limit hits

### Logging
Structured JSON logging with correlation IDs for request tracing.

### Tracing
OpenTelemetry integration for distributed tracing.

## Security

- Helmet.js for security headers
- CORS policy enforcement
- JWT validation
- Rate limiting per tier
- Request validation with class-validator

## Development

### Project Structure
```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── app.controller.ts       # Root controller
├── proxy/                  # Request proxying
│   ├── proxy.module.ts
│   ├── proxy.service.ts
│   └── proxy.controller.ts
├── auth/                   # Authentication
│   ├── auth.module.ts
│   ├── jwt.guard.ts
│   └── jwt.strategy.ts
├── rate-limit/             # Rate limiting
│   ├── rate-limit.module.ts
│   └── rate-limit.guard.ts
└── health/                 # Health checks
    ├── health.module.ts
    ├── health.service.ts
    └── health.controller.ts
```

### Adding a New Service Route

1. Add service URL to `.env.example`
2. Add route mapping in `proxy.service.ts`
3. Add proxy endpoint in `proxy.controller.ts`
4. Add service health check in `health.service.ts`

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Deployment

### Kubernetes
The service includes liveness and readiness probes for Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Docker Compose
See `docker-compose.yml` in the root of the repository.

## License

MIT
