# Auth + Data Integrity Documentation

## Overview

This document provides comprehensive documentation on the authentication flows, database schema, migration process, and health check endpoints for the ApplyForUs platform's authentication service.

**Service:** Auth Service
**Location:** `/services/auth-service/`
**Database:** Azure Database for PostgreSQL (Flexible Server)
**ORM:** TypeORM
**Authentication:** JWT (JSON Web Tokens) with Refresh Token Rotation

---

## Table of Contents

1. [Authentication Flow Overview](#authentication-flow-overview)
2. [Database Configuration](#database-configuration)
3. [Database Schema](#database-schema)
4. [Migration Process](#migration-process)
5. [Health Check Endpoints](#health-check-endpoints)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Authentication Flow Overview

### 1. User Registration Flow

```
┌─────────────┐     Registration Request      ┌──────────────┐
│   Client    │ ──────────────────────────────>│  Auth API    │
│ (Frontend)  │                                │ (/register)  │
└─────────────┘                                └──────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────┐
                                          │ 1. Validate Input  │
                                          │ 2. Check Duplicates│
                                          │ 3. Hash Password   │
                                          └────────────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────┐
                                          │ PostgreSQL (Azure) │
                                          │ INSERT INTO users  │
                                          └────────────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────┐
                                          │ Generate JWT Tokens│
                                          │ - Access Token     │
                                          │ - Refresh Token    │
                                          └────────────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────┐
                                          │ Send Verification  │
                                          │ Email (async)      │
                                          └────────────────────┘
```

**Key Steps:**

1. **Validation**: Email format, password strength (min 8 chars, uppercase, lowercase, number, special character)
2. **Duplicate Check**: Verify email and username uniqueness
3. **Password Hashing**: Use bcrypt with 12 salt rounds
4. **User Creation**: Insert user record in PostgreSQL with `pending_verification` status
5. **Token Generation**: Create JWT access token (15min) and refresh token (7d)
6. **Email Verification**: Send verification email with token (24h expiry)

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "status": "pending_verification"
  },
  "expiresIn": 900
}
```

---

### 2. Login Flow

```
┌─────────────┐      Login Request          ┌──────────────┐
│   Client    │ ──────────────────────────>│  Auth API    │
│ (Frontend)  │                             │  (/login)    │
└─────────────┘                             └──────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────┐
                                       │ 1. Find User by Email│
                                       │ 2. Check Account Lock│
                                       │ 3. Validate Password │
                                       │ 4. Check MFA (if on) │
                                       └──────────────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────┐
                                       │ PostgreSQL Update:   │
                                       │ - Reset login attempts│
                                       │ - Update lastLoginAt │
                                       │ - Update lastLoginIp │
                                       └──────────────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────┐
                                       │ Generate JWT Tokens  │
                                       │ Store Refresh Token  │
                                       └──────────────────────┘
```

**Key Steps:**

1. **User Lookup**: Find user by email in PostgreSQL
2. **Account Lock Check**: Verify account not locked due to failed attempts
3. **Password Validation**: Compare bcrypt hash
4. **Status Check**: Ensure user status is `active` (not `suspended`, `inactive`)
5. **MFA Verification**: If enabled, validate TOTP token
6. **Login Attempts**: Reset counter on success, increment on failure
7. **Session Tracking**: Update `lastLoginAt`, `lastLoginIp`
8. **Token Generation**: Issue new access and refresh tokens

**Security Features:**

- **Account Lockout**: 5 failed attempts → 15 minute lock
- **Rate Limiting**: Max 10 login requests per minute
- **IP Tracking**: Record login IP for security auditing
- **MFA Support**: Optional TOTP-based 2FA

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "mfaToken": "123456",
  "rememberMe": true
}
```

---

### 3. Token Refresh Flow

```
┌─────────────┐    Refresh Token Request    ┌──────────────┐
│   Client    │ ──────────────────────────>│  Auth API    │
│             │                             │  (/refresh)  │
└─────────────┘                             └──────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────┐
                                       │ 1. Validate JWT      │
                                       │ 2. Extract User ID   │
                                       │ 3. Compare Hash      │
                                       └──────────────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────┐
                                       │ PostgreSQL Query:    │
                                       │ SELECT refreshToken  │
                                       │ FROM users WHERE id  │
                                       └──────────────────────┘
                                                    │
                                                    ▼
                                       ┌──────────────────────┐
                                       │ Generate New Tokens  │
                                       │ Update Refresh Token │
                                       └──────────────────────┘
```

**Key Steps:**

1. **JWT Validation**: Verify refresh token signature and expiry
2. **User Lookup**: Find user by JWT payload `sub` (user ID)
3. **Token Comparison**: Compare provided token with hashed token in DB
4. **Status Check**: Verify user is still `active`
5. **Token Rotation**: Generate new access + refresh tokens
6. **Database Update**: Store new hashed refresh token

**Token Rotation Security:**

- Each refresh invalidates the previous refresh token
- Prevents token reuse attacks
- Detects token theft (if old token used after refresh)

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. Session Management

**Access Token:**
- **Lifetime**: 15 minutes
- **Storage**: Client memory (React state, not localStorage)
- **Purpose**: Short-lived authentication for API requests
- **Payload**: User ID, email, role

**Refresh Token:**
- **Lifetime**: 7 days (web), 30 days (mobile apps)
- **Storage**: httpOnly, secure, sameSite cookies (recommended)
- **Purpose**: Long-lived token to obtain new access tokens
- **Security**: Hashed with bcrypt before storing in database

**Logout Process:**

1. Client sends logout request with access token
2. Server invalidates refresh token in database (set to NULL)
3. Client discards tokens from memory/cookies
4. Any subsequent refresh attempts will fail

**Endpoint:** `POST /api/v1/auth/logout`

---

## Database Configuration

### Connection Settings

**TypeORM Configuration** (`/services/auth-service/src/config/typeorm.config.ts`):

```typescript
{
  type: 'postgres',
  host: process.env.DB_HOST,           // Azure PostgreSQL endpoint
  port: parseInt(process.env.DB_PORT),  // 5432
  username: process.env.DB_USERNAME,    // applyforusadmin@applyforus-postgres
  password: process.env.DB_PASSWORD,    // From Azure Key Vault
  database: process.env.DB_NAME,        // applyforus

  // SSL Configuration (Required for Azure)
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,          // Azure uses self-signed certs
  } : false,

  // Connection Pooling
  extra: {
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: 30000,           // 30 seconds
    connectionTimeoutMillis: 2000,      // 2 seconds
  },

  // Entity and Migration Paths
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],

  // Safety
  synchronize: false,                   // NEVER true in production
  logging: process.env.DB_LOGGING === 'true',
}
```

### Environment Variables

**Production (.env.production):**
```bash
# Azure PostgreSQL
DB_HOST=applyforus-postgres.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=applyforusadmin@applyforus-postgres
DB_PASSWORD=<from-azure-key-vault>
DB_DATABASE=applyforus
DB_SSL=true
DB_MAX_CONNECTIONS=20
DB_LOGGING=false

# Alternative: DATABASE_URL format
DATABASE_URL=postgresql://applyforusadmin@applyforus-postgres:${DB_PASSWORD}@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require
```

**Local Development (.env.local):**
```bash
# Local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=auth_service_db
DB_SSL=false
DB_MAX_CONNECTIONS=10
DB_LOGGING=true
```

### Connection Pool Configuration

**Recommended Settings:**

- **Production**: 20 connections per service instance
- **Development**: 10 connections
- **Idle Timeout**: 30 seconds (release unused connections)
- **Connection Timeout**: 2 seconds (fail fast if DB unavailable)

**Scaling Considerations:**

- Azure PostgreSQL Flexible Server supports up to 500+ connections
- With 5 service instances × 20 connections = 100 connections
- Leave headroom for admin connections and monitoring tools
- Monitor connection usage via Azure Portal metrics

---

## Database Schema

### Users Table

**Table Name:** `users`
**Engine:** PostgreSQL 14+
**Character Set:** UTF-8

**Schema Definition:**

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Authentication
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),                      -- Bcrypt hash
  authProvider auth_provider NOT NULL DEFAULT 'local',
  providerId VARCHAR(255),                    -- OAuth provider ID

  -- Profile
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  phoneNumber VARCHAR(50),
  profilePicture VARCHAR(500),

  -- Authorization
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'pending_verification',

  -- Email Verification
  isEmailVerified BOOLEAN NOT NULL DEFAULT false,
  emailVerificationToken VARCHAR(500),
  emailVerificationExpiry TIMESTAMP WITH TIME ZONE,

  -- Password Reset
  passwordResetToken VARCHAR(500),
  passwordResetExpiry TIMESTAMP WITH TIME ZONE,

  -- Multi-Factor Authentication
  isMfaEnabled BOOLEAN NOT NULL DEFAULT false,
  mfaSecret VARCHAR(255),                     -- TOTP secret

  -- Session Management
  refreshToken TEXT,                          -- Bcrypt hashed
  lastLoginAt TIMESTAMP WITH TIME ZONE,
  lastLoginIp VARCHAR(50),

  -- Security
  loginAttempts INTEGER NOT NULL DEFAULT 0,
  lockedUntil TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB,                             -- Flexible key-value store

  -- Timestamps
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Enum Types

```sql
-- User Roles
CREATE TYPE user_role AS ENUM (
  'admin',
  'user',
  'recruiter',
  'moderator'
);

-- User Status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'pending_verification'
);

-- Authentication Providers
CREATE TYPE auth_provider AS ENUM (
  'local',
  'google',
  'linkedin',
  'github'
);
```

### Indexes

```sql
-- Performance Indexes
CREATE UNIQUE INDEX IDX_USERS_EMAIL ON users(email);
CREATE UNIQUE INDEX IDX_USERS_USERNAME ON users(username);
CREATE INDEX IDX_USERS_ROLE ON users(role);
CREATE INDEX IDX_USERS_STATUS ON users(status);
CREATE INDEX IDX_USERS_AUTH_PROVIDER ON users(authProvider, providerId);

-- Token Lookup Indexes (for faster verification)
CREATE INDEX IDX_USERS_EMAIL_VERIFICATION_TOKEN ON users(emailVerificationToken);
CREATE INDEX IDX_USERS_PASSWORD_RESET_TOKEN ON users(passwordResetToken);
```

### Roles Table (RBAC Extension)

**Table Name:** `roles`
**Purpose:** Role-Based Access Control with granular permissions

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,     -- Array of permission strings
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '["*"]'::jsonb),
  ('user', 'Standard user access', '["profile:read", "profile:write", "jobs:read", "applications:write"]'::jsonb),
  ('recruiter', 'Recruiter access', '["jobs:write", "candidates:read", "interviews:write"]'::jsonb),
  ('moderator', 'Content moderation access', '["users:read", "content:moderate", "reports:read"]'::jsonb);
```

### Entity Relationships

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ email        │
│ role (FK)    │───────┐
│ ...          │       │
└──────────────┘       │
                       │
                       ▼
                 ┌──────────────┐
                 │    roles     │
                 ├──────────────┤
                 │ id (PK)      │
                 │ name         │
                 │ permissions  │
                 └──────────────┘
```

---

## Migration Process

### Migration Files

**Location:** `/services/auth-service/src/migrations/`

**Files:**
1. `1733200000000-InitialSchema.ts` - Creates users table, indexes, enums
2. `1733210000000-SeedRolesAndPermissions.ts` - Seeds roles and admin user

### Running Migrations

**Development:**
```bash
cd services/auth-service

# Generate a new migration (after entity changes)
npm run migration:generate -- src/migrations/MyMigration

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

**Production (Azure):**

```bash
# Via Kubernetes Job (Recommended)
kubectl apply -f infrastructure/kubernetes/jobs/auth-migration-job.yaml

# Manual execution (from local machine)
NODE_ENV=production npm run migration:run

# Via CI/CD Pipeline
# Runs automatically during deployment before starting new pods
```

### Migration Best Practices

1. **Always use migrations**: Never use `synchronize: true` in production
2. **Test migrations**: Run against local DB first, then staging
3. **Backup before migration**: Azure PostgreSQL auto-backups, but verify
4. **Idempotent migrations**: Use `ON CONFLICT DO NOTHING` for seeds
5. **Rollback plan**: Test `down()` methods work correctly
6. **Schema versioning**: Keep migrations in version control

### Initial Schema Migration

**File:** `1733200000000-InitialSchema.ts`

**What it does:**

1. Enables `uuid-ossp` extension
2. Creates enum types: `user_role`, `user_status`, `auth_provider`
3. Creates `users` table with all columns
4. Creates performance indexes
5. Adds table and column comments for documentation

**Run status:**
```bash
# Check if migration has run
npm run migration:show

# Expected output:
# [X] InitialSchema1733200000000 (EXECUTED)
# [X] SeedRolesAndPermissions1733210000000 (EXECUTED)
```

### Seeding Data

**File:** `1733210000000-SeedRolesAndPermissions.ts`

**Seeds:**

1. **Default Admin User**
   - Email: `admin@applyforus.com`
   - Password: `Admin@123456` (bcrypt hashed)
   - Role: `admin`
   - Status: `active`

2. **Default Roles**
   - Admin (full access)
   - User (standard access)
   - Recruiter (job posting access)
   - Moderator (content moderation)

**Security Note:** Change default admin password immediately after deployment!

---

## Health Check Endpoints

### 1. Basic Health Check

**Endpoint:** `GET /health`
**Purpose:** Quick service status check
**Authentication:** Public (no auth required)

**Response:**
```json
{
  "status": "ok",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2025-12-15T10:30:00.000Z"
}
```

**Use Case:** Load balancer health checks, monitoring dashboards

---

### 2. Liveness Probe

**Endpoint:** `GET /health/live`
**Purpose:** Kubernetes liveness probe - "Is the process alive?"
**Authentication:** Public
**Checks:** Process uptime, memory usage

**Response:**
```json
{
  "status": "ok",
  "service": "auth-service",
  "timestamp": "2025-12-15T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "heapUsed": 45.23,
    "heapTotal": 89.50,
    "rss": 120.75
  }
}
```

**Kubernetes Configuration:**
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

**Behavior:**
- **Success (200)**: Process is alive, Kubernetes does nothing
- **Failure (500/timeout)**: Kubernetes restarts the pod after 3 consecutive failures

---

### 3. Readiness Probe

**Endpoint:** `GET /health/ready`
**Purpose:** Kubernetes readiness probe - "Can the service handle traffic?"
**Authentication:** Public
**Checks:** Database connectivity, critical dependencies

**Response (Healthy):**
```json
{
  "status": "ok",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2025-12-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "ok"
    }
  }
}
```

**Response (Unhealthy - 503):**
```json
{
  "status": "degraded",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2025-12-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "error",
      "message": "Connection timeout"
    }
  },
  "statusCode": 503
}
```

**Kubernetes Configuration:**
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
  successThreshold: 1
```

