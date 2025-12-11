# ApplyForUs Platform Discovery Report

**Generated**: 2025-12-10
**Version**: 1.0.0

## Executive Summary

ApplyForUs (JobPilot AI) is a comprehensive job application automation platform consisting of:
- **11 Backend Services** (10 NestJS + 1 FastAPI)
- **5 Frontend Applications** (Next.js, React Native, Chrome Extension)
- **3 Payment Providers** (Stripe, Flutterwave, Paystack)
- **Azure-based Infrastructure** (AKS, ACR, SQL, Redis, Service Bus)

---

## 1. SERVICE ARCHITECTURE

### 1.1 Backend Services (11 total)

| Service | Tech Stack | Port | Purpose |
|---------|-----------|------|---------|
| **auth-service** | NestJS/TypeScript | 8001 | Authentication, OAuth, JWT, 2FA |
| **user-service** | NestJS/TypeScript | 8002 | User profiles, preferences, skills |
| **job-service** | NestJS/TypeScript | 8003 | Job listings, search, alerts, companies |
| **resume-service** | NestJS/TypeScript | 8004 | Resume builder, templates, versions |
| **notification-service** | NestJS/TypeScript | 8005 | Email, push, SMS notifications |
| **auto-apply-service** | NestJS/TypeScript | 8006 | Browser automation (Playwright) |
| **analytics-service** | NestJS/TypeScript | 8007 | Usage tracking, analytics events |
| **ai-service** | FastAPI/Python | 8008 | OpenAI, Anthropic, Pinecone RAG |
| **orchestrator-service** | NestJS/TypeScript | 8010 | Multi-agent coordination |
| **payment-service** | NestJS/TypeScript | 8009 | Subscriptions, billing, invoices |
| **shared** | TypeScript | N/A | Database utils, interceptors, middleware |

### 1.2 Frontend Applications (5 total)

| App | Tech Stack | Purpose |
|-----|-----------|---------|
| **web** | Next.js 14 / React 18 | Main job seeker portal |
| **admin** | Next.js | Admin dashboard |
| **employer** | Next.js | Employer portal |
| **mobile** | React Native | iOS/Android app |
| **extension** | Chrome Extension | Browser job scraping |

### 1.3 Shared Workspace Packages

- `@jobpilot/telemetry` - OpenTelemetry integration
- `@jobpilot/logging` - Structured logging
- `@jobpilot/security` - Auth guards and utilities

---

## 2. CURRENT SUBSCRIPTION SYSTEM

### 2.1 Existing 6-Tier Model

```typescript
enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}
```

### 2.2 Current Pricing

| Tier | Monthly | Yearly |
|------|---------|--------|
| FREE | $0 | $0 |
| STARTER | $4.99 | $49.99 |
| BASIC | $9.99 | $99.99 |
| PRO | $29.99 | $299.99 |
| BUSINESS | $59.99 | $599.99 |
| ENTERPRISE | $149.99 | $1,499.99 |

### 2.3 Current Feature Limits

| Feature | FREE | STARTER | BASIC | PRO | BUSINESS | ENTERPRISE |
|---------|------|---------|-------|-----|----------|------------|
| Job Apps/Month | 10 | 25 | 50 | 200 | 500 | Unlimited |
| AI Cover Letters | 3 | 10 | 25 | 100 | 300 | Unlimited |
| Resume Templates | 2 | 5 | 10 | Unlimited | Unlimited | Unlimited |
| Saved Jobs | 20 | 50 | 100 | 500 | Unlimited | Unlimited |
| Virtual Coins/Month | 50 | 200 | 500 | 1,500 | 5,000 | Unlimited |
| Boost Visibility Slots | 0 | 1 | 3 | 10 | 25 | Unlimited |
| Email Alerts | No | Yes | Yes | Yes | Yes | Yes |
| Priority Support | No | No | No | Yes | Yes | Yes |
| Advanced Analytics | No | No | No | Yes | Yes | Yes |
| Custom Branding | No | No | No | No | Yes | Yes |
| Auto-Apply | No | No | Yes | Yes | Yes | Yes |
| Interview Prep | No | No | No | Yes | Yes | Yes |
| Salary Insights | No | No | Yes | Yes | Yes | Yes |
| Company Insights | No | No | No | Yes | Yes | Yes |
| Account Manager | No | No | No | No | No | Yes |
| API Access | No | No | No | No | Yes | Yes |

