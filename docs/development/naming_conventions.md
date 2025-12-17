# ApplyforUs Naming Conventions

This document defines the official naming conventions for the ApplyforUs platform after rebranding from JobPilot.

---

## 1. Brand Name

### Official Brand Name
- **Primary:** ApplyforUs
- **Variations:** Apply for Us (with spaces in marketing copy only)
- **Never use:** JobPilot, Job-Apply-Platform, job-apply-platform

### Capitalization Rules
- **Code/Technical:** `applyforus` (all lowercase)
- **Marketing/UI:** `ApplyforUs` (PascalCase)
- **Constants:** `APPLYFORUS` (all uppercase)
- **Package scopes:** `@applyforus` (all lowercase with @ prefix)

---

## 2. Domain Names

### Primary Domains
- **Production:** `applyforus.com`
- **API:** `api.applyforus.com`
- **Documentation:** `docs.applyforus.com`
- **Status Page:** `status.applyforus.com`
- **Community:** `community.applyforus.com`

### Development Domains
- **Development:** `dev.applyforus.com`
- **Staging:** `staging.applyforus.com`
- **Testing:** `test.applyforus.com`

### Email Domains
- **Support:** `support@applyforus.com`
- **No-Reply:** `noreply@applyforus.com`
- **Operations:** `ops@applyforus.com`
- **Security:** `security@applyforus.com`
- **Development:** `dev@applyforus.com`

---

## 3. Package Naming

### NPM/Yarn Package Names

#### Root Package
```json
{
  "name": "applyforus-platform"
}
```

#### Application Packages (Scoped)
```json
{
  "name": "@applyforus/web",
  "name": "@applyforus/admin",
  "name": "@applyforus/mobile",
  "name": "@applyforus/extension"
}
```

#### Service Packages (Non-scoped)
```json
{
  "name": "applyforus-auth-service",
  "name": "applyforus-user-service",
  "name": "applyforus-job-service",
  "name": "applyforus-resume-service",
  "name": "applyforus-auto-apply-service",
  "name": "applyforus-analytics-service",
  "name": "applyforus-notification-service",
  "name": "applyforus-orchestrator-service",
  "name": "applyforus-ai-service"
}
```

#### Shared Library Packages (Scoped)
```json
{
  "name": "@applyforus/telemetry",
  "name": "@applyforus/logging",
  "name": "@applyforus/security",
  "name": "@applyforus/types",
  "name": "@applyforus/utils",
  "name": "@applyforus/config",
  "name": "@applyforus/ui",
  "name": "@applyforus/feature-flags"
}
```

---

## 4. Docker Naming

### Docker Images

#### Format
```
<registry>/<image-name>:<tag>
```

#### Container Registry
- **Azure ACR:** `applyforusacr.azurecr.io`
- **Docker Hub:** `applyforus` (organization)

#### Image Names (without registry prefix)
```
applyforus/web:latest
applyforus/admin:latest
applyforus/mobile:latest
applyforus/auth-service:latest
applyforus/user-service:latest
applyforus/job-service:latest
applyforus/resume-service:latest
applyforus/auto-apply-service:latest
applyforus/analytics-service:latest
applyforus/notification-service:latest
applyforus/ai-service:latest
applyforus/orchestrator-service:latest
```

#### Full ACR Image Names
```
applyforusacr.azurecr.io/web:v1.0.0
applyforusacr.azurecr.io/auth-service:v1.0.0
```

### Docker Container Names
```
applyforus-web
applyforus-postgres
applyforus-redis
applyforus-elasticsearch
applyforus-rabbitmq
applyforus-pgadmin
applyforus-mailhog
applyforus-prometheus
applyforus-grafana
applyforus-alertmanager
```

### Docker Networks
```
applyforus-network
applyforus-monitoring
```

### Docker Volumes
```
applyforus-postgres-data
applyforus-redis-data
applyforus-elasticsearch-data
applyforus-rabbitmq-data
applyforus-rabbitmq-logs
applyforus-pgadmin-data
applyforus-prometheus-data
applyforus-grafana-data
applyforus-alertmanager-data
```

---

## 5. Kubernetes Naming

### Namespace
```yaml
namespace: applyforus
```

### ConfigMap Names
```yaml
name: applyforus-config
name: applyforus-secrets
```

### Service Account
```yaml
name: applyforus-service-account
```

### Service Names
```yaml
auth-service
user-service
job-service
resume-service
auto-apply-service
analytics-service
notification-service
orchestrator-service
ai-service
web-app
```

### Deployment Names (Same as service names)
```yaml
name: auth-service
name: user-service
# etc.
```

### HPA Names
```yaml
name: auth-service-hpa
name: user-service-hpa
# etc.
```

