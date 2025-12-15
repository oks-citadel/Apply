# Multi-Tenant Enterprise & University Licensing System

## Overview

This document describes the comprehensive multi-tenant licensing system built for the ApplyForUs platform, supporting both enterprise and university/bootcamp customers with advanced features including SSO, white-labeling, API access, and placement tracking.

## Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [License Types](#license-types)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [Security](#security)

## Architecture

The multi-tenant system is built as a module within the `user-service` and consists of:

### Core Components

1. **Entities**
   - `Tenant` - Organization/tenant management
   - `TenantUser` - User-tenant associations
   - `TenantLicense` - License and feature management
   - `TenantDepartment` - Department grouping
   - `PlacementTracking` - Graduate placement tracking
   - `Cohort` - Student cohort management

2. **Services**
   - `TenantService` - Main business logic for tenant operations
   - `CohortService` - Cohort and student management
   - `ExportUtil` - CSV/PDF export utilities

3. **Guards & Middleware**
   - `TenantLicenseGuard` - Feature and limit enforcement
   - `TenantIsolationMiddleware` - Data isolation
   - `TenantRateLimitMiddleware` - Per-tenant rate limiting

## Database Schema

### Tenants Table

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type ENUM('enterprise', 'university', 'bootcamp', 'career_center'),
  status ENUM('active', 'suspended', 'trial', 'expired') DEFAULT 'trial',
  description VARCHAR(500),
  industry VARCHAR(255),
  website VARCHAR(255),

  -- Contact Information
  admin_email VARCHAR(255) NOT NULL,
  admin_phone VARCHAR(50),
  billing_email VARCHAR(255),

  -- White-label Branding
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  custom_domain VARCHAR(100),
  branding_settings JSONB,

  -- SSO Configuration
  sso_enabled BOOLEAN DEFAULT false,
  sso_provider VARCHAR(50),
  sso_settings JSONB,

  -- API Access
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  api_enabled BOOLEAN DEFAULT false,

  -- Settings
  settings JSONB,

  -- Metadata
  user_count INTEGER DEFAULT 0,
  trial_ends_at TIMESTAMP,
  activated_at TIMESTAMP,
  suspended_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tenant Licenses Table

