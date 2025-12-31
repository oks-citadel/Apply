# ApplyForUs Unified SaaS Platform - Current State Summary

**Generated:** 2025-12-25
**Platform:** ApplyForUs / JobPilot AI
**Domain:** applyforus.com

---

## PLATFORM CONTEXT

```
+-----------------------------------------------------------------------------+
|                        APPLYFORUS PLATFORM                                   |
+-----------------------------------------------------------------------------+
|  Type:              Multi-tenant SaaS Platform (Job Application Automation) |
|  Users:             Job Seekers (Consumers, NOT enterprise employees)       |
|  Auth Protocols:    OAuth 2.0 + JWT (Google, LinkedIn, GitHub, Email)       |
|  Authorization:     Server-side, Subscription Tier + Role-based             |
|  Subscription Tiers: FREEMIUM, STARTER, BASIC, PRO, ADVANCED, EXECUTIVE     |
|  Architecture:      API-first Microservices (NestJS)                        |
|  Backend:           AKS with PostgreSQL, Redis, CosmosDB                    |
|  Edge:              Azure Front Door with WAF                               |
|  DNS:               Azure DNS                                               |
+-----------------------------------------------------------------------------+
```

---

## TEMPLATE VARIABLES

| Variable | Current Value |
|----------|---------------|
| `PLATFORM_NAME` | `applyforus` |
| `PLATFORM_DISPLAY_NAME` | `ApplyForUs` |
| `DOMAIN` | `applyforus.com` |
| `ENVIRONMENT` | `dev` (also: staging, prod) |
| `LOCATION` | `westus2` |
| `B2C_TENANT` | TBD - needs configuration |
| `REGISTRAR` | Managed via Azure DNS |
| `OWNER_EMAIL` | citadelcloudmanagement@gmail.com |
| `COST_CENTER` | Engineering |

---

## EXISTING INFRASTRUCTURE

### Terraform Modules (22 modules)

| Module | Status | Path |
|--------|--------|------|
| AKS | Exists | `modules/aks/` |
| App Insights | Exists | `modules/app-insights/` |
| Application Gateway | Exists | `modules/application-gateway/` |
| App Service Plan | Exists | `modules/app-service-plan/` |
| App Services | Exists | `modules/app-services/` |
| Container Registry | Exists | `modules/container-registry/` |
| CosmosDB | Exists | `modules/cosmosdb/` |
| Dashboards | Exists | `modules/dashboards/` |
| DNS | Exists | `modules/dns/` |
| Front Door | Exists | `modules/front-door/` |
| Key Vault | Exists | `modules/key-vault/` |
| Key Vault Secrets | Exists | `modules/key-vault-secrets/` |
| Managed Identity | Exists | `modules/managed-identity/` |
| Monitoring | Exists | `modules/monitoring/` |
| Networking | Exists | `modules/networking/` |
| PostgreSQL Flexible | Exists | `modules/postgresql-flexible/` |
| Private Endpoints | Exists | `modules/private-endpoints/` |
| Redis Cache | Exists | `modules/redis-cache/` |
| Service Bus | Exists | `modules/service-bus/` |
| SQL Database | Exists | `modules/sql-database/` |
| **Identity (B2C)** | **MISSING** | `modules/identity/` |

### Kubernetes Configuration

| Component | Status | Path |
|-----------|--------|------|
| Network Policies | Exists | `kubernetes/network-policies/` |
| RBAC | Exists | `kubernetes/rbac/` |
| Pod Security | Exists | `kubernetes/pod-security/` |
| Service Deployments | Exists | `kubernetes/production/` |
| Secrets Management | Exists | `kubernetes/secrets/` |

### Helm Charts

| Chart | Status | Path |
|-------|--------|------|
| App | Exists | `helm/app/` |
| Ingress NGINX | Exists | `helm/ingress-nginx/` |
| PostgreSQL | Exists | `helm/postgresql/` |
| Redis | Exists | `helm/redis/` |

---

## MICROSERVICES ARCHITECTURE

### Backend Services (11 services)

| Service | Port | Purpose |
|---------|------|---------|
| ai-service | 8010 | AI/ML processing, resume analysis |
| analytics-service | 8007 | User analytics, SLA tracking |
| api-gateway | 8000 | API routing, rate limiting |
| auth-service | 8001 | Authentication, JWT, OAuth |
| auto-apply-service | 8006 | Automated job applications |
| job-service | 8003 | Job listings, search, alerts |
| notification-service | 8005 | Email, push notifications |
| orchestrator-service | 8008 | Workflow orchestration |
| payment-service | 8009 | Subscriptions, payments |
| resume-service | 8004 | Resume parsing, generation |
| user-service | 8002 | User profiles, preferences |

### Frontend Apps (5 apps)