### Internal Service URLs (Kubernetes DNS)
```
http://auth-service.applyforus.svc.cluster.local:4001
http://user-service.applyforus.svc.cluster.local:4002
http://job-service.applyforus.svc.cluster.local:4003
http://ai-service.applyforus.svc.cluster.local:4004
http://resume-service.applyforus.svc.cluster.local:4005
http://analytics-service.applyforus.svc.cluster.local:4006
http://notification-service.applyforus.svc.cluster.local:4007
http://auto-apply-service.applyforus.svc.cluster.local:4008
```

### Labels
```yaml
app: applyforus-platform
tier: backend
component: authentication
```

---

## 6. Database Naming

### Database Names

#### PostgreSQL
- **Production:** `applyforus`
- **Development:** `applyforus_dev`
- **Testing:** `applyforus_test`
- **Staging:** `applyforus_staging`

#### Database Prefixes for Multi-Tenant
```
applyforus_auth
applyforus_users
applyforus_jobs
applyforus_resumes
applyforus_analytics
```

### Table Naming Convention
- Use snake_case: `user_profiles`, `job_applications`, `resume_templates`
- Prefix with service name if needed: `auth_users`, `job_listings`

### Connection String Format
```
postgresql://user:password@host:5432/applyforus
postgresql://postgres:postgres@localhost:5432/applyforus_dev
```

---

## 7. Environment Variables

### Prefix Convention
```bash
APPLYFORUS_*
```

### Example Environment Variables
```bash
# Application
APPLYFORUS_ENV=production
APPLYFORUS_PORT=3000
APPLYFORUS_LOG_LEVEL=info

# Database
APPLYFORUS_DB_HOST=localhost
APPLYFORUS_DB_PORT=5432
APPLYFORUS_DB_NAME=applyforus
APPLYFORUS_DB_USER=applyforus_user
APPLYFORUS_DB_PASSWORD=secret

# Redis
APPLYFORUS_REDIS_HOST=localhost
APPLYFORUS_REDIS_PORT=6379

# JWT
APPLYFORUS_JWT_SECRET=your-secret-key
APPLYFORUS_JWT_EXPIRES_IN=24h

# API
APPLYFORUS_API_URL=https://api.applyforus.com
APPLYFORUS_API_RATE_LIMIT=100
```

### Service-Specific Variables
```bash
# Auth Service
AUTH_SERVICE_PORT=4001
AUTH_SERVICE_URL=http://localhost:4001

# User Service
USER_SERVICE_PORT=4002
USER_SERVICE_URL=http://localhost:4002
```

---

## 8. Azure Resource Naming

### Resource Group Names
```
applyforus-dev-rg
applyforus-staging-rg
applyforus-prod-rg
applyforus-shared-rg
```

### AKS Cluster Names
```
applyforus-dev-aks
applyforus-staging-aks
applyforus-prod-aks
```

### Azure Container Registry
```
applyforusacr
```

### Storage Account Names (max 24 chars, no hyphens)
```
applyforusstorage
applyforusdevsa
applyforusprodsa
```

### Azure Database Names
```
applyforus-postgres
applyforus-dev-postgres
applyforus-staging-postgres
applyforus-prod-postgres
```

### Redis Cache Names
```
applyforus-redis
applyforus-dev-redis
applyforus-staging-redis
applyforus-prod-redis
```

### Azure OpenAI Service
```
applyforus-openai
applyforus-dev-openai
applyforus-prod-openai
```

### App Service Names
```
applyforus-web
applyforus-api
applyforus-admin
```

---

## 9. CI/CD and DevOps

### Azure DevOps Environment Names
```
applyforus-dev
applyforus-staging
applyforus-prod
applyforus-destroy
```

### GitHub Environments
```
development
staging
production
```

### Branch Naming
```
main
develop
feature/feature-name
bugfix/bug-description
hotfix/critical-fix
release/v1.0.0
```

### Tag Naming
```
v1.0.0
v1.0.1
v2.0.0-beta
```

---

## 10. CSS/SCSS Class Prefix

### CSS Class Prefix
```css
.afu-button { }
.afu-card { }
.afu-modal { }
.afu-input { }
.afu-navbar { }
```

### Component Classes (BEM Convention)
```css
.afu-button { }
.afu-button--primary { }
.afu-button--secondary { }
.afu-button__icon { }

.afu-card { }
.afu-card--elevated { }
.afu-card__header { }
.afu-card__body { }
.afu-card__footer { }
```

---

## 11. JavaScript/TypeScript Naming

### Namespace (if used)
```typescript
namespace ApplyforUs {
  // code
}
```

### Module Names
```typescript
// File: applyforus-utils.ts
export const ApplyforUsUtils = {
  // utilities
};
```

### Constants
```typescript
export const APPLYFORUS_API_VERSION = '1.0.0';
export const APPLYFORUS_MAX_RETRIES = 3;
```

### Component Names (React)
```typescript
// PascalCase for components
export const ApplyButton = () => { };
export const JobCard = () => { };
export const ResumeBuilder = () => { };
```

---

## 12. API Endpoints

