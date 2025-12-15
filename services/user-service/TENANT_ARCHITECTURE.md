# Multi-Tenant Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ApplyForUs Platform                         │
│                     Multi-Tenant Licensing System                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼────────┐         ┌────────▼────────┐
            │   Enterprise   │         │   University    │
            │    Tenants     │         │    Tenants      │
            └───────┬────────┘         └────────┬────────┘
                    │                           │
        ┌───────────┴───────────┐   ┌───────────┴────────────┐
        │                       │   │                        │
    ┌───▼────┐           ┌─────▼───▼──┐              ┌──────▼──────┐
    │ Starter│           │Professional │              │ Uni Basic / │
    │  $99   │           │    $299     │              │   Uni Pro   │
    └────────┘           └─────────────┘              └─────────────┘
```

## Database Schema

```
┌──────────────────┐
│     Tenants      │
├──────────────────┤
│ id (PK)          │
│ name             │◄─────────┐
│ slug (unique)    │          │
│ type             │          │
│ status           │          │
│ api_key          │          │
│ branding_settings│          │
│ sso_settings     │          │
└──────────────────┘          │
         │                    │
         │ 1                  │
         │                    │
         ├────────────────────┤
         │                    │
         │ N                  │ 1
         │                    │
┌────────▼──────────┐  ┌──────┴─────────┐
│   TenantUsers     │  │ TenantLicense  │
├───────────────────┤  ├────────────────┤
│ id (PK)           │  │ id (PK)        │
│ tenant_id (FK)    │  │ tenant_id (FK) │
│ user_id           │  │ license_type   │
│ role              │  │ status         │
│ department_id     │  │ max_users      │
│ cohort            │  │ features (JSON)│
│ student_id        │  │ rate_limits    │
└───────────────────┘  └────────────────┘
         │
         │ N
         │
         │ 1
         │
┌────────▼──────────────┐
│  TenantDepartments    │
├───────────────────────┤
│ id (PK)               │
│ tenant_id (FK)        │
│ name                  │
│ headcount             │
│ placement_rate        │
└───────────────────────┘


┌────────────────────────┐
│   PlacementTracking    │
├────────────────────────┤
│ id (PK)                │
│ tenant_id (FK)         │
│ user_id                │
│ cohort                 │
│ company_name           │
│ job_title              │
│ salary                 │
│ placement_status       │
│ days_to_placement      │
└────────────────────────┘


┌────────────────────┐
│      Cohorts       │
├────────────────────┤
│ id (PK)            │
│ tenant_id (FK)     │
│ name               │
│ program            │
│ enrolled_count     │
│ placement_rate     │
│ average_salary     │
└────────────────────┘
```

## Request Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. HTTP Request
     │    with JWT Token
     │
┌────▼──────────────────────────┐
│   TenantController            │
│   @UseGuards(JwtAuthGuard)    │
└────┬──────────────────────────┘
     │
     │ 2. Authentication Check
     │
┌────▼──────────────────────────┐
│   TenantIsolationMiddleware   │
│   - Verify tenant exists      │
│   - Check tenant status       │
│   - Validate user access      │
└────┬──────────────────────────┘
     │
     │ 3. Rate Limit Check
     │
┌────▼──────────────────────────┐
│   TenantRateLimitMiddleware   │
│   - Check per-minute limit    │
│   - Check per-hour limit      │
│   - Check per-day limit       │
│   - Increment counter         │
└────┬──────────────────────────┘
     │
     │ 4. License Enforcement
     │
┌────▼──────────────────────────┐
│   TenantLicenseGuard          │
│   - Verify license active     │
│   - Check feature access      │
│   - Validate usage limits     │
│   - Check trial expiration    │
└────┬──────────────────────────┘
     │
     │ 5. Business Logic
     │
┌────▼──────────────────────────┐
│   TenantService               │
│   - Execute operation         │
│   - Apply tenant isolation    │
│   - Update metrics            │
│   - Track usage               │
└────┬──────────────────────────┘
     │
     │ 6. Database Query
     │
┌────▼──────────────────────────┐
│   PostgreSQL Database         │
│   - Scoped by tenant_id       │
│   - Foreign key constraints   │
│   - Indexed queries           │
└────┬──────────────────────────┘
     │
     │ 7. Response
     │
┌────▼──────────────────────────┐
│   JSON Response               │
│   - Success/Error             │
│   - Data payload              │
│   - Rate limit headers        │
└───────────────────────────────┘
```

