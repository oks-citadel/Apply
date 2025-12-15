# Current Reality Map - ApplyForUs Platform

**Generated:** 2025-12-15
**Status:** Initial Assessment Complete

---

## 1. API Gateway Implementation

### Location
- **Primary:** `/infrastructure/kubernetes/api-gateway/kong-config.yaml`
- **Deployment:** `/infrastructure/kubernetes/api-gateway/kong-deployment.yaml`
- **Service:** `/infrastructure/kubernetes/api-gateway/kong-service.yaml`

### Configuration
- **Technology:** Kong API Gateway (DB-less mode)
- **Timeouts:**
  - Connect: 60,000ms
  - Read: 60,000ms
  - Write: 60,000ms
- **Retries:** 3 per service
- **Rate Limiting:** AI rate limit plugin at `/infrastructure/kubernetes/api-gateway/kong-ai-rate-limit.yaml`

### Services Routed
| Service | Path | Upstream | Port |
|---------|------|----------|------|
| Web App | / | web-service | 3000 |
| Auth Service | /api/auth | auth-service | 8001 |
| AI Service | /api/ai | ai-service | 5000 |
| Job Service | /api/jobs | job-service | 8003 |
| Resume Service | /api/resumes | resume-service | 8004 |

---

## 2. Rate Limiting Implementation

### Multi-Layer Rate Limiting Architecture

#### Layer 1: Kong Gateway (Global)
- **File:** `/infrastructure/kubernetes/api-gateway/kong-ai-rate-limit.yaml`
- **Plugin:** rate-limiting
- **Storage:** Redis or local memory

#### Layer 2: Tenant Rate Limiting (User Service)
- **File:** `/services/user-service/src/modules/tenant/middleware/rate-limit.middleware.ts`
- **Storage:** In-memory Map (NOT distributed)
- **Behavior:** FAIL-OPEN (allows requests on error)
- **Limits:**
  - Per-minute: Configurable per tenant license
  - Per-hour: Configurable per tenant license
  - Per-day: Configurable per tenant license

#### Layer 3: Platform Rate Limiting (Auto-Apply Service)
- **File:** `/services/auto-apply-service/src/modules/rate-limiter/rate-limiter.service.ts`
- **Storage:** Redis-backed with in-memory fallback
- **Behavior:** FAIL-OPEN
- **Redis Config:**
  - Host: `applyforus-redis.redis.cache.windows.net`
  - Port: 6380
  - TLS: Conditional
  - `maxRetriesPerRequest`: 3
  - `connectTimeout`: 2000ms
  - `enableOfflineQueue`: false (fail-open)

**Platform-Specific Limits:**
| Platform | Per-Hour | Per-Day | Cooldown |
|----------|----------|---------|----------|
| LinkedIn | 10 | 50 | 5 min |
| Indeed | 15 | 75 | 3 min |
| Glassdoor | 12 | 60 | 4 min |
| Workday | 8 | 40 | 6 min |
| Greenhouse | 15 | 80 | 3 min |
| Lever | 15 | 80 | 3 min |

#### Layer 4: Express Rate Limiting (Security Package)
- **File:** `/packages/security/src/rate-limiter.ts`
- **Limiters:**
  - API: 100/15min
  - Auth: 5/hour
  - Strict: 3/hour
  - Uploads: 10/hour
  - Auto-Apply: 50/day

### Redis Usage Summary
- **Operations:** GET, SET, INCR, EXPIRE, DEL, KEYS, TTL
- **Patterns:** Pipeline operations for atomic increments
- **Error Handling:** All rate limiters implement fail-open pattern

---

## 3. Circuit Breaker Configuration

### Orchestrator Service (Opossum-based)
- **File:** `/services/orchestrator-service/src/orchestrator/services/circuit-breaker.service.ts`
- **Configuration:**
  - `timeout`: 60,000ms (increased from 30s)
  - `errorThresholdPercentage`: 50%
  - `resetTimeout`: 30,000ms
  - `volumeThreshold`: 10 requests (increased from 5)
- **States:** CLOSED -> OPEN -> HALF_OPEN -> CLOSED
- **Fallback:** Supported with graceful degradation

### Auto-Apply Service (Custom Implementation)
- **File:** `/services/auto-apply-service/src/modules/engine/service-client.service.ts`
- **Configuration:**
  - `failureThreshold`: 10 failures
  - `successThreshold`: 2 successes in half-open
  - `timeout`: 60,000ms
  - `resetTimeout`: 60,000ms
- **Protected Services:** job-service, user-service, resume-service, ai-service

### Known Issues
1. Inconsistent timeout between orchestrator agent client (30s) and others (60s)
2. Failure threshold is count-based (10) vs percentage-based (50%)
3. No circuit breaker on database operations
4. Health checks lack circuit breaker protection

---

## 4. PostgreSQL Infrastructure

### Terraform Module
- **Location:** `/infrastructure/terraform/modules/postgresql-flexible/`
- **Status:** Configured for PUBLIC access (no VNET)
- **SSL:** Enforced (`require_secure_transport = on`)