### Base URL Structure
```
https://api.applyforus.com/v1
```

### Endpoint Patterns
```
GET    /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/users/:id
POST   /api/v1/resumes
GET    /api/v1/jobs/search
POST   /api/v1/applications
GET    /api/v1/analytics/dashboard
```

---

## 13. Monitoring and Logging

### Prometheus Metrics Prefix
```
applyforus_http_requests_total
applyforus_http_request_duration_seconds
applyforus_database_connections
applyforus_job_applications_total
```

### Log Format (Structured Logging)
```json
{
  "service": "applyforus-auth-service",
  "level": "info",
  "message": "User logged in",
  "userId": "123",
  "timestamp": "2025-12-08T10:30:00Z"
}
```

### Alert Names
```
ApplyforUsHighErrorRate
ApplyforUsDatabaseDown
ApplyforUsHighLatency
ApplyforUsLowDiskSpace
```

---

## 14. File and Directory Naming

### Directory Structure
```
applyforus-platform/
├── apps/
│   ├── web/
│   ├── admin/
│   ├── mobile/
│   └── extension/
├── services/
│   ├── auth-service/
│   ├── user-service/
│   ├── job-service/
│   └── ...
├── packages/
│   ├── telemetry/
│   ├── logging/
│   └── ...
└── infrastructure/
```

### File Naming Conventions
- **Components:** `PascalCase.tsx` (e.g., `JobCard.tsx`)
- **Utilities:** `camelCase.ts` (e.g., `formatDate.ts`)
- **Constants:** `UPPER_SNAKE_CASE.ts` (e.g., `API_CONSTANTS.ts`)
- **Config:** `kebab-case.json` (e.g., `docker-compose.yml`)
- **Tests:** `*.test.ts` or `*.spec.ts`

---

## 15. Git Repository Naming

### Main Repository
```
ApplyforUs-Platform
```

### Related Repositories (if split)
```
ApplyforUs-Web
ApplyforUs-Mobile
ApplyforUs-API
ApplyforUs-Infrastructure
ApplyforUs-Docs
```

---

## 16. Documentation Naming

### API Documentation
```
ApplyforUs-API.postman_collection.json
ApplyforUs-OpenAPI-Spec.yaml
```

### Architecture Diagrams
```
ApplyforUs-Architecture-Diagram.png
ApplyforUs-Microservices-Overview.pdf
```

### README Files
```
README.md (main)
AUTH_SERVICE_README.md
DEPLOYMENT_README.md
```

---

## 17. Test Naming

### Test Suites
```typescript
describe('ApplyforUs Auth Service', () => {
  describe('Login', () => {
    it('should authenticate valid user', () => {
      // test
    });
  });
});
```

### Test Files
```
auth.service.test.ts
user.controller.spec.ts
job.integration.test.ts
e2e.applyforus.test.ts
```

---

## 18. Secret and Configuration Keys

### Secret Names (Azure Key Vault)
```
applyforus-db-password
applyforus-jwt-secret
applyforus-api-key-openai
applyforus-sendgrid-api-key
```

### Config Keys
```
applyforus.database.host
applyforus.redis.url
applyforus.jwt.expiresIn
```

---

## 19. Team and Organization

### Team Name
- **Official:** ApplyforUs Team
- **Email:** team@applyforus.com

### GitHub Organization
- **Organization:** `@applyforus`
- **Teams:** `@applyforus/backend`, `@applyforus/frontend`, `@applyforus/devops`

---

## 20. Slack/Discord Channels

### Slack Channels
```
#applyforus-general
#applyforus-backend
#applyforus-frontend
#applyforus-devops
#applyforus-alerts
#applyforus-deployments
```

### Discord Server
```
ApplyforUs Community
```

---

## Quick Reference Table

| Context | Old Name | New Name |
|---------|----------|----------|
| Brand | JobPilot | ApplyforUs |
| Domain | jobpilot.ai | applyforus.com |
| Package Scope | @jobpilot | @applyforus |
| Docker Org | jobpilot | applyforus |
| Kubernetes Namespace | jobpilot | applyforus |
| Database | jobpilot | applyforus |
| Env Var Prefix | JOBPILOT_ | APPLYFORUS_ |
| CSS Prefix | jp- | afu- |
| Azure RG | jobpilot-*-rg | applyforus-*-rg |
| Git Repo | Job-Apply-Platform | ApplyforUs-Platform |

---

## Consistency Checklist

When creating new resources, ensure:
- [ ] All lowercase for technical identifiers
- [ ] Hyphen-separated for multi-word names (kebab-case)
- [ ] `applyforus` prefix for all branded resources
- [ ] Consistent across Docker, Kubernetes, and code
- [ ] Environment-specific suffix where needed (-dev, -staging, -prod)
- [ ] No special characters except hyphens and underscores
- [ ] Maximum length constraints respected (especially Azure resources)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Status:** Official Naming Standard