## Feature Access Control

```
┌─────────────────────────────────────────────────────────┐
│                    License Type                         │
└─────────────┬───────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────────┐    ┌─────▼────────┐
│ Enterprise │    │  University  │
└───┬────────┘    └─────┬────────┘
    │                   │
    │                   │
┌───▼──────────────────┐│
│   Feature Flags      ││
├──────────────────────┤│
│ bulkImport: true     ││
│ analytics: true      ││
│ whiteLabel: ?        ││
│ sso: ?               ││
│ apiAccess: ?         ││
└──────────────────────┘│
                        │
        ┌───────────────▼────────────────┐
        │   TenantLicenseGuard           │
        │                                │
        │   if (!hasFeature(feature)) {  │
        │     throw ForbiddenException   │
        │   }                            │
        └────────────────────────────────┘
```

## Analytics Flow

```
┌─────────────────────────────────────────────┐
│  GET /api/v1/tenants/:id/analytics          │
│  ?type=placement&time_range=month           │
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼─────────┐
        │ TenantService  │
        │ .getAnalytics()│
        └──────┬─────────┘
               │
   ┌───────────┴────────────────┐
   │                            │
┌──▼──────────────┐   ┌─────────▼────────────┐
│ Placement       │   │ User Activity        │
│ Analytics       │   │ Analytics            │
└──┬──────────────┘   └─────────┬────────────┘
   │                            │
   │ Query placement_tracking   │ Query tenant_users
   │ WHERE tenant_id = :id      │ WHERE tenant_id = :id
   │   AND placement_date       │   AND created_at
   │       BETWEEN :start, :end │       BETWEEN :start, :end
   │                            │
   └────────────┬───────────────┘
                │
        ┌───────▼──────────┐
        │ Aggregate Data   │
        │ - Count totals   │
        │ - Calculate %    │
        │ - Group by field │
        │ - Sort results   │
        └───────┬──────────┘
                │
        ┌───────▼──────────┐
        │ Return JSON      │
        │ {                │
        │   summary: {},   │
        │   byIndustry: {},│
        │   placements: [] │
        │ }                │
        └──────────────────┘
```

## Export Flow

```
┌─────────────────────────────────────────────┐
│  GET /api/v1/tenants/:id/analytics/export/csv│
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼─────────┐
        │ TenantService  │
        │ .getAnalytics()│
        └──────┬─────────┘
               │
        ┌──────▼──────────┐
        │   ExportUtil    │
        │ .convertToCSV() │
        └──────┬──────────┘
               │
        ┌──────▼───────────────┐
        │ Generate CSV         │
        │ - Create headers     │
        │ - Escape values      │
        │ - Format dates       │
        │ - Join with commas   │
        └──────┬───────────────┘
               │
        ┌──────▼──────────┐
        │ Set Headers     │
        │ Content-Type:   │
        │   text/csv      │
        │ Content-        │
        │   Disposition   │
        └──────┬──────────┘
               │
        ┌──────▼──────────┐
        │ Stream CSV File │
        │ to Client       │
        └─────────────────┘
```

## Bulk Import Flow

```
┌─────────────────────────────────────────────┐
│  POST /api/v1/tenants/:id/users/bulk       │
│  { users: [...] }                           │
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼─────────┐
        │ Check License  │
        │ User Limit     │
        └──────┬─────────┘
               │
        ┌──────▼─────────┐
        │ For Each User  │
        └──────┬─────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────────┐   ┌──────▼─────────┐
│ Check        │   │ Create/Find    │
│ Duplicate    │   │ Department     │
└───┬──────────┘   └──────┬─────────┘
    │                     │
    └──────────┬──────────┘
               │
        ┌──────▼──────────┐
        │ Create          │
        │ TenantUser      │
        └──────┬──────────┘
               │
        ┌──────▼──────────┐
        │ Send Invitation │
        │ (optional)      │
        └──────┬──────────┘
               │
        ┌──────▼──────────┐
        │ Update Metrics  │
        │ - User count    │
        │ - Department    │
        └──────┬──────────┘
               │
        ┌──────▼──────────┐
        │ Return Results  │
        │ {               │
        │   success: [],  │
        │   failed: [],   │
        │   skipped: []   │
        │ }               │
        └─────────────────┘
```

## Rate Limiting Strategy