```sql
CREATE TABLE tenant_licenses (
  id UUID PRIMARY KEY,
  tenant_id UUID UNIQUE REFERENCES tenants(id),
  license_type ENUM('starter', 'professional', 'enterprise', 'university_basic', 'university_pro'),
  status VARCHAR(50) DEFAULT 'active',

  -- Pricing
  monthly_price DECIMAL(10,2),
  annual_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle VARCHAR(50) DEFAULT 'monthly',

  -- Billing Dates
  billing_start_date TIMESTAMP,
  billing_end_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Limits
  max_users INTEGER,
  current_users INTEGER DEFAULT 0,
  max_applications_per_month INTEGER,
  applications_this_month INTEGER DEFAULT 0,
  max_api_calls_per_day INTEGER,
  api_calls_today INTEGER DEFAULT 0,
  max_storage_gb INTEGER,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,

  -- Feature Flags
  features JSONB,
  rate_limits JSONB,

  -- Usage Reset
  usage_reset_date TIMESTAMP,
  api_usage_reset_date TIMESTAMP,

  -- Trial
  is_trial BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMP,
  trial_end_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## License Types

### Enterprise Licenses

#### 1. Starter ($99/month)
- Max 10 users
- 500 applications/month
- 1,000 API calls/day
- 10GB storage
- Basic features
- No white-labeling

#### 2. Professional ($299/month)
- Max 50 users
- 5,000 applications/month
- 10,000 API calls/day
- 100GB storage
- Advanced analytics
- White-labeling
- SSO integration
- Priority support

#### 3. Enterprise ($999/month)
- Unlimited users
- Unlimited applications
- Unlimited API calls
- Unlimited storage
- All features
- Dedicated account manager
- Custom integrations

### University/Bootcamp Licenses

#### 1. University Basic ($499/month)
- Max 500 students
- 10,000 applications/month
- Placement tracking
- Cohort management
- Resume templates
- Career center dashboard

#### 2. University Pro ($1,499/month)
- Unlimited students
- Unlimited applications
- All University Basic features
- API access
- Custom integrations
- Dedicated support

## API Endpoints

### Tenant Management

```
POST   /api/v1/tenants                    - Create tenant
GET    /api/v1/tenants/:id                - Get tenant details
PUT    /api/v1/tenants/:id                - Update tenant
GET    /api/v1/tenants/:id/license        - Get license info
GET    /api/v1/tenants/:id/rate-limits    - Get rate limit status
```

### User Management

```
POST   /api/v1/tenants/:id/users/bulk     - Bulk import users
GET    /api/v1/tenants/:id/users          - Get tenant users
GET    /api/v1/tenants/:id/users/export/csv - Export users to CSV
```

### Department Management

```
POST   /api/v1/tenants/:id/departments              - Create department
GET    /api/v1/tenants/:id/departments              - Get departments
GET    /api/v1/tenants/:id/departments/:deptId/analytics - Department analytics
```

### Cohort Management

```
GET    /api/v1/tenants/:id/cohorts                  - Get all cohorts
POST   /api/v1/tenants/:id/cohorts                  - Create cohort
GET    /api/v1/tenants/:id/cohorts/:cohort/placements - Get cohort placements
GET    /api/v1/tenants/:id/cohorts/:cohort/analytics  - Cohort analytics
GET    /api/v1/tenants/:id/cohorts/:cohort/export/csv - Export cohort CSV
```

### Analytics & Reporting

```
GET    /api/v1/tenants/:id/analytics              - Get analytics
GET    /api/v1/tenants/:id/analytics/export/csv   - Export analytics CSV
GET    /api/v1/tenants/:id/analytics/export/pdf   - Export analytics PDF
```

### Placement Tracking

```
POST   /api/v1/tenants/:id/placements    - Create placement record
```

### Branding

```
PUT    /api/v1/tenants/:id/branding      - Update white-label branding
```

## Features

### 1. Tenant Isolation

All tenant data is isolated using tenant_id in queries. Middleware ensures users can only access their own tenant's data.

```typescript
// Automatic tenant isolation in queries
const users = await tenantUserRepository.find({
  where: { tenant_id: tenantId }
});
```

### 2. License Enforcement

The `TenantLicenseGuard` enforces:
- Feature access based on license type
- Usage limits (users, API calls, storage)
- Trial expiration
- License status (active/suspended)

```typescript
@Get(':id/analytics')
@UseGuards(TenantLicenseGuard)
async getAnalytics(@Param('id') id: string) {
  // Automatically checks license before execution
}
```

### 3. Rate Limiting

Per-tenant rate limiting with configurable limits:

```typescript
rate_limits: {
  apiCallsPerMinute: 60,
  apiCallsPerHour: 1000,
  apiCallsPerDay: 10000,
  bulkImportPerDay: 10,
  concurrentUsers: 50
}
```

### 4. Bulk User Import

Import users from CSV with department assignment:

```typescript
POST /api/v1/tenants/:id/users/bulk
{
  "users": [
    {
      "email": "student@university.edu",
      "full_name": "John Doe",
      "role": "student",
      "cohort": "2024-Spring",
      "major": "Computer Science"
    }
  ],
  "send_invitations": true,
  "skip_duplicates": true
}
```

### 5. Placement Tracking

Track graduate outcomes and placement metrics:

```typescript
POST /api/v1/tenants/:id/placements
{
  "user_id": "uuid",
  "student_name": "John Doe",
  "student_email": "john@example.com",
  "cohort": "2024-Spring",
  "placement_status": "placed",
  "company_name": "Tech Corp",
  "job_title": "Software Engineer",
  "salary": 85000,
  "placement_date": "2024-06-15"
}
```

### 6. White-Label Branding

Customize tenant branding (Professional+ licenses):

```typescript
PUT /api/v1/tenants/:id/branding
{
  "logo_url": "https://cdn.example.com/logo.png",
  "primary_color": "#0066CC",
  "secondary_color": "#FF6600",
  "custom_domain": "careers.university.edu",
  "branding_settings": {
    "emailFooter": "Custom footer text",
    "termsUrl": "https://university.edu/terms"
  }
}
```

### 7. Analytics & Reporting

Get comprehensive analytics with multiple views:

```typescript
GET /api/v1/tenants/:id/analytics?type=placement&time_range=month&cohort=2024-Spring