### 2.4 Virtual Coin Packages

| Coins | Price | Bonus |
|-------|-------|-------|
| 100 | $0.99 | 0 |
| 500 | $4.49 | 50 |
| 1,000 | $7.99 | 150 |
| 2,500 | $17.99 | 500 |
| 5,000 | $32.99 | 1,250 |
| 10,000 | $59.99 | 3,000 |

### 2.5 Boost Visibility Options

| Type | Coins | Duration |
|------|-------|----------|
| Basic | 50 | 24 hours |
| Premium | 150 | 72 hours |
| Featured | 300 | 7 days |

---

## 3. PAYMENT PROVIDERS

### 3.1 Stripe (Primary)
- Full subscription management
- Checkout sessions
- Billing portal
- Webhook handlers (30+ events)
- Currencies: USD, EUR, GBP, CAD, AUD

### 3.2 Flutterwave (African Markets)
- Currencies: NGN, USD, GHS, KES, ZAR, UGX, TZS, XOF, XAF
- One-time and recurring payments

### 3.3 Paystack (Nigerian/Ghanaian Markets)
- Currencies: NGN, GHS, ZAR, USD
- Focus on local payment methods

---

## 4. DATA STORES

### 4.1 PostgreSQL (Primary Database)
Each service has its own schema with TypeORM entities:

**auth-service:**
- users, user_tokens, oauth_connections

**user-service:**
- profiles, work_experiences, education, skills, certifications, preferences, subscriptions

**job-service:**
- jobs, companies, company_reviews, saved_jobs, job_alerts, reports

**resume-service:**
- resumes, resume_versions, templates, sections

**notification-service:**
- notifications, notification_preferences, device_tokens

**auto-apply-service:**
- applications, auto_apply_settings, answer_library, form_mappings

**analytics-service:**
- analytics_events

**payment-service:**
- subscriptions, invoices

### 4.2 Redis
- Session storage
- Caching layer
- Rate limiting
- Job queues

### 4.3 Elasticsearch
- Job search indexing
- Full-text search

### 4.4 RabbitMQ
- Event-driven messaging
- Queue: `payment_events`
- Queue: `subscription_events`

### 4.5 Pinecone (Vector DB)
- AI embeddings
- Semantic search

---

## 5. INFRASTRUCTURE

### 5.1 Azure Resources

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | `applyforus-prod-rg` | Container for all resources |
| AKS Cluster | `applyforus-aks` | Kubernetes orchestration |
| Container Registry | `applyforusacr.azurecr.io` | Docker images |
| Key Vault | TBD | Secrets management |
| SQL Server | TBD | PostgreSQL databases |
| Redis Cache | TBD | Caching/sessions |
| Service Bus | TBD | Message queuing |
| Application Insights | TBD | Monitoring |

### 5.2 Terraform Modules

```
infrastructure/terraform/modules/
├── networking/          # VNet, subnets, NSGs
├── managed-identity/    # MSI for services
├── container-registry/  # ACR
├── key-vault/          # Secrets
├── app-insights/       # Monitoring
├── sql-database/       # PostgreSQL
├── redis/              # Caching
├── service-bus/        # Messaging
├── aks/                # Kubernetes
└── app-gateway/        # WAF/Load balancing
```

### 5.3 Kubernetes Namespace

- Namespace: `applyforus`
- Deployments: 11 services
- Services: ClusterIP for inter-service
- Ingress: NGINX Ingress Controller
- Cert-Manager: Let's Encrypt TLS

---

## 6. CI/CD PIPELINES

### 6.1 GitHub Actions (Primary)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `cd-dev.yml` | Push to develop | Deploy to dev AKS |
| `cd-staging.yml` | Push to main | Deploy to staging |
| `cd-prod.yml` | Version tags | Deploy to production |
| `terraform-plan.yml` | PR | Terraform plan |
| `terraform-apply.yml` | Main merge | Terraform apply |
| `security-scan.yml` | Schedule | SAST/SCA/Container scans |

### 6.2 Image Naming Convention

```
applyforusacr.azurecr.io/applyai-{service}:{tag}
```

Examples:
- `applyforusacr.azurecr.io/applyai-web:1.0.100-abc12345`
- `applyforusacr.azurecr.io/applyai-auth-service:dev-latest`

