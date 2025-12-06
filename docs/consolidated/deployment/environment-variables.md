# Environment Variables Reference

Complete reference for all environment variables used in the JobPilot AI Platform.

## Table of Contents

1. [Overview](#overview)
2. [Application Configuration](#application-configuration)
3. [Database Configuration](#database-configuration)
4. [External Services](#external-services)
5. [Authentication & Security](#authentication--security)
6. [AI Services](#ai-services)
7. [Email & Notifications](#email--notifications)
8. [Cloud Services](#cloud-services)
9. [Feature Flags](#feature-flags)
10. [Service-Specific Variables](#service-specific-variables)

## Overview

Environment variables are stored in `.env` files and should **never** be committed to version control.

### File Structure

```
.env.example          # Template with all variables
.env                  # Local development (gitignored)
.env.test             # Testing environment
.env.staging          # Staging environment (in CI/CD)
.env.production       # Production environment (in secrets manager)
```

### Loading Priority

1. Environment-specific file (`.env.production`)
2. Local file (`.env.local`)
3. Default file (`.env`)
4. System environment variables

## Application Configuration

### Core Application Settings

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NODE_ENV` | Application environment | Yes | `development` | `production`, `staging`, `development` |
| `PORT` | Web app port | No | `3000` | `3000` |
| `APP_URL` | Public URL of web app | Yes | `http://localhost:3000` | `https://jobpilot.ai` |
| `API_URL` | Backend API base URL | Yes | `http://localhost:8000` | `https://api.jobpilot.ai` |
| `APP_NAME` | Application name | No | `JobPilot AI` | `JobPilot AI` |
| `LOG_LEVEL` | Logging level | No | `info` | `debug`, `info`, `warn`, `error` |

### Example

```env
NODE_ENV=production
PORT=3000
APP_URL=https://jobpilot.ai
API_URL=https://api.jobpilot.ai
APP_NAME=JobPilot AI
LOG_LEVEL=info
```

## Database Configuration

### PostgreSQL

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Complete PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/dbname` |
| `POSTGRES_HOST` | PostgreSQL host | Yes | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | Yes | `5432` |
| `POSTGRES_USER` | Database username | Yes | `postgres` |
| `POSTGRES_PASSWORD` | Database password | Yes | `SecureP@ssw0rd!` |
| `POSTGRES_DB` | Database name | Yes | `jobpilot` |
| `DB_POOL_MIN` | Minimum pool connections | No | `2` |
| `DB_POOL_MAX` | Maximum pool connections | No | `10` |
| `DB_SSL` | Enable SSL connection | No | `false` |

### Redis

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `REDIS_URL` | Complete Redis connection string | Yes | `redis://localhost:6379` |
| `REDIS_HOST` | Redis host | Yes | `localhost` |
| `REDIS_PORT` | Redis port | Yes | `6379` |
| `REDIS_PASSWORD` | Redis password | No | `redis_password` |
| `REDIS_DB` | Redis database number | No | `0` |
| `REDIS_TLS` | Enable TLS for Redis | No | `false` |

### Elasticsearch

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint | Yes | `http://localhost:9200` |
| `ELASTICSEARCH_USERNAME` | Elasticsearch username | No | `elastic` |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch password | No | `changeme` |
| `ELASTICSEARCH_INDEX_PREFIX` | Index name prefix | No | `jobpilot` |

### RabbitMQ

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `RABBITMQ_URL` | Complete RabbitMQ connection string | Yes | `amqp://guest:guest@localhost:5672` |
| `RABBITMQ_HOST` | RabbitMQ host | Yes | `localhost` |
| `RABBITMQ_PORT` | RabbitMQ port | Yes | `5672` |
| `RABBITMQ_USERNAME` | RabbitMQ username | Yes | `guest` |
| `RABBITMQ_PASSWORD` | RabbitMQ password | Yes | `guest` |
| `RABBITMQ_MANAGEMENT_PORT` | Management UI port | No | `15672` |
| `RABBITMQ_VHOST` | Virtual host | No | `/` |

### Example

```env
# PostgreSQL
DATABASE_URL=postgresql://jobpilot_user:SecureP@ss@db.example.com:5432/jobpilot_prod
POSTGRES_HOST=db.example.com
POSTGRES_PORT=5432
POSTGRES_USER=jobpilot_user
POSTGRES_PASSWORD=SecureP@ss
POSTGRES_DB=jobpilot_prod
DB_POOL_MAX=20

# Redis
REDIS_URL=redis://:redis_pass@cache.example.com:6379
REDIS_HOST=cache.example.com
REDIS_PORT=6379
REDIS_PASSWORD=redis_pass

# Elasticsearch
ELASTICSEARCH_URL=https://search.example.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=elastic_pass

# RabbitMQ
RABBITMQ_URL=amqp://jobpilot:rabbitmq_pass@mq.example.com:5672
RABBITMQ_HOST=mq.example.com
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=jobpilot
RABBITMQ_PASSWORD=rabbitmq_pass
```

## External Services

### Testing Database

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TEST_DATABASE_URL` | Test database connection | No | `postgresql://postgres:postgres@localhost:5432/jobpilot_test` |
| `TEST_REDIS_URL` | Test Redis connection | No | `redis://localhost:6379/1` |

## Authentication & Security

### JWT Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `JWT_SECRET` | Secret key for signing JWT tokens | Yes | `your-256-bit-secret-key-here` |
| `JWT_EXPIRATION` | Access token expiration | No | `7d`, `1h`, `30m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | `your-refresh-secret-key` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration | No | `30d` |
| `JWT_ALGORITHM` | JWT signing algorithm | No | `RS256`, `HS256` |

### Session Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SESSION_SECRET` | Session encryption secret | Yes | `session-secret-key` |
| `SESSION_EXPIRATION` | Session timeout (ms) | No | `86400000` (24 hours) |
| `SESSION_SECURE` | Require HTTPS for cookies | No | `true` |

### OAuth Providers

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No | `GOCSPX-xxx` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | No | `Iv1.xxx` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | No | `xxx` |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID | No | `xxx` |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth secret | No | `xxx` |
| `OAUTH_CALLBACK_URL` | OAuth callback URL | No | `https://jobpilot.ai/auth/callback` |

### CORS Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | Yes | `http://localhost:3000,https://jobpilot.ai` |
| `CORS_CREDENTIALS` | Allow credentials in CORS | No | `true` |

### Rate Limiting

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | No | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No | `100` |

### Example

```env
# JWT
JWT_SECRET=A8f2J9mN1pQ4rS6tU7vW8xY0zA2bC3dE5fG6hI7jK8lM9nO0pQ1rS2tU3vW4xY5z
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=Z9yX8wV7uT6sR5qP4oN3mL2kJ1iH0gF9eD8cB7aA6zY5xW4vU3tS2rQ1pO0nM9lK
JWT_REFRESH_EXPIRATION=30d

# Session
SESSION_SECRET=session-A8f2J9mN1pQ4rS6tU7vW8xY0z
SESSION_EXPIRATION=86400000

# OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
GITHUB_CLIENT_ID=Iv1.abcdef1234567890
GITHUB_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12

# CORS
CORS_ORIGIN=https://jobpilot.ai,https://www.jobpilot.ai
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## AI Services

### OpenAI

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-proj-xxx` |
| `OPENAI_MODEL` | Default GPT model | No | `gpt-4-turbo-preview`, `gpt-4o` |
| `OPENAI_MAX_TOKENS` | Max tokens per request | No | `4096` |
| `OPENAI_TEMPERATURE` | Response randomness (0-2) | No | `0.7` |
| `OPENAI_ORGANIZATION` | OpenAI organization ID | No | `org-xxx` |

### Anthropic Claude

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes | `sk-ant-xxx` |
| `ANTHROPIC_MODEL` | Default Claude model | No | `claude-3-opus-20240229` |
| `ANTHROPIC_MAX_TOKENS` | Max tokens per request | No | `4096` |

### Example

```env
# OpenAI
OPENAI_API_KEY=sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api-AbCdEfGhIjKlMnOpQrStUvWxYz
ANTHROPIC_MODEL=claude-3-opus-20240229
ANTHROPIC_MAX_TOKENS=4096
```

## Email & Notifications

### SendGrid

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `EMAIL_PROVIDER` | Email service provider | Yes | `sendgrid`, `ses` |
| `SENDGRID_API_KEY` | SendGrid API key | Conditional | `SG.xxx` |
| `EMAIL_FROM` | Default sender email | Yes | `noreply@jobpilot.ai` |
| `EMAIL_FROM_NAME` | Default sender name | No | `JobPilot AI` |

### AWS SES (Alternative)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `AWS_SES_REGION` | SES AWS region | Conditional | `us-east-1` |
| `AWS_SES_ACCESS_KEY` | SES access key | Conditional | `AKIA...` |
| `AWS_SES_SECRET_KEY` | SES secret key | Conditional | `xxx` |

### SMS (Twilio)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID | No | `ACxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | No | `xxx` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | No | `+1234567890` |

### Example

```env
# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.AbCdEfGhIjKlMnOpQrStUvWxYz.1234567890abcdefghijklmnop
EMAIL_FROM=noreply@jobpilot.ai
EMAIL_FROM_NAME=JobPilot AI Team

# SMS
TWILIO_ACCOUNT_SID=ACabcdef1234567890abcdef1234567890
TWILIO_AUTH_TOKEN=abcdef1234567890abcdef1234567890
TWILIO_PHONE_NUMBER=+15551234567
```

## Cloud Services

### AWS

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `AWS_REGION` | Default AWS region | Yes | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes | `xxx` |
| `AWS_S3_BUCKET` | S3 bucket name | Yes | `jobpilot-uploads` |
| `AWS_S3_REGION` | S3 bucket region | No | `us-east-1` |
| `AWS_CLOUDFRONT_DOMAIN` | CloudFront domain | No | `d123456.cloudfront.net` |

### Azure

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `AZURE_STORAGE_ACCOUNT` | Azure storage account | No | `jobpilotstorage` |
| `AZURE_STORAGE_KEY` | Storage account key | No | `xxx` |
| `AZURE_STORAGE_CONTAINER` | Blob container name | No | `uploads` |

### Example

```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=jobpilot-prod-uploads
AWS_S3_REGION=us-east-1
AWS_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
```

## Feature Flags

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `FEATURE_AUTO_APPLY` | Enable auto-apply feature | `true` | `true`, `false` |
| `FEATURE_AI_RESUME_BUILDER` | Enable AI resume builder | `true` | `true`, `false` |
| `FEATURE_ANALYTICS_DASHBOARD` | Enable analytics | `true` | `true`, `false` |
| `FEATURE_CHROME_EXTENSION` | Enable extension support | `true` | `true`, `false` |
| `FEATURE_MOBILE_APP` | Enable mobile app API | `true` | `true`, `false` |
| `FEATURE_JOB_ALERTS` | Enable job alerts | `true` | `true`, `false` |

### Example

```env
FEATURE_AUTO_APPLY=true
FEATURE_AI_RESUME_BUILDER=true
FEATURE_ANALYTICS_DASHBOARD=true
FEATURE_CHROME_EXTENSION=true
FEATURE_MOBILE_APP=true
FEATURE_JOB_ALERTS=true
```

## Service-Specific Variables

### Microservice Ports

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `AUTH_SERVICE_PORT` | Auth service port | `8001` | `8001` |
| `USER_SERVICE_PORT` | User service port | `8002` | `8002` |
| `RESUME_SERVICE_PORT` | Resume service port | `8003` | `8003` |
| `JOB_SERVICE_PORT` | Job service port | `8004` | `8004` |
| `AUTO_APPLY_SERVICE_PORT` | Auto-apply service port | `8005` | `8005` |
| `ANALYTICS_SERVICE_PORT` | Analytics service port | `8006` | `8006` |
| `NOTIFICATION_SERVICE_PORT` | Notification service port | `8007` | `8007` |
| `AI_SERVICE_PORT` | AI service port | `8008` | `8008` |

### Job Board APIs

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `INDEED_API_KEY` | Indeed API key | No | `xxx` |
| `LINKEDIN_API_KEY` | LinkedIn API key | No | `xxx` |
| `GLASSDOOR_API_KEY` | Glassdoor API key | No | `xxx` |
| `ZIPRECRUITER_API_KEY` | ZipRecruiter API key | No | `xxx` |

### Browser Automation

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `HEADLESS_BROWSER` | Run browser in headless mode | `true` | `true`, `false` |
| `BROWSER_TIMEOUT` | Browser operation timeout (ms) | `30000` | `30000` |
| `PLAYWRIGHT_BROWSERS_PATH` | Browser binaries path | Auto | `/path/to/browsers` |

### Example

```env
# Service Ports
AUTH_SERVICE_PORT=8001
USER_SERVICE_PORT=8002
RESUME_SERVICE_PORT=8003
JOB_SERVICE_PORT=8004
AUTO_APPLY_SERVICE_PORT=8005
ANALYTICS_SERVICE_PORT=8006
NOTIFICATION_SERVICE_PORT=8007
AI_SERVICE_PORT=8008

# Browser Automation
HEADLESS_BROWSER=true
BROWSER_TIMEOUT=30000
```

## Security Best Practices

### Generating Secure Secrets

```bash
# Generate JWT secret (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate UUID
node -e "console.log(require('crypto').randomUUID())"

# Generate base64 secret
openssl rand -base64 32
```

### Environment-Specific Security

**Development**:
- Use `.env.example` values or weak secrets
- Debug logging enabled
- Mock external services when possible

**Staging**:
- Use real but non-production secrets
- Production-like configuration
- Separate databases and services

**Production**:
- Store secrets in secrets manager (Azure Key Vault, AWS Secrets Manager)
- Never commit production secrets
- Rotate secrets regularly
- Use managed identities when possible

### Secrets Management

**Azure Key Vault**:
```bash
# Store secret
az keyvault secret set --vault-name jobpilot-kv --name JWT-SECRET --value "xxx"

# Retrieve secret
az keyvault secret show --vault-name jobpilot-kv --name JWT-SECRET --query value -o tsv
```

**AWS Secrets Manager**:
```bash
# Store secret
aws secretsmanager create-secret --name jobpilot/jwt-secret --secret-string "xxx"

# Retrieve secret
aws secretsmanager get-secret-value --secret-id jobpilot/jwt-secret --query SecretString -o text
```

## Validation

Validate your environment configuration:

```bash
# Check required variables
./scripts/validate-env.sh

# Test database connection
./scripts/test-db-connection.sh

# Test Redis connection
./scripts/test-redis-connection.sh

# Verify all services can start
docker-compose config
```

## Related Documentation

- [Getting Started](../getting-started.md)
- [Deployment Guide](./README.md)
- [Security Configuration](../security/README.md)

---

**Last Updated**: 2025-12-05