**Behavior:**
- **Success (200)**: Service receives traffic from load balancer
- **Failure (503)**: Service removed from load balancer rotation (no new requests)
- **Fail-Fast for DB**: If PostgreSQL is down, return 503 immediately
- **Fail-Open for Redis** (if implemented): If Redis is down, still return 200 (degraded but functional)

**Implementation** (`/services/auth-service/src/health/health.service.ts`):

```typescript
async getReadiness() {
  const checks = {
    database: await checkDatabaseConnection(this.dataSource),
  };

  const response = createHealthResponse('auth-service', '1.0.0', checks);

  if (response.status === 'degraded') {
    return {
      ...response,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    };
  }

  return response;
}
```

---

## Security Considerations

### 1. Password Security

- **Hashing Algorithm**: bcrypt with 12 salt rounds
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- **Storage**: NEVER store plain text passwords
- **Comparison**: Use `bcrypt.compare()` for constant-time comparison

### 2. Token Security

**Access Tokens:**
- Short-lived (15 minutes)
- Stored in memory only (not localStorage)
- Signed with HS256 algorithm
- Contains: user ID, email, role

**Refresh Tokens:**
- Longer-lived (7 days)
- Stored in httpOnly, secure, sameSite cookies
- Hashed before storing in database
- Single-use (rotation on refresh)

