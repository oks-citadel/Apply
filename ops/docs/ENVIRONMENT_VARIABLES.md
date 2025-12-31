# ApplyForUs Platform - Environment Variables Reference

This document provides a comprehensive reference for all environment variables used across the ApplyForUs platform services.

## Table of Contents
1. [Global Configuration](#global-configuration)
2. [Database Configuration](#database-configuration)
3. [Redis/Cache Configuration](#rediscache-configuration)
4. [Message Queue Configuration](#message-queue-configuration)
5. [Authentication & Security](#authentication--security)
6. [OAuth Providers](#oauth-providers)
7. [AI Services](#ai-services)
8. [Payment Processing](#payment-processing)
9. [Email & Notifications](#email--notifications)
10. [Cloud Storage](#cloud-storage)
11. [Search & Indexing](#search--indexing)
12. [Service URLs](#service-urls)
13. [CORS & Rate Limiting](#cors--rate-limiting)
14. [Browser Automation](#browser-automation)
15. [Monitoring & Logging](#monitoring--logging)
16. [Feature Flags](#feature-flags)
17. [File Upload Configuration](#file-upload-configuration)

---

## Global Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `NODE_ENV` | Runtime environment | Required | `development`, `production`, `test` | All |
| `PORT` | Service port number | Required | `8001` | All |
| `API_PREFIX` | API route prefix | Optional | `api/v1` | All backend services |
| `SERVICE_NAME` | Service identifier | Optional | `auth-service` | All |
| `SERVICE_VERSION` | Service version | Optional | `1.0.0` | All |
| `APP_NAME` | Application name | Optional | `ApplyForUs AI Service` | AI Service |
| `FRONTEND_URL` | Frontend application URL | Required | `https://applyforus.com` | All |
| `API_URL` | API gateway URL | Required | `https://api.applyforus.com` | Frontend apps |
| `APP_URL` | Main application URL | Required | `https://applyforus.com` | All |

---

## Database Configuration

### PostgreSQL (Azure Database for PostgreSQL)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `DATABASE_URL` | Full PostgreSQL connection string | Required* | `postgresql://user:pass@host:5432/db?sslmode=require` | All backend |
| `DB_HOST` | Database host | Required* | `applyforus-postgres.postgres.database.azure.com` | All backend |
| `DB_PORT` | Database port | Required | `5432` | All backend |
| `DB_USERNAME` | Database username | Required | `applyforusadmin@applyforus-postgres` | All backend |
| `DB_PASSWORD` | Database password | Required | `<secure-password>` | All backend |
| `DB_DATABASE` | Database name | Required | `applyforus` | All backend |
| `DB_NAME` | Database name (alias) | Optional | `applyforus` | analytics-service |
| `DB_SSL` | Enable SSL connection | Required | `true` | All backend |
| `DB_SSL_CA_CERT` | SSL CA certificate path | Optional | `/path/to/ca.pem` | notification-service |
| `DB_SYNCHRONIZE` | Auto-sync schema (dev only) | Optional | `false` | payment-service, analytics |
| `DB_LOGGING` | Enable query logging | Optional | `false` | payment-service, analytics |
| `RUN_MIGRATIONS` | Auto-run migrations on startup | Optional | `false` | resume-service |
| `POSTGRES_USER` | PostgreSQL user (legacy) | Optional | `applyforusadmin@applyforus-postgres` | Root config |
| `POSTGRES_PASSWORD` | PostgreSQL password (legacy) | Optional | `<secure-password>` | Root config |
| `POSTGRES_DB` | PostgreSQL database (legacy) | Optional | `applyforus` | Root config |
| `POSTGRES_HOST` | PostgreSQL host (legacy) | Optional | `applyforus-postgres.postgres.database.azure.com` | Root config |
| `POSTGRES_PORT` | PostgreSQL port (legacy) | Optional | `5432` | Root config |
| `POSTGRES_SSL` | PostgreSQL SSL (legacy) | Optional | `true` | Root config |
| `TEST_DATABASE_URL` | Test database connection | Optional | `postgresql://postgres:postgres@localhost:5432/test` | CI/CD only |

*Either `DATABASE_URL` or individual `DB_*` variables are required.

---

## Redis/Cache Configuration

### Azure Cache for Redis

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `REDIS_URL` | Full Redis connection string | Optional | `rediss://:pass@host:6380/0` | All |
| `REDIS_HOST` | Redis host | Required | `applyforus-redis.redis.cache.windows.net` | All backend |
| `REDIS_PORT` | Redis port | Required | `6380` (SSL) or `6379` (local) | All backend |
| `REDIS_PASSWORD` | Redis access key | Required | `<redis-access-key>` | All backend |
| `REDIS_DB` | Redis database number | Optional | `0` | All backend |
| `REDIS_TLS` | Enable TLS | Required | `true` | All backend |
| `REDIS_SSL` | Enable SSL (alias for TLS) | Optional | `true` | All backend |
| `REDIS_TTL` | Default key TTL in seconds | Optional | `3600` | All backend |
| `CACHE_TTL` | Cache TTL in seconds | Optional | `300` | All backend |
| `CACHE_MAX_ITEMS` | Max cache items | Optional | `1000` | job-service |
| `CACHE_MAX` | Max cache entries (alias) | Optional | `1000` | analytics-service |
| `TEST_REDIS_URL` | Test Redis connection | Optional | `redis://localhost:6379/1` | CI/CD only |

---

## Message Queue Configuration

### Azure Service Bus (Production)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Service Bus connection | Required (Prod) | `Endpoint=sb://...;SharedAccessKeyName=...` | All backend |
| `AZURE_SERVICE_BUS_QUEUE_NAME` | Queue name | Required (Prod) | `applyforus-queue` | All backend |

### RabbitMQ (Development Only)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `RABBITMQ_URL` | RabbitMQ connection URL | Required (Dev) | `amqp://guest:guest@localhost:5672` | payment-service |
| `RABBITMQ_HOST` | RabbitMQ host | Optional | `localhost` | payment-service |
| `RABBITMQ_PORT` | RabbitMQ port | Optional | `5672` | payment-service |
| `RABBITMQ_USERNAME` | RabbitMQ username | Optional | `guest` | payment-service |
| `RABBITMQ_PASSWORD` | RabbitMQ password | Optional | `guest` | payment-service |
| `RABBITMQ_MANAGEMENT_PORT` | Management UI port | Optional | `15672` | payment-service |
| `RABBITMQ_QUEUE_PAYMENT_EVENTS` | Payment events queue | Optional | `payment_events` | payment-service |
| `RABBITMQ_QUEUE_SUBSCRIPTION_EVENTS` | Subscription events queue | Optional | `subscription_events` | payment-service |

---

## Authentication & Security

### JWT Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required | `<64-char-random-string>` | auth-service, api-gateway |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required | `<64-char-random-string>` | auth-service |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token lifetime | Optional | `15m` | auth-service |
| `JWT_EXPIRES_IN` | Access token lifetime (alias) | Optional | `24h` | api-gateway |
| `JWT_EXPIRATION` | Access token lifetime (alias) | Optional | `7d` | user-service |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | Optional | `7d` | auth-service |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifetime (alias) | Optional | `7d` | Root config |
| `JWT_ISSUER` | Token issuer identifier | Optional | `applyforus-auth-service` | auth-service |
| `JWT_AUDIENCE` | Token audience | Optional | `applyforus-platform` | auth-service |

### Session Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `SESSION_SECRET` | Session encryption secret | Required | `<64-char-random-string>` | auth-service |
| `SESSION_MAX_AGE` | Session max age (ms) | Optional | `86400000` | auth-service |
| `SESSION_EXPIRATION` | Session expiration (alias) | Optional | `86400000` | Root config |
| `SESSION_TIMEOUT` | Session timeout (seconds) | Optional | `3600` | Production |

### Password Policy

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `MIN_PASSWORD_LENGTH` | Minimum password length | Optional | `8` | auth-service |
| `BCRYPT_ROUNDS` | Password hashing rounds | Optional | `12` | auth-service |
| `MAX_LOGIN_ATTEMPTS` | Max failed login attempts | Optional | `5` | auth-service |
| `LOCKOUT_DURATION` | Account lockout (seconds) | Optional | `900` | auth-service |
| `PASSWORD_REQUIRE_UPPERCASE` | Require uppercase | Optional | `true` | auth-service |
| `PASSWORD_REQUIRE_LOWERCASE` | Require lowercase | Optional | `true` | auth-service |
| `PASSWORD_REQUIRE_NUMBERS` | Require numbers | Optional | `true` | auth-service |
| `PASSWORD_REQUIRE_SPECIAL` | Require special chars | Optional | `true` | auth-service |

### CSRF & Security Headers

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `CSRF_ENABLED` | Enable CSRF protection | Optional | `true` | auth-service |
| `CSRF_SECRET` | CSRF token secret | Required* | `<32-char-secret>` | auth-service |
| `HELMET_ENABLED` | Enable Helmet middleware | Optional | `true` | auth-service, api-gateway |
| `HSTS_ENABLED` | Enable HSTS | Optional | `true` | auth-service, api-gateway |
| `HSTS_MAX_AGE` | HSTS max age (seconds) | Optional | `31536000` | auth-service, api-gateway |

---

## OAuth Providers

### Google OAuth

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Required | `<id>.apps.googleusercontent.com` | auth-service |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Required | `<secret>` | auth-service |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | Required | `https://api.applyforus.com/api/v1/auth/google/callback` | auth-service |

### GitHub OAuth

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Required | `<client-id>` | auth-service |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Required | `<secret>` | auth-service |
| `GITHUB_CALLBACK_URL` | OAuth callback URL | Required | `https://api.applyforus.com/api/v1/auth/github/callback` | auth-service |

### LinkedIn OAuth

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID | Required | `<client-id>` | auth-service |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth client secret | Required | `<secret>` | auth-service |
| `LINKEDIN_CALLBACK_URL` | OAuth callback URL | Required | `https://api.applyforus.com/api/v1/auth/linkedin/callback` | auth-service |

---

## AI Services

### OpenAI

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Required | `sk-...` | ai-service |
| `OPENAI_ORG_ID` | OpenAI organization ID | Optional | `org-...` | ai-service |
| `OPENAI_MODEL` | Default model | Optional | `gpt-4-turbo-preview` | ai-service |
| `OPENAI_MAX_TOKENS` | Max tokens per request | Optional | `4096` | ai-service |

### Anthropic Claude

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Required | `sk-ant-...` | ai-service |
| `ANTHROPIC_MODEL` | Default Claude model | Optional | `claude-3-opus-20240229` | ai-service |

### Azure OpenAI (Production Alternative)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | Optional | `https://...openai.azure.com/` | ai-service |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI key | Optional | `<key>` | ai-service |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Model deployment name | Optional | `gpt-4` | ai-service |
| `AZURE_OPENAI_API_VERSION` | API version | Optional | `2024-02-15-preview` | ai-service |

### Vector Database (Pinecone)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `PINECONE_API_KEY` | Pinecone API key | Required | `<key>` | ai-service |
| `PINECONE_ENVIRONMENT` | Pinecone environment | Required | `us-west1-gcp` | ai-service |
| `PINECONE_INDEX_NAME` | Vector index name | Required | `applyforus-vectors` | ai-service |

### LLM Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `DEFAULT_LLM_PROVIDER` | Default AI provider | Optional | `openai` | ai-service |
| `LLM_TEMPERATURE` | Model temperature | Optional | `0.7` | ai-service |
| `LLM_MAX_TOKENS` | Max response tokens | Optional | `2000` | ai-service |
| `EMBEDDING_MODEL` | Embedding model | Optional | `text-embedding-ada-002` | ai-service |
| `EMBEDDING_DIMENSION` | Embedding dimensions | Optional | `1536` | ai-service |

### AI Matching Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `MATCH_TOP_K` | Top K matches | Optional | `50` | ai-service |
| `MIN_MATCH_SCORE` | Minimum match score | Optional | `0.6` | ai-service |
| `SKILL_MATCH_WEIGHT` | Skill matching weight | Optional | `0.4` | ai-service |
| `EXPERIENCE_MATCH_WEIGHT` | Experience matching weight | Optional | `0.3` | ai-service |
| `LOCATION_MATCH_WEIGHT` | Location matching weight | Optional | `0.15` | ai-service |
| `CULTURE_MATCH_WEIGHT` | Culture matching weight | Optional | `0.15` | ai-service |

---

## Payment Processing

### Stripe

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Required | `sk_test_...` or `sk_live_...` | payment-service |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | Required | `pk_test_...` or `pk_live_...` | payment-service |
| `STRIPE_PUBLIC_KEY` | Stripe public key (alias) | Optional | `pk_test_...` | Root config |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Required | `whsec_...` | payment-service |
| `STRIPE_BASIC_PRICE_ID` | Basic plan price ID | Required | `price_...` | payment-service |
| `STRIPE_PRO_PRICE_ID` | Pro plan price ID | Required | `price_...` | payment-service |
| `STRIPE_ENTERPRISE_PRICE_ID` | Enterprise plan price ID | Required | `price_...` | payment-service |

### Paystack (Africa)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `PAYSTACK_SECRET_KEY` | Paystack secret key | Optional | `sk_test_...` | payment-service |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | Optional | `pk_test_...` | payment-service |

### Flutterwave (Africa)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key | Optional | `FLWSECK_TEST-...` | payment-service |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key | Optional | `FLWPUBK_TEST-...` | payment-service |
| `FLUTTERWAVE_ENCRYPTION_KEY` | Encryption key | Optional | `FLWSECK_TEST-...` | payment-service |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Webhook secret | Optional | `<hash>` | payment-service |

---

## Email & Notifications

### SMTP Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `SMTP_HOST` | SMTP server host | Required | `smtp.sendgrid.net` | auth-service, notification-service |
| `SMTP_PORT` | SMTP server port | Required | `587` | auth-service, notification-service |
| `SMTP_SECURE` | Use TLS | Optional | `false` | auth-service, notification-service |
| `SMTP_USER` | SMTP username | Required | `apikey` | auth-service, notification-service |
| `SMTP_PASSWORD` | SMTP password | Required | `<api-key>` | auth-service, notification-service |
| `SMTP_PASS` | SMTP password (alias) | Optional | `<password>` | auth-service |
| `EMAIL_HOST` | Email host (alias) | Optional | `smtp.gmail.com` | auth-service |
| `EMAIL_PORT` | Email port (alias) | Optional | `587` | auth-service |
| `EMAIL_SECURE` | Email secure (alias) | Optional | `false` | auth-service |
| `EMAIL_USER` | Email user (alias) | Optional | `user@gmail.com` | auth-service |
| `EMAIL_PASS` | Email pass (alias) | Optional | `<app-password>` | auth-service |
| `EMAIL_FROM` | From email address | Required | `noreply@applyforus.com` | auth-service, notification-service |
| `EMAIL_FROM_NAME` | From display name | Optional | `ApplyForUs` | notification-service |
| `EMAIL_PROVIDER` | Email provider | Optional | `sendgrid` | Root config |
| `EMAIL_VERIFICATION_EXPIRY` | Verification token TTL (seconds) | Optional | `86400` | auth-service |
| `PASSWORD_RESET_EXPIRY` | Reset token TTL (seconds) | Optional | `3600` | auth-service |

### SendGrid

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `SENDGRID_API_KEY` | SendGrid API key | Optional | `SG.xxx` | notification-service |
| `SENDGRID_FROM_EMAIL` | SendGrid from address | Optional | `noreply@applyforus.com` | notification-service |
| `SENDGRID_FROM_NAME` | SendGrid from name | Optional | `ApplyForUs` | notification-service |

### Firebase Cloud Messaging (FCM)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `FCM_SERVICE_ACCOUNT` | FCM service account JSON | Required* | `{"type":"service_account",...}` | notification-service |
| `FCM_SERVICE_ACCOUNT_PATH` | FCM service account file path | Optional | `/path/to/firebase-sa.json` | notification-service |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Required | `your-project-id` | notification-service |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Required | `-----BEGIN PRIVATE KEY-----\n...` | notification-service |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Required | `firebase-adminsdk-xxx@project.iam.gserviceaccount.com` | notification-service |

### Apple Push Notification Service (APNs)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `APNS_KEY_ID` | APNs key ID (10 chars) | Required* | `ABC123XYZ1` | notification-service |
| `APNS_TEAM_ID` | Apple Team ID (10 chars) | Required* | `ABC123XYZ1` | notification-service |
| `APNS_KEY` | APNs private key (.p8 content) | Required* | `-----BEGIN PRIVATE KEY-----\n...` | notification-service |
| `APNS_PRODUCTION` | Use production APNs | Optional | `false` | notification-service |

*Required for iOS push notifications

### Firebase Web Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | Required | `AIza...` | web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Required | `project.firebaseapp.com` | web app |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Required | `your-project-id` | web app |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Required | `project.appspot.com` | web app |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | Required | `123456789012` | web app |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Required | `1:123:web:abc` | web app |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web push VAPID key | Required | `BHg...` | web app |

---

## Cloud Storage

### Azure Blob Storage (Production)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name | Required | `applyforusstorage` | resume-service, user-service |
| `AZURE_STORAGE_ACCOUNT_KEY` | Storage account key | Required | `<key>` | resume-service, user-service |
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string | Optional | `DefaultEndpointsProtocol=https;...` | resume-service, user-service |
| `AZURE_BLOB_CONTAINER_RESUMES` | Resumes container | Required | `resumes` | resume-service |
| `AZURE_BLOB_CONTAINER_PARSED` | Parsed resumes container | Required | `parsed-resumes` | resume-service |
| `AZURE_BLOB_CONTAINER_GENERATED` | Generated resumes container | Required | `generated-resumes` | resume-service |
| `AZURE_BLOB_CONTAINER_UPLOADS` | User uploads container | Required | `user-uploads` | user-service |
| `AZURE_BLOB_CONTAINER_PROFILE_PHOTOS` | Profile photos container | Required | `profile-photos` | user-service |
| `AZURE_BLOB_CONTAINER_DOCUMENTS` | Documents container | Optional | `documents` | user-service |
| `BLOB_SIGNED_URL_EXPIRATION` | Signed URL TTL (seconds) | Optional | `3600` | resume-service |

### AWS S3 (Development Fallback)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key | Required (Dev) | `AKIA...` | resume-service, user-service |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Required (Dev) | `<secret>` | resume-service, user-service |
| `AWS_REGION` | AWS region | Required (Dev) | `us-east-1` | resume-service, user-service |
| `AWS_S3_REGION` | S3 region (alias) | Optional | `us-east-1` | Root config |
| `AWS_S3_BUCKET` | S3 bucket name | Required (Dev) | `applyforus-resumes` | resume-service, user-service |
| `AWS_S3_RESUMES_BUCKET` | Resumes bucket | Optional | `applyforus-resumes` | Root config |
| `AWS_S3_USER_UPLOADS_BUCKET` | User uploads bucket | Optional | `applyforus-uploads` | Root config |
| `AWS_S3_RESUMES_PREFIX` | Resumes folder prefix | Optional | `resumes/` | resume-service, user-service |
| `AWS_S3_PARSED_PREFIX` | Parsed resumes prefix | Optional | `parsed-resumes/` | resume-service |
| `AWS_S3_GENERATED_PREFIX` | Generated resumes prefix | Optional | `generated-resumes/` | resume-service |
| `AWS_S3_PROFILE_PHOTOS_PREFIX` | Profile photos prefix | Optional | `profile-photos/` | user-service |
| `S3_SIGNED_URL_EXPIRATION` | Signed URL TTL (seconds) | Optional | `3600` | resume-service |

---

## Search & Indexing

### Elasticsearch

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `ELASTICSEARCH_URL` | Elasticsearch URL | Required | `https://...azurewebsites.net:9200` | job-service |
| `ELASTICSEARCH_NODE` | Elasticsearch node URL | Optional | `https://...azurewebsites.net:9200` | job-service |
| `ELASTICSEARCH_USERNAME` | Elasticsearch username | Required | `elastic` | job-service |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch password | Required | `<password>` | job-service |
| `ELASTICSEARCH_SSL` | Enable SSL | Optional | `true` | job-service |

---

## Service URLs

### Inter-Service Communication (Kubernetes DNS)

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `AI_SERVICE_URL` | AI service URL | Required | `http://ai-service.applyforus.svc.cluster.local:8000` | job-service, resume-service |
| `AUTH_SERVICE_URL` | Auth service URL | Required | `http://auth-service.applyforus.svc.cluster.local:8001` | All backend |
| `USER_SERVICE_URL` | User service URL | Required | `http://user-service.applyforus.svc.cluster.local:8002` | auth-service, resume-service |
| `RESUME_SERVICE_URL` | Resume service URL | Required | `http://resume-service.applyforus.svc.cluster.local:8003` | auto-apply-service |
| `JOB_SERVICE_URL` | Job service URL | Required | `http://job-service.applyforus.svc.cluster.local:8004` | auth-service, auto-apply-service |
| `AUTO_APPLY_SERVICE_URL` | Auto-apply service URL | Required | `http://auto-apply-service.applyforus.svc.cluster.local:8005` | api-gateway |
| `ANALYTICS_SERVICE_URL` | Analytics service URL | Required | `http://analytics-service.applyforus.svc.cluster.local:8006` | api-gateway |
| `NOTIFICATION_SERVICE_URL` | Notification service URL | Required | `http://notification-service.applyforus.svc.cluster.local:8007` | auto-apply-service |
| `ORCHESTRATOR_SERVICE_URL` | Orchestrator service URL | Optional | `http://orchestrator-service.applyforus.svc.cluster.local:8008` | api-gateway |
| `PAYMENT_SERVICE_URL` | Payment service URL | Required | `http://payment-service.applyforus.svc.cluster.local:3000` | api-gateway |
| `APPLICATION_SERVICE_URL` | Application service URL (alias) | Optional | `http://auto-apply-service...` | user-service |

### Service Ports

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `AI_SERVICE_PORT` | AI service port | Optional | `8000` | Root config |
| `AUTH_SERVICE_PORT` | Auth service port | Optional | `8001` | Root config |
| `USER_SERVICE_PORT` | User service port | Optional | `8002` | Root config |
| `RESUME_SERVICE_PORT` | Resume service port | Optional | `8003` | Root config |
| `JOB_SERVICE_PORT` | Job service port | Optional | `8004` | Root config |
| `AUTO_APPLY_SERVICE_PORT` | Auto-apply service port | Optional | `8005` | Root config |
| `ANALYTICS_SERVICE_PORT` | Analytics service port | Optional | `8006` | Root config |
| `NOTIFICATION_SERVICE_PORT` | Notification service port | Optional | `8007` | Root config |
| `ORCHESTRATOR_SERVICE_PORT` | Orchestrator service port | Optional | `8008` | Root config |
| `WS_PORT` | WebSocket port | Optional | `3001` | Root config |
| `WS_PATH` | WebSocket path | Optional | `/ws` | Root config |

---

## CORS & Rate Limiting

### CORS Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `CORS_ORIGINS` | Allowed origins (comma-separated) | Required | `https://applyforus.com,https://www.applyforus.com` | All backend |
| `CORS_ORIGIN` | Allowed origins (alias) | Optional | `https://applyforus.com` | payment-service |
| `CORS_ALLOW_CREDENTIALS` | Allow credentials | Optional | `true` | All backend |

### Rate Limiting

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `THROTTLE_TTL` | Rate limit window (ms) | Optional | `60000` | auth-service, api-gateway |
| `THROTTLE_LIMIT` | Max requests per window | Optional | `100` | auth-service, api-gateway |
| `RATE_LIMIT_TTL` | Rate limit window (alias) | Optional | `60` | job-service |
| `RATE_LIMIT_MAX` | Max requests (alias) | Optional | `100` | job-service |
| `RATE_LIMIT_WINDOW` | Window in seconds | Optional | `60` | Root config |
| `RATE_LIMIT_WINDOW_MS` | Window in milliseconds | Optional | `900000` | Root config |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests | Optional | `100` | Root config |
| `RATE_LIMIT_REQUESTS` | AI service rate limit | Optional | `100` | ai-service |
| `RATE_LIMIT_PERIOD` | AI service rate period | Optional | `60` | ai-service |
| `API_RATE_LIMIT` | API rate limit | Optional | `100` | Root config |
| `API_RATE_WINDOW` | API rate window | Optional | `15` | Root config |

---

## Browser Automation

### Playwright Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `BROWSER_HEADLESS` | Run headless | Optional | `true` | auto-apply-service |
| `HEADLESS_BROWSER` | Run headless (alias) | Optional | `true` | Root config |
| `BROWSER_TIMEOUT` | Navigation timeout (ms) | Optional | `30000` | auto-apply-service |
| `ACTION_DELAY` | Delay between actions (ms) | Optional | `1000` | auto-apply-service |
| `VIEWPORT_WIDTH` | Browser viewport width | Optional | `1920` | auto-apply-service |
| `VIEWPORT_HEIGHT` | Browser viewport height | Optional | `1080` | auto-apply-service |
| `USER_AGENT` | Custom user agent | Optional | `Mozilla/5.0...` | auto-apply-service |
| `BROWSER_DEBUG` | Enable browser debug logs | Optional | `false` | auto-apply-service |

### Proxy Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `PROXY_ENABLED` | Enable proxy | Optional | `false` | auto-apply-service |
| `PROXY_HOST` | Proxy host | Optional | `proxy.example.com` | auto-apply-service |
| `PROXY_PORT` | Proxy port | Optional | `8080` | auto-apply-service |
| `PROXY_USERNAME` | Proxy username | Optional | `user` | auto-apply-service |
| `PROXY_PASSWORD` | Proxy password | Optional | `pass` | auto-apply-service |

### Job Processing

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `MAX_CONCURRENT_JOBS` | Max concurrent jobs | Optional | `3` | auto-apply-service |
| `MAX_APPLICATIONS_PER_DAY` | Max daily applications | Optional | `50` | auto-apply-service |
| `JOB_PROCESSING_TIMEOUT` | Job timeout (ms) | Optional | `300000` | auto-apply-service |
| `MAX_RETRY_ATTEMPTS` | Max retries | Optional | `3` | auto-apply-service |
| `RETRY_DELAY` | Delay between retries (ms) | Optional | `60000` | auto-apply-service |
| `QUEUE_NAME` | Bull queue name | Optional | `auto-apply-jobs` | auto-apply-service |
| `QUEUE_REMOVE_ON_COMPLETE` | Remove completed jobs (ms) | Optional | `3600000` | auto-apply-service |
| `QUEUE_REMOVE_ON_FAIL` | Remove failed jobs (ms) | Optional | `86400000` | auto-apply-service |

### Platform Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `LINKEDIN_AUTO_APPLY` | Enable LinkedIn auto-apply | Optional | `true` | auto-apply-service |
| `INDEED_AUTO_APPLY` | Enable Indeed auto-apply | Optional | `true` | auto-apply-service |
| `GLASSDOOR_AUTO_APPLY` | Enable Glassdoor auto-apply | Optional | `false` | auto-apply-service |
| `PLATFORM_RATE_LIMIT_DELAY` | Platform rate limit (ms) | Optional | `10000` | auto-apply-service |
| `MAX_APPLICATIONS_PER_PLATFORM_HOURLY` | Max hourly per platform | Optional | `10` | auto-apply-service |

### Anti-Detection

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `RANDOM_DELAYS` | Enable random delays | Optional | `true` | auto-apply-service |
| `SIMULATE_MOUSE_MOVEMENT` | Simulate mouse | Optional | `true` | auto-apply-service |
| `HUMAN_TYPING_SPEED` | Human-like typing | Optional | `true` | auto-apply-service |
| `TYPING_SPEED_MIN` | Min typing delay (ms) | Optional | `50` | auto-apply-service |
| `TYPING_SPEED_MAX` | Max typing delay (ms) | Optional | `150` | auto-apply-service |

---

## Monitoring & Logging

### Logging

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `LOG_LEVEL` | Log level | Optional | `info`, `debug`, `error`, `warn` | All |
| `LOG_DIR` | Log directory | Optional | `./logs` | payment-service |
| `LOG_FILE_OPERATIONS` | Log file operations | Optional | `true` | resume-service |
| `DEBUG` | Debug mode | Optional | `true` | ai-service |

### Azure Application Insights

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights connection | Optional | `InstrumentationKey=...` | All |
| `APPLICATIONINSIGHTS_INSTRUMENTATION_KEY` | App Insights key | Optional | `<guid>` | All |

### Sentry

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `SENTRY_DSN` | Sentry DSN | Optional | `https://...@sentry.io/...` | All |

### Metrics

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `ENABLE_METRICS` | Enable Prometheus metrics | Optional | `true` | All |
| `METRICS_PORT` | Metrics endpoint port | Optional | `9090` | All |

### Analytics

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `GOOGLE_ANALYTICS_ID` | GA tracking ID | Optional | `G-...` | web app |
| `NEXT_PUBLIC_GA_TRACKING_ID` | GA tracking ID (Next.js) | Optional | `G-...` | web app |
| `MIXPANEL_TOKEN` | Mixpanel token | Optional | `<token>` | web app |

---

## Feature Flags

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `FEATURE_AUTO_APPLY` | Enable auto-apply | Optional | `true` | auto-apply-service |
| `FEATURE_AI_RESUME_BUILDER` | Enable AI resume builder | Optional | `true` | resume-service |
| `FEATURE_ANALYTICS_DASHBOARD` | Enable analytics dashboard | Optional | `true` | analytics-service |
| `FEATURE_CHROME_EXTENSION` | Enable Chrome extension | Optional | `true` | Root config |
| `AI_SUGGESTIONS_ENABLED` | Enable AI suggestions | Optional | `true` | resume-service |
| `RESUME_OPTIMIZATION_ENABLED` | Enable resume optimization | Optional | `true` | resume-service |
| `SALARY_PREDICTION_ENABLED` | Enable salary predictions | Optional | `true` | ai-service |
| `NOTIFICATIONS_ENABLED` | Enable notifications | Optional | `true` | auto-apply-service |
| `ENABLE_VERSION_CONTROL` | Enable version control | Optional | `true` | resume-service |
| `ENABLE_ANALYTICS` | Enable analytics tracking | Optional | `true` | resume-service |

---

## File Upload Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `MAX_FILE_SIZE` | Max file size (bytes) | Optional | `5242880` | resume-service, user-service |
| `ALLOWED_FILE_TYPES` | Allowed MIME types | Optional | `application/pdf,...` | resume-service |
| `ALLOWED_FILE_EXTENSIONS` | Allowed extensions | Optional | `.pdf,.doc,.docx,.txt` | resume-service |
| `ALLOWED_IMAGE_TYPES` | Allowed image types | Optional | `image/jpeg,image/png` | user-service |
| `ALLOWED_DOCUMENT_TYPES` | Allowed document types | Optional | `application/pdf,...` | user-service |
| `UPLOAD_TEMP_DIR` | Temporary upload directory | Optional | `./temp/uploads` | resume-service |
| `MAX_UPLOADS_PER_DAY` | Max uploads per user/day | Optional | `10` | resume-service |
| `MAX_DOWNLOADS_PER_DAY` | Max downloads per user/day | Optional | `50` | resume-service |
| `MAX_PDF_PAGES` | Max PDF pages to parse | Optional | `10` | resume-service |
| `OCR_ENABLED` | Enable OCR for scanned PDFs | Optional | `false` | resume-service |
| `OCR_SERVICE` | OCR service to use | Optional | `tesseract` | resume-service |

### Document Generation

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `DEFAULT_RESUME_TEMPLATE` | Default template | Optional | `professional` | resume-service |
| `TEMPLATES_DIR` | Templates directory | Optional | `./templates` | resume-service |
| `PDF_GENERATOR` | PDF engine | Optional | `puppeteer` | resume-service |
| `DOCUMENT_QUALITY` | Output quality | Optional | `high` | resume-service |

### Version Control

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `MAX_VERSIONS_PER_RESUME` | Max resume versions | Optional | `10` | resume-service |

---

## Additional Configuration

### Virus Scanning

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `VIRUS_SCAN_ENABLED` | Enable virus scanning | Optional | `false` | resume-service |
| `CLAMAV_HOST` | ClamAV host | Optional | `localhost` | resume-service |
| `CLAMAV_PORT` | ClamAV port | Optional | `3310` | resume-service |

### Job Board APIs

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `INDEED_API_KEY` | Indeed API key | Optional | `<key>` | job-service |
| `LINKEDIN_API_KEY` | LinkedIn API key | Optional | `<key>` | job-service |
| `GLASSDOOR_API_KEY` | Glassdoor API key | Optional | `<key>` | job-service |
| `ZIPRECRUITER_API_KEY` | ZipRecruiter API key | Optional | `<key>` | job-service |

### Analytics Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `ANALYTICS_RETENTION_DAYS` | Data retention days | Optional | `90` | analytics-service |
| `ANALYTICS_AGGREGATION_INTERVAL` | Aggregation interval (ms) | Optional | `3600000` | analytics-service |
| `ANALYTICS_ENABLE_REALTIME` | Enable realtime analytics | Optional | `true` | analytics-service |
| `ANALYTICS_MAX_EVENTS_BATCH` | Max events per batch | Optional | `1000` | analytics-service |
| `EXPORT_MAX_RECORDS` | Max export records | Optional | `50000` | analytics-service |
| `EXPORT_FORMATS` | Export formats | Optional | `csv,json` | analytics-service |
| `EXPORT_CHUNK_SIZE` | Export chunk size | Optional | `5000` | analytics-service |

### Job Aggregation

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `JOB_AGGREGATION_CRON` | Aggregation schedule | Optional | `0 */6 * * *` | job-service |
| `JOB_RETENTION_DAYS` | Job data retention days | Optional | `90` | job-service |

### Backup Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `AUTO_BACKUP_ENABLED` | Enable auto backup | Optional | `false` | resume-service |
| `BACKUP_FREQUENCY_HOURS` | Backup frequency | Optional | `24` | resume-service |

### Webhooks

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `WEBHOOK_URL` | Webhook endpoint | Optional | `https://...` | resume-service |
| `WEBHOOK_SECRET` | Webhook signing secret | Optional | `<secret>` | resume-service |

### Two-Factor Authentication

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `TWO_FACTOR_APP_NAME` | 2FA app name | Optional | `ApplyForUs` | auth-service |

### API Keys for Inter-Service Communication

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `API_KEY_SECRET` | Internal API key | Optional | `<secret>` | payment-service |

### Chrome Extension

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `EXTENSION_ID` | Chrome extension ID | Optional | `<extension-id>` | Root config |
| `EXTENSION_SECRET` | Extension secret | Optional | `<secret>` | Root config |

### Mobile App

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `MOBILE_API_URL` | Mobile API URL | Optional | `https://api.applyforus.com/api/mobile` | mobile app |
| `MOBILE_WS_URL` | Mobile WebSocket URL | Optional | `wss://ws.applyforus.com` | mobile app |

### Screenshot Configuration

| Variable | Description | Required | Example | Services |
|----------|-------------|----------|---------|----------|
| `SCREENSHOT_ON_ERROR` | Screenshot on error | Optional | `true` | auto-apply-service |
| `SCREENSHOT_PATH` | Screenshot directory | Optional | `./screenshots` | auto-apply-service |

---

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong, random values** for all secrets (minimum 32 characters for cryptographic secrets)
3. **Generate secrets** using: `openssl rand -base64 64`
4. **Rotate secrets regularly** in production
5. **Use Azure Key Vault** for production secret management
6. **Enable SSL/TLS** for all database and Redis connections in production
7. **Store sensitive values in Kubernetes secrets** for production deployments

---

## Quick Reference: Required Variables by Service

### auth-service
- `DATABASE_URL` or `DB_*` variables
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for OAuth)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

### payment-service
- `DB_*` variables
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RABBITMQ_URL` (development) or `AZURE_SERVICE_BUS_CONNECTION_STRING` (production)

### ai-service
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

### notification-service
- `DB_*` variables
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `FCM_SERVICE_ACCOUNT` (for push notifications)
- `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY` (for iOS)