Response:
{
  "summary": {
    "totalGraduates": 150,
    "totalPlacements": 135,
    "placementRate": "90.00",
    "averageSalary": "78500.00",
    "averageDaysToPlacement": "45"
  },
  "byIndustry": {
    "Technology": 65,
    "Finance": 35,
    "Healthcare": 20
  },
  "byEmploymentType": {
    "full-time": 120,
    "contract": 15
  }
}
```

### 8. CSV/PDF Export

Export data for external analysis:

```typescript
GET /api/v1/tenants/:id/analytics/export/csv
GET /api/v1/tenants/:id/cohorts/:cohort/export/csv
GET /api/v1/tenants/:id/users/export/csv
```

### 9. SSO Integration

Support for SAML and OIDC (Professional+ licenses):

```typescript
{
  "sso_enabled": true,
  "sso_provider": "saml",
  "sso_settings": {
    "saml": {
      "entryPoint": "https://sso.university.edu/saml",
      "issuer": "university-career-services",
      "cert": "-----BEGIN CERTIFICATE-----...",
      "callbackUrl": "https://apply.university.edu/auth/saml/callback"
    }
  }
}
```

### 10. Department Dashboards

Group users by department with metrics:

```typescript
POST /api/v1/tenants/:id/departments
{
  "name": "Engineering",
  "code": "ENG",
  "target_headcount": 100,
  "annual_budget": 500000
}
```

## Usage Examples

### Creating an Enterprise Tenant

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "type": "enterprise",
    "admin_email": "admin@acme.com",
    "license_type": "professional",
    "industry": "Technology",
    "website": "https://acme.com"
  }'
```

### Creating a University Tenant

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "State University",
    "slug": "state-university",
    "type": "university",
    "admin_email": "careers@university.edu",
    "license_type": "university_pro",
    "branding_settings": {
      "logoUrl": "https://university.edu/logo.png",
      "primaryColor": "#003366",
      "customDomain": "careers.university.edu"
    }
  }'
```

### Bulk Importing Students

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants/tenant-id/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "student1@university.edu",
        "full_name": "Jane Smith",
        "role": "student",
        "cohort": "2024-Spring",
        "major": "Computer Science",
        "graduation_year": "2024"
      }
    ],
    "send_invitations": true
  }'
```

### Getting Placement Analytics

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/analytics?type=placement&cohort=2024-Spring" \
  -H "Authorization: Bearer $TOKEN"
```

## Security

### Tenant Isolation

- All queries are scoped by tenant_id
- Middleware validates user access to tenant
- Foreign key constraints prevent cross-tenant data access

### API Authentication

- JWT-based authentication required
- API keys for programmatic access (Enterprise licenses)
- Rate limiting per tenant

### Data Privacy

- GDPR-compliant data handling
- Audit logs for all tenant operations
- Encrypted sensitive data (SSO credentials, API secrets)

### License Enforcement

- Real-time limit checking
- Automatic feature disabling on expiration
- Grace period handling for payment issues

## Migration Guide

To enable multi-tenant licensing in your database:

```bash
# Generate migration
npm run migration:generate -- -n AddTenantTables

# Run migration
npm run migration:run
```

## Environment Variables

Add to `.env`:

```env
# Tenant Features
ENABLE_MULTI_TENANCY=true
DEFAULT_TRIAL_DAYS=30
ENABLE_WHITE_LABELING=true
ENABLE_SSO=true

# Rate Limiting
TENANT_RATE_LIMIT_ENABLED=true
DEFAULT_API_CALLS_PER_DAY=1000
```

## Support

For questions or issues with the multi-tenant system, contact:
- Technical Support: support@applyforus.com
- Enterprise Sales: enterprise@applyforus.com
- University Partnerships: universities@applyforus.com

## License

Copyright (c) 2024 ApplyForUs. All rights reserved.