**JWT Configuration:**
```typescript
{
  secret: process.env.JWT_SECRET,              // Min 32 characters
  issuer: 'applyforus-auth-service',
  audience: 'applyforus-platform',
  expiresIn: '15m',                            // Access token
}
```

### 3. Database Security

**Connection Security:**
- SSL/TLS encryption enabled for Azure PostgreSQL
- Credentials stored in Azure Key Vault (not in code)
- Connection strings use environment variables
- IP whitelisting at Azure firewall level

**Query Security:**
- Parameterized queries (TypeORM prevents SQL injection)
- No raw SQL with user input
- Column-level encryption for sensitive fields (if needed)

**Access Control:**
- Database user has minimal required permissions
- Admin access restricted to authorized IPs
- Audit logging enabled in Azure

### 4. Rate Limiting

**Endpoint-Specific Limits:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 5 requests | 1 minute |
| `/auth/login` | 10 requests | 1 minute |
| `/auth/refresh` | 20 requests | 1 minute |
| `/auth/forgot-password` | 3 requests | 1 minute |
| Global | 100 requests | 1 minute |

**Implementation:** NestJS Throttler module with Redis backing

### 5. Account Security

**Login Attempts:**
- Max 5 failed attempts
- Account locked for 15 minutes
- Lock status stored in database
- Counter reset on successful login