```
┌──────────────────────────────────────┐
│         Incoming Request             │
└─────────────┬────────────────────────┘
              │
       ┌──────▼──────────┐
       │ Get Tenant ID   │
       └──────┬──────────┘
              │
       ┌──────▼──────────────────┐
       │ Get License Rate Limits │
       │ {                       │
       │   perMinute: 60,        │
       │   perHour: 1000,        │
       │   perDay: 10000         │
       │ }                       │
       └──────┬──────────────────┘
              │
   ┌──────────┴──────────┐
   │                     │
┌──▼────────┐     ┌──────▼───────┐
│ Check     │     │ Check        │
│ Per-Min   │     │ Per-Hour     │
└──┬────────┘     └──────┬───────┘
   │                     │
   └──────────┬──────────┘
              │
       ┌──────▼──────────┐
       │ Check Per-Day   │
       └──────┬──────────┘
              │
    ┌─────────┴─────────┐
    │ Limit Exceeded?   │
    └─────┬─────────┬───┘
          │         │
      ┌───▼──┐   ┌──▼────┐
      │ YES  │   │  NO   │
      └───┬──┘   └──┬────┘
          │         │
    ┌─────▼──┐   ┌──▼─────────┐
    │ Return │   │ Increment  │
    │  429   │   │ Counter    │
    └────────┘   └──┬─────────┘
                    │
              ┌─────▼──────┐
              │ Continue   │
              │ Request    │
              └────────────┘
```

## Module Structure

```
TenantModule
├── Controllers
│   └── TenantController
│       ├── Tenant CRUD
│       ├── User Management
│       ├── Department Management
│       ├── Cohort Management
│       ├── Analytics
│       └── Exports
│
├── Services
│   ├── TenantService
│   │   ├── createTenant()
│   │   ├── bulkImportUsers()
│   │   ├── getAnalytics()
│   │   ├── updateBranding()
│   │   └── checkLicenseLimit()
│   │
│   ├── CohortService
│   │   ├── createCohort()
│   │   ├── getCohortStats()
│   │   └── updateMetrics()
│   │
│   └── ExportUtil
│       ├── convertToCSV()
│       ├── convertToPDF()
│       └── parseCSV()
│
├── Guards
│   └── TenantLicenseGuard
│       ├── canActivate()
│       ├── hasFeature()
│       └── checkUsageLimits()
│
├── Middleware
│   ├── TenantIsolationMiddleware
│   │   └── validateAccess()
│   │
│   └── TenantRateLimitMiddleware
│       ├── checkRateLimit()
│       └── incrementUsage()
│
└── Entities
    ├── Tenant
    ├── TenantUser
    ├── TenantLicense
    ├── TenantDepartment
    ├── PlacementTracking
    └── Cohort
```

## Security Layers

```
┌──────────────────────────────────────────┐
│           Security Layers                │
└──────────────────────────────────────────┘

    Layer 1: Authentication
    ┌────────────────────────┐
    │ JWT Token Validation   │
    └────────┬───────────────┘
             │
    Layer 2: Tenant Isolation
    ┌────────▼───────────────┐
    │ Middleware validates   │
    │ user access to tenant  │
    └────────┬───────────────┘
             │
    Layer 3: Rate Limiting
    ┌────────▼───────────────┐
    │ Per-tenant API limits  │
    └────────┬───────────────┘
             │
    Layer 4: License Check
    ┌────────▼───────────────┐
    │ Feature & usage limits │
    └────────┬───────────────┘
             │
    Layer 5: Data Access
    ┌────────▼───────────────┐
    │ tenant_id scoped query │
    └────────┬───────────────┘
             │
    Layer 6: Database
    ┌────────▼───────────────┐
    │ Foreign key constraints│
    │ Row-level isolation    │
    └────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Load Balancer                      │
└─────────────┬───────────────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────▼──────┐   ┌─────▼──────┐
│ Instance 1 │   │ Instance 2 │
│ NestJS App │   │ NestJS App │
└─────┬──────┘   └─────┬──────┘
      │                │
      └───────┬────────┘
              │
      ┌───────▼────────┐
      │   PostgreSQL   │
      │   (Primary)    │
      └───────┬────────┘
              │
      ┌───────▼────────┐
      │   PostgreSQL   │
      │   (Replica)    │
      └────────────────┘

      ┌────────────────┐
      │     Redis      │
      │ (Rate Limits)  │
      └────────────────┘
```

This architecture provides:
- Scalable multi-tenant infrastructure
- Comprehensive feature isolation
- Granular access control
- Usage tracking and enforcement
- Analytics and reporting
- Data export capabilities