### Current Configuration (main.tf lines 201-262)
```hcl
module "postgresql" {
  source = "./modules/postgresql-flexible"

  # PUBLIC ACCESS - No VNET integration
  public_network_access_enabled = true
  allow_azure_services = true

  # Databases per microservice
  database_names = {
    auth_service, user_service, job_service,
    resume_service, notification_service,
    analytics_service, auto_apply_service, payment_service
  }
}
```

### Firewall Rules
- **AllowAzureServices:** 0.0.0.0 - 0.0.0.0 (Azure internal traffic)
- **Additional IPs:** Configurable via `allowed_ip_addresses`

### Connection Security
- **SSL Required:** Yes
- **Version:** PostgreSQL 16
- **Max Connections:** 100 (dev) / 200 (prod)
- **Backup Retention:** 7 days (dev) / 35 days (prod)
- **Geo-Redundant Backup:** Production only

---

## 5. Docker Desktop Dependencies

### Docker Compose Files Found
- `/docker-compose.yml` - Main orchestration
- `/docker-compose.dev.yml` - Development environment
- `/docker-compose.prod.yml` - Production overrides
- `/docker-compose.local.yml` - Local development
- `/docker-compose.test.yml` - Testing environment
- `/docker-compose.monitoring.yml` - Monitoring stack

### Services Currently in Docker Compose
| Service | Image | Port | Azure Equivalent |
|---------|-------|------|------------------|
| postgres | postgres:15 | 5432 | Azure PostgreSQL Flexible |
| redis | redis:7-alpine | 6379 | Azure Cache for Redis |
| rabbitmq | rabbitmq:3-management | 5672,15672 | Azure Service Bus |
| elasticsearch | elasticsearch:8.10.0 | 9200 | Azure Cognitive Search |
| mailhog | mailhog:latest | 1025,8025 | SendGrid/Azure Email |

### localhost References Found
- Service configs default to localhost for development
- Environment files have localhost fallbacks
- TypeORM configs have localhost defaults

### Migration Status
- **Terraform:** Infrastructure ready for Azure
- **Kubernetes:** Manifests ready for AKS deployment
- **CI/CD:** GitHub Actions workflows exist
- **Secrets:** Key Vault integration configured

---

## 6. Authentication & User Data

### Auth Service Location
- `/services/auth-service/`

### User Entity
- **File:** `/services/auth-service/src/modules/users/entities/user.entity.ts`
- **Database:** `auth_service_db` in PostgreSQL

### Authentication Flows
- JWT-based authentication
- Refresh token support
- Session management
- Password hashing with bcrypt

### TypeORM Configuration
- **File:** `/services/auth-service/src/config/typeorm.config.ts`
- **Migrations:** `/services/auth-service/src/migrations/`
- **Connection:** Environment-driven (supports Azure PostgreSQL)

### Database Connection
```typescript
// From typeorm.config.ts
{
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'auth_service_db',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
}
```

---

## 7. Current Issues Identified

### Critical
1. **Tenant rate limiter uses in-memory storage** - Not suitable for multi-instance deployments
2. **Timeout misalignment** - Agent client has 30s vs service 60s timeout
3. **No global application rate limit** - Users can bypass by spreading across platforms

### High
1. **Rate limiter fail-open allows all traffic** when Redis down
2. **Human-behavior rate limiter stores 7 days in memory** - Memory leak risk
3. **No Redis Sentinel/Cluster support** for HA
4. **Missing database circuit breaker**

### Medium
1. **Inconsistent retry strategies** across layers
2. **Health check storms** possible during outages
3. **Fire-and-forget usage tracking** may miss counts

---

## 8. Recommended Actions

### Immediate (Phase 3)
1. Add distributed rate limiting with Redis
2. Implement rate limit degraded metrics
3. Fix timeout alignment across all services
4. Add circuit breaker to database operations

### Infrastructure (Phase 4-5)
1. Verify Postgres public access configuration
2. Ensure all services use Azure endpoints
3. Remove Docker Desktop production dependencies
4. Update environment configurations

### Validation (Phase 6-9)
1. Test auth flows against cloud database
2. Verify all migrations run in production
3. Load test rate limiting behavior
4. Confirm no gateway timeouts under load

---

## 9. File References

| Component | Primary File | Lines |
|-----------|--------------|-------|
| Kong Gateway | infrastructure/kubernetes/api-gateway/kong-config.yaml | All |
| Tenant Rate Limit | services/user-service/src/modules/tenant/middleware/rate-limit.middleware.ts | 1-179 |
| Platform Rate Limit | services/auto-apply-service/src/modules/rate-limiter/rate-limiter.service.ts | 1-442 |
| Circuit Breaker | services/orchestrator-service/src/orchestrator/services/circuit-breaker.service.ts | 1-208 |
| PostgreSQL Module | infrastructure/terraform/modules/postgresql-flexible/main.tf | 1-219 |
| Auth Service | services/auth-service/src/modules/auth/auth.service.ts | All |
| User Entity | services/auth-service/src/modules/users/entities/user.entity.ts | All |
