# Auth Service

Authentication and authorization microservice for JobPilot AI Platform.

## Overview

The Auth Service handles all authentication and authorization operations including user registration, login, JWT token management, OAuth integration, and session management.

## Features

- User registration and email verification
- Email/password authentication
- OAuth 2.0 integration (Google, LinkedIn, GitHub)
- JWT access and refresh tokens
- Multi-factor authentication (MFA)
- Password reset functionality
- Session management
- Role-based access control (RBAC)

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **Cache**: Redis (sessions)
- **Authentication**: Passport.js, JWT

## API Endpoints

### Public Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/verify-email` - Verify email address
- `GET /api/v1/auth/oauth/{provider}` - OAuth login
- `GET /api/v1/auth/oauth/{provider}/callback` - OAuth callback

### Protected Endpoints

- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/mfa/enable` - Enable MFA
- `POST /api/v1/auth/mfa/verify` - Verify MFA token

## Environment Variables

```bash
# Server Configuration
PORT=8001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobpilot
POSTGRES_HOST=localhost
POSTGRES_PORT=5434
POSTGRES_DB=jobpilot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6381
REDIS_HOST=localhost
REDIS_PORT=6381

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-session-secret
SESSION_EXPIRATION=86400000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8001/api/v1/auth/oauth/google/callback

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:8001/api/v1/auth/oauth/linkedin/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:8001/api/v1/auth/oauth/github/callback

# Email Service
EMAIL_SERVICE_URL=http://localhost:8007/api/v1

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

### Database Setup

```bash
# Run migrations
pnpm migration:run

# Seed database (optional)
pnpm seed
```

### Running the Service

```bash
# Development mode (with hot reload)
pnpm dev

# Production mode
pnpm build
pnpm start:prod

# Debug mode
pnpm dev:debug
```

The service will start on `http://localhost:8001`

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run E2E tests
pnpm test:e2e
```

## Project Structure

```
services/auth-service/
├── src/
│   ├── config/               # Configuration files
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/          # Data Transfer Objects
│   │   │   ├── entities/     # Database entities
│   │   │   ├── guards/       # Auth guards
│   │   │   ├── strategies/   # Passport strategies
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/            # User management
│   │   └── tokens/           # Token management
│   ├── common/
│   │   ├── decorators/       # Custom decorators
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Interceptors
│   │   └── pipes/            # Validation pipes
│   ├── app.module.ts
│   └── main.ts
├── test/                     # Test files
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication Flow

### Registration Flow

1. User submits registration form
2. Service validates input
3. Password is hashed (bcrypt)
4. User created in database
5. Verification email sent
6. Response with user data (no tokens until verified)

### Login Flow

1. User submits credentials
2. Service validates user exists
3. Password verified
4. JWT access token (15 min) generated
5. JWT refresh token (7 days) generated
6. Tokens stored in Redis
7. Response with tokens and user data

### Token Refresh Flow

1. Client sends refresh token
2. Service validates refresh token
3. New access token generated
4. Response with new access token

### OAuth Flow

1. User clicks OAuth provider button
2. Redirect to provider authorization page
3. User authorizes application
4. Provider redirects to callback URL
5. Service exchanges code for tokens
6. User info retrieved from provider
7. User created/updated in database
8. JWT tokens generated
9. Redirect to frontend with tokens

## Security Features

### Password Security

- Minimum 8 characters
- Hashed with bcrypt (10 rounds)
- Password strength validation
- Account lockout after 5 failed attempts

### Token Security

- JWT tokens with expiration
- Refresh token rotation
- Token blacklisting on logout
- Secure token storage in Redis

### Rate Limiting

- 5 requests/min for login
- 100 requests/hour for general endpoints
- IP-based rate limiting
- User-based rate limiting

### Additional Security

- CORS protection
- Helmet.js security headers
- SQL injection prevention
- XSS protection
- CSRF protection

## Error Handling

The service returns standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "statusCode": 401
  }
}
```

Common error codes:
- `INVALID_CREDENTIALS` - Invalid login credentials
- `USER_NOT_FOUND` - User doesn't exist
- `EMAIL_ALREADY_EXISTS` - Email already registered
- `INVALID_TOKEN` - Invalid or expired token
- `ACCOUNT_LOCKED` - Too many failed login attempts

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  role VARCHAR(50) DEFAULT 'user',
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### OAuth Providers Table

```sql
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token VARCHAR(500),
  refresh_token VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);
```

## Monitoring & Logging

### Health Check

```bash
curl http://localhost:8001/health
```

Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Metrics

Prometheus metrics available at `/metrics`:
- `auth_login_total` - Total login attempts
- `auth_login_success` - Successful logins
- `auth_login_failed` - Failed logins
- `auth_token_generated` - Tokens generated
- `auth_request_duration` - Request duration

### Logging

Logs are structured JSON format:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "correlationId": "abc-123"
}
```

## Deployment

### Docker

```bash
# Build image
docker build -t jobpilot/auth-service:latest .

# Run container
docker run -p 8001:8001 --env-file .env jobpilot/auth-service:latest
```

### Kubernetes

```bash
# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/services/auth-service.yaml

# Check deployment
kubectl get pods -l app=auth-service
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://postgres:postgres@localhost:5434/jobpilot
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6381 ping
```

### JWT Token Issues

- Ensure `JWT_SECRET` is set and consistent across services
- Check token expiration time
- Verify token format in Authorization header

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- Email: dev@jobpilot.ai
- Documentation: https://docs.jobpilot.ai
- GitHub Issues: https://github.com/your-org/Job-Apply-Platform/issues