**Email Verification:**
- Tokens expire after 24 hours
- One-time use (cleared after verification)
- Rate-limited resend (max 1 per 5 minutes)

**Password Reset:**
- Tokens expire after 1 hour
- One-time use
- All sessions invalidated after reset

### 6. CORS Configuration

**Production:**
```typescript
cors: {
  origin: [
    'https://applyforus.com',
    'https://www.applyforus.com',
    'https://api.applyforus.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

**Development:**
```typescript
cors: {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}
```

---

## Testing

### 1. Unit Tests

**Location:** `/services/auth-service/src/**/*.spec.ts`

**Run Tests:**
```bash
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:cov          # With coverage
```

**Coverage Targets:**
- Services: 90%+
- Controllers: 80%+
- Guards: 90%+
- Strategies: 90%+

### 2. E2E Tests

**Location:** `/services/auth-service/test/*.e2e-spec.ts`

**Test Files:**
1. `auth.e2e-spec.ts` - Standard auth flow tests
2. `auth-data-integrity.e2e-spec.ts` - Database integrity tests

**Run E2E Tests:**
```bash
npm run test:e2e                    # Run all e2e tests
npm run test:e2e auth-data-integrity # Run specific suite
```

**What's Tested:**

✅ User registration creates DB record
✅ Login returns valid JWT
✅ Token refresh works
✅ Protected endpoints require auth
✅ Database schema integrity
✅ Password hashing
✅ Refresh token rotation
✅ Account lockout
✅ Rate limiting
✅ Email verification flow

### 3. Integration Tests

**Database Integrity Tests** (`auth-data-integrity.e2e-spec.ts`):

```typescript
// Example test
it('should register user and create record in PostgreSQL', async () => {
  // 1. Register via API
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password, ... })
    .expect(201);

  // 2. Verify record in database
  const dbUser = await dataSource
    .getRepository(User)
    .findOne({ where: { email } });

  // 3. Verify data integrity
  expect(dbUser.password).not.toBe(password); // Hashed
  expect(dbUser.status).toBe('pending_verification');
  expect(dbUser.refreshToken).toBeDefined();
});
```

**Run Integration Tests:**
```bash
# Requires PostgreSQL running (Docker Compose or Azure)
docker-compose up -d postgres
npm run test:e2e auth-data-integrity
```

### 4. Load Tests

**Location:** `/tests/load/auth-load-test.js`

**Tools:** k6 (Grafana)

**Run Load Test:**
```bash
cd tests/load
k6 run auth-load-test.js --vus 100 --duration 5m
```

**Metrics:**
- Requests per second (target: 500+)
- Response time p95 (target: <200ms)
- Error rate (target: <0.1%)
- Database connection pool usage

---

## Troubleshooting

### Database Connection Issues

**Problem:** `Connection timeout` or `ECONNREFUSED`

**Solutions:**

1. **Check Azure PostgreSQL firewall rules:**
   ```bash
   az postgres flexible-server firewall-rule list \
     --resource-group applyforus-rg \
     --name applyforus-postgres
   ```

2. **Verify environment variables:**
   ```bash
   echo $DB_HOST
   echo $DB_USERNAME
   echo $DB_SSL
   ```

3. **Test connection manually:**
   ```bash
   psql "postgresql://user:pass@host:5432/dbname?sslmode=require"
   ```

4. **Check service logs:**
   ```bash
   kubectl logs -f deployment/auth-service -n applyforus
   ```

### Migration Failures

**Problem:** `Migration failed` or `Duplicate column`

**Solutions:**

1. **Check migration status:**
   ```bash
   npm run migration:show
   ```

2. **Rollback failed migration:**
   ```bash
   npm run migration:revert
   ```

3. **Fix and re-run:**
   ```bash
   npm run migration:run
   ```

4. **Manual intervention (last resort):**
   ```sql
   -- Connect to database
   SELECT * FROM migrations;

   -- Remove failed migration entry
   DELETE FROM migrations WHERE name = 'FailedMigration';
   ```

### JWT Token Issues

**Problem:** `Invalid token` or `Token expired`

**Solutions:**

1. **Verify JWT secret matches:**
   - Check `JWT_SECRET` in environment
   - Must be same across all service instances

2. **Check token expiry:**
   - Access tokens expire in 15 minutes
   - Use refresh token to get new access token

3. **Decode JWT to inspect:**
   ```bash
   # Use jwt.io or:
   echo "eyJhbGciOiJIUz..." | base64 -d
   ```

4. **Clear refresh token and re-login:**
   - Logout and login again
   - Refresh token may be invalidated

### Health Check Failures

**Problem:** Readiness probe failing, pod not receiving traffic

**Solutions:**

1. **Check database connectivity:**
   ```bash
   kubectl exec -it pod/auth-service-xxx -n applyforus -- \
     psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Increase probe timeouts:**
   ```yaml
   readinessProbe:
     timeoutSeconds: 5        # Increase to 10
     failureThreshold: 5      # Increase to 5
   ```

3. **Check service logs for errors:**
   ```bash
   kubectl logs pod/auth-service-xxx -n applyforus | grep -i error
   ```

4. **Verify health endpoint directly:**
   ```bash
   kubectl port-forward pod/auth-service-xxx 8001:8001
   curl http://localhost:8001/health/ready
   ```

### Performance Issues

**Problem:** Slow response times, high database connection usage

**Solutions:**

1. **Monitor connection pool:**
   ```typescript
   // Add logging
   console.log('DB Connections:', dataSource.driver.master.poolSize);
   ```

2. **Increase pool size (if needed):**
   ```bash
   DB_MAX_CONNECTIONS=30  # Increase from 20
   ```

3. **Add database indexes:**
   ```sql
   -- Check slow queries
   SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

   -- Add missing indexes
   CREATE INDEX idx_users_email_verified ON users(isEmailVerified);
   ```

4. **Enable query logging:**
   ```bash
   DB_LOGGING=true  # Temporarily, for debugging
   ```

### Email Delivery Issues

**Problem:** Verification emails not received

**Solutions:**

1. **Check email service logs:**
   ```bash
   kubectl logs pod/auth-service-xxx -n applyforus | grep -i email
   ```

2. **Verify SMTP credentials:**
   - Check `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
   - For Gmail, use App Password (not regular password)

3. **Test SMTP connection:**
   ```bash
   telnet smtp.gmail.com 587
   ```

4. **Check spam folder:**
   - Emails may be flagged as spam initially
   - Configure SPF, DKIM, DMARC records for domain

---

## Quick Reference

### Environment Variables Checklist

**Production:**
- [ ] `DB_HOST` - Azure PostgreSQL endpoint
- [ ] `DB_USERNAME` - Database username
- [ ] `DB_PASSWORD` - From Azure Key Vault
- [ ] `DB_SSL=true` - SSL enabled
- [ ] `JWT_SECRET` - Strong secret (32+ chars)
- [ ] `JWT_REFRESH_SECRET` - Different from JWT_SECRET
- [ ] `EMAIL_HOST` - SMTP server
- [ ] `EMAIL_USER` - SMTP username
- [ ] `EMAIL_PASS` - SMTP password or app password
- [ ] `CORS_ORIGINS` - Production domain whitelist

### Common Commands

```bash
# Development
npm run start:dev           # Start in dev mode
npm run migration:run       # Run migrations
npm run test                # Run unit tests
npm run test:e2e            # Run E2E tests

# Production
npm run build               # Build for production
npm run start:prod          # Start production server
kubectl apply -f k8s/       # Deploy to Kubernetes

# Database
npm run migration:generate  # Generate migration
npm run migration:revert    # Rollback migration
npm run migration:show      # Show status

# Monitoring
kubectl logs -f deployment/auth-service
kubectl get pods -n applyforus
kubectl describe pod/auth-service-xxx
```

### API Endpoints Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/register` | POST | Public | Register new user |
| `/auth/login` | POST | Public | Login with credentials |
| `/auth/logout` | POST | JWT | Logout and invalidate token |
| `/auth/refresh` | POST | Refresh Token | Get new access token |
| `/auth/me` | GET | JWT | Get current user profile |
| `/auth/verify-email` | POST | Public | Verify email with token |
| `/auth/forgot-password` | POST | Public | Request password reset |
| `/auth/reset-password` | POST | Public | Reset password with token |
| `/auth/password/change` | POST | JWT | Change password |
| `/auth/mfa/setup` | POST | JWT | Setup MFA |
| `/auth/mfa/verify` | POST | JWT | Verify and enable MFA |
| `/auth/mfa/disable` | POST | JWT | Disable MFA |
| `/health` | GET | Public | Basic health check |
| `/health/live` | GET | Public | Liveness probe |
| `/health/ready` | GET | Public | Readiness probe |

---

## Support and Resources

**Documentation:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Azure PostgreSQL Docs](https://learn.microsoft.com/en-us/azure/postgresql/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

**Internal Resources:**
- Architecture Diagrams: `/docs/architecture/`
- API Documentation: Swagger UI at `/api/docs`
- Migration History: `/services/auth-service/src/migrations/`
- Test Coverage: `/coverage/lcov-report/index.html`

**Contact:**
- Development Team: #applyforus-dev
- DevOps Team: #applyforus-devops
- Security Team: #applyforus-security

---

**Last Updated:** 2025-12-15
**Version:** 1.0.0
**Maintained By:** ApplyForUs Platform Team