---

## 7. API ENDPOINTS SUMMARY

### 7.1 Auth Service (8001)
- POST /auth/login
- POST /auth/register
- POST /auth/refresh
- POST /auth/logout
- GET /auth/oauth/{provider}
- POST /auth/2fa/enable
- POST /auth/2fa/verify

### 7.2 User Service (8002)
- GET/PUT /users/:id/profile
- GET/PUT /users/:id/preferences
- GET/POST /users/:id/work-experience
- GET/POST /users/:id/education
- GET/POST /users/:id/skills

### 7.3 Job Service (8003)
- GET /jobs (search)
- GET /jobs/:id
- GET/POST /jobs/saved
- GET/POST /jobs/alerts
- GET /companies/:id
- GET /companies/:id/reviews

### 7.4 Resume Service (8004)
- GET/POST /resumes
- GET/PUT /resumes/:id
- GET /resumes/:id/versions
- GET /templates
- POST /resumes/:id/export

### 7.5 Notification Service (8005)
- GET /notifications
- POST /notifications/mark-read
- GET/PUT /notifications/preferences
- POST /notifications/push/register

### 7.6 Auto-Apply Service (8006)
- POST /applications/auto-apply
- GET /applications/history
- GET/PUT /applications/settings
- GET/POST /answer-library

### 7.7 Analytics Service (8007)
- POST /analytics/events
- GET /analytics/dashboard
- GET /analytics/reports

### 7.8 AI Service (8008)
- POST /ai/generate-cover-letter
- POST /ai/optimize-resume
- POST /ai/interview-prep
- POST /ai/salary-insights

### 7.9 Orchestrator Service (8010)
- POST /orchestrate/apply-job
- GET /orchestrate/status/:taskId
- POST /orchestrate/batch-apply

### 7.10 Payment Service (8009)
- POST /subscriptions
- GET /subscriptions/user/:userId
- POST /subscriptions/checkout-session
- POST /stripe/webhook
- GET/POST /invoices
- POST /coins/purchase
- POST /coins/boost-visibility

---

## 8. PROPOSED 6-TIER REBRAND

### 8.1 New Tier Names & Pricing

| Tier | Old Name | New Name | Monthly | Yearly |
|------|----------|----------|---------|--------|
| 1 | FREE | **Freemium** | $0 | $0 |
| 2 | STARTER | **Starter** | $23.99 | $239.99 |
| 3 | BASIC | **Basic** | $49.99 | $499.99 |
| 4 | PRO | **Professional** | $89.99 | $899.99 |
| 5 | BUSINESS | **Advanced Career** | $149.99 | $1,499.99 |
| 6 | ENTERPRISE | **Executive Elite** | $299.99 | $2,999.99 |

### 8.2 Files to Update for Rebrand

1. `services/payment-service/src/common/enums/subscription-tier.enum.ts`
2. `services/payment-service/src/modules/subscriptions/`
3. `apps/web/src/` (pricing page, subscription components)
4. Database migrations for tier enum changes
5. Stripe product/price IDs update
6. API documentation

---

## 9. NEXT STEPS

1. **End-to-End Testing** - Create test matrix for all user journeys
2. **Infrastructure Unification** - Consolidate under single Azure subscription
3. **Autoscaling Design** - HPA, VPA, cluster autoscaler rules
4. **Failover Strategy** - Multi-region AKS, database geo-replication
5. **Cost Optimization** - Right-sizing, reserved instances, spot nodes
6. **Subscription Rebrand** - Update all 6 tier names/prices
7. **Docker Build Fixes** - Resolve GitHub Actions build failures
8. **Observability** - Complete monitoring, alerting, dashboards

---

## 10. APPENDIX

### A. Environment Variables per Service

See individual service `.env.example` files for complete list.

### B. Workspace Dependencies

```json
{
  "@jobpilot/telemetry": "workspace:*",
  "@jobpilot/logging": "workspace:*",
  "@jobpilot/security": "workspace:*"
}
```

### C. Docker Image Tags

- `dev-latest` - Latest development build
- `staging-latest` - Latest staging build
- `x.y.z` - Production semantic version
- `x.y.z-sha12345` - Specific commit

---

*Document maintained as part of the ApplyForUs platform documentation.*