| App | Technology | Purpose |
|-----|------------|---------|
| admin | Next.js | Admin dashboard |
| employer | Next.js | Employer portal |
| extension | Browser Extension | Chrome/Firefox extension |
| mobile | React Native | iOS/Android app |
| web | Next.js | Main consumer app |

---

## EXISTING SUBSCRIPTION MODEL

### 6-Tier Subscription Model

| Tier | Monthly | Yearly | Status |
|------|---------|--------|--------|
| FREEMIUM | $0 | $0 | Default |
| STARTER | $23.99 | $239.99 | Active |
| BASIC | $49.99 | $499.99 | Active |
| PROFESSIONAL | $89.99 | $899.99 | Popular |
| ADVANCED_CAREER | $149.99 | $1,499.99 | Active |
| EXECUTIVE_ELITE | $299.99 | $2,999.99 | Premium |

### Tier Features Matrix

| Feature | FREE | STARTER | BASIC | PRO | ADV | EXEC |
|---------|------|---------|-------|-----|-----|------|
| Job Apps/Month | 5 | 30 | 75 | 200 | 500 | Unlimited |
| AI Cover Letters | 2 | 15 | 40 | 100 | 300 | Unlimited |
| Resume Templates | 2 | 5 | 10 | Unlimited | Unlimited | Unlimited |
| Auto-Apply | No | No | Yes | Yes | Yes | Yes |
| Priority Support | No | No | No | Yes | Yes | Yes |
| API Access | No | No | No | No | Yes | Yes |
| Dedicated Manager | No | No | No | No | No | Yes |

---

## EXISTING AUTHORIZATION

### User Roles

```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}
```

### Authorization Guards (17 guards)

| Guard | Location | Purpose |
|-------|----------|---------|
| SubscriptionGuard | `packages/security/` | Tier-based access |
| FeatureFlagGuard | `packages/feature-flags/` | Feature gating |
| JwtAuthGuard | `services/auth-service/` | JWT validation |
| RolesGuard | `services/auth-service/` | Role-based access |
| LocalAuthGuard | `services/auth-service/` | Local login |
| RateLimitGuard | `services/api-gateway/` | Rate limiting |
| AdminGuard | `services/job-service/` | Admin access |
| ApiKeyGuard | `services/payment-service/` | API key auth |
| TenantLicenseGuard | `services/user-service/` | Tenant licensing |
| ServiceAuthGuard | `packages/security/` | Service-to-service |

---

## GAPS IDENTIFIED

### Missing Components for Unified SaaS Platform

1. **Identity Module (Terraform)**
   - Entra ID B2C tenant configuration
   - App registrations (web, api, automation)
   - Security groups for subscription tiers
   - Graph API permissions

2. **B2C Group-Based Authorization**
   - Group claims in tokens
   - Group membership sync
   - Suspended user group

3. **Self-Healing Automation**
   - Comprehensive validation script
   - DNS/TLS/HTTPS checks
   - Identity state validation
   - Automated reconciliation

4. **Production Readiness Checklist**
   - Unified checklist document
   - Pre-deployment validation
   - Sign-off workflow

---

## RECOMMENDED ACTIONS

### Phase 1: Identity Foundation
1. Create `modules/identity/` Terraform module
2. Configure B2C tenant variables
3. Add security groups for tiers
4. Set up automation app registration

### Phase 2: Authorization Enhancement
1. Add B2C group claims extraction
2. Create group sync service
3. Add suspended user handling
4. Enhance subscription guard with groups

### Phase 3: Self-Healing
1. Create unified validation script
2. Add DNS/TLS monitoring
3. Implement group reconciliation
4. Set up automated alerts

### Phase 4: Production Readiness
1. Generate unified checklist
2. Document rollback procedures
3. Create disaster recovery plan
4. Complete security audit

---

## FILE STRUCTURE FOR NEW COMPONENTS

```
infrastructure/
├── terraform/
│   └── modules/
│       └── identity/                    # NEW - Identity Module
│           ├── main.tf
│           ├── variables.tf
│           ├── outputs.tf
│           └── README.md
│
├── identity/                            # NEW - Identity Configuration
│   ├── groups/
│   │   └── security-groups.json
│   ├── automation/
│   │   ├── group-sync.ts
│   │   └── subscription-sync.ts
│   └── README.md
│
scripts/
├── self-healing/
│   ├── validate-infrastructure.sh       # NEW
│   ├── validate-identity.sh             # NEW
│   └── reconcile-groups.ts              # NEW
│
ops/docs/
├── UNIFIED_SAAS_PLATFORM_STATE.md       # THIS FILE
├── PRODUCTION_CHECKLIST.md              # NEW
└── IDENTITY_MODEL.md                    # NEW
```

---

*Document generated by Claude Code for ApplyForUs Platform*
