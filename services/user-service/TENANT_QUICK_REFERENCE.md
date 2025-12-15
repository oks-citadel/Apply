# Multi-Tenant Licensing - Quick Reference

## Quick Start

### 1. Create a Tenant
```bash
POST /api/v1/tenants
{
  "name": "Company Name",
  "slug": "company-slug",
  "type": "enterprise|university|bootcamp",
  "admin_email": "admin@company.com",
  "license_type": "professional"
}
```

### 2. Bulk Import Users
```bash
POST /api/v1/tenants/:id/users/bulk
{
  "users": [
    {
      "email": "user@company.com",
      "full_name": "User Name",
      "role": "member|admin|student"
    }
  ]
}
```

### 3. Get Analytics
```bash
GET /api/v1/tenants/:id/analytics?type=placement&time_range=month
```

## License Tiers

| Tier | Price | Users | Apps/Month | API/Day |
|------|-------|-------|------------|---------|
| Starter | $99 | 10 | 500 | 1K |
| Professional | $299 | 50 | 5K | 10K |
| Enterprise | $999 | Unlimited | Unlimited | Unlimited |
| University Basic | $499 | 500 | 10K | 5K |
| University Pro | $1,499 | Unlimited | Unlimited | Unlimited |

## Key Endpoints

### Tenant Management
- `POST /api/v1/tenants` - Create
- `GET /api/v1/tenants/:id` - Read
- `PUT /api/v1/tenants/:id` - Update

### Users
- `POST /api/v1/tenants/:id/users/bulk` - Import
- `GET /api/v1/tenants/:id/users` - List
- `GET /api/v1/tenants/:id/users/export/csv` - Export

### Departments
- `POST /api/v1/tenants/:id/departments` - Create
- `GET /api/v1/tenants/:id/departments` - List
- `GET /api/v1/tenants/:id/departments/:deptId/analytics` - Analytics

### Cohorts (Universities)
- `GET /api/v1/tenants/:id/cohorts` - List
- `GET /api/v1/tenants/:id/cohorts/:cohort/placements` - Placements
- `GET /api/v1/tenants/:id/cohorts/:cohort/analytics` - Analytics
- `GET /api/v1/tenants/:id/cohorts/:cohort/export/csv` - Export

### Analytics
- `GET /api/v1/tenants/:id/analytics` - General
- `GET /api/v1/tenants/:id/analytics/export/csv` - CSV Export
- `GET /api/v1/tenants/:id/analytics/export/pdf` - PDF Export

### Placement Tracking
- `POST /api/v1/tenants/:id/placements` - Track

### Branding
- `PUT /api/v1/tenants/:id/branding` - Configure

### License
- `GET /api/v1/tenants/:id/license` - Info
- `GET /api/v1/tenants/:id/rate-limits` - Limits

## Features by License

| Feature | Starter | Professional | Enterprise | Uni Basic | Uni Pro |
|---------|---------|--------------|------------|-----------|---------|
| Bulk Import | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analytics | Basic | Advanced | Advanced | Advanced | Advanced |
| White-Label | ✗ | ✓ | ✓ | ✓ | ✓ |
| SSO | ✗ | ✓ | ✓ | ✓ | ✓ |
| API Access | ✗ | ✓ | ✓ | ✗ | ✓ |
| Priority Support | ✗ | ✓ | ✓ | ✓ | ✓ |
| Placement Tracking | ✗ | ✗ | ✗ | ✓ | ✓ |
| Cohort Management | ✗ | ✗ | ✗ | ✓ | ✓ |

## Common Queries

### Placement Rate by Cohort
```typescript
GET /api/v1/tenants/:id/cohorts/:cohort/analytics
Response: {
  "placementRate": "90.00",
  "averageSalary": "78500.00",
  "averageDaysToPlacement": "45"
}
```

### Department Performance
```typescript
GET /api/v1/tenants/:id/departments/:deptId/analytics
Response: {
  "headcount": 142,
  "placementRate": 2.8,
  "averageSalary": 95000
}
```

### User Activity
```typescript
GET /api/v1/tenants/:id/analytics?type=user_activity
Response: {
  "totalUsers": 150,
  "activeUsers": 135,
  "byRole": { "student": 100, "admin": 5 }
}
```

## CSV Import Formats

### Students
```csv
email,full_name,role,student_id,cohort,major,graduation_year
alice@uni.edu,Alice Johnson,student,STU-001,2024-Spring,CS,2024
```

### Employees
```csv
email,full_name,role,employee_id,department,job_title
john@co.com,John Doe,member,EMP-001,Engineering,Engineer
```

## Rate Limits by Tier

| Tier | Per Minute | Per Hour | Per Day |
|------|------------|----------|---------|
| Starter | 10 | 100 | 1K |
| Professional | 60 | 1K | 10K |
| Enterprise | 1K | 10K | 100K |
| University Basic | 30 | 500 | 5K |
| University Pro | 1K | 10K | 100K |

## Error Codes

| Code | Message | Action |
|------|---------|--------|
| 403 | License limit exceeded | Upgrade plan |
| 403 | Feature not available | Upgrade plan |
| 429 | Rate limit exceeded | Wait/upgrade |
| 404 | Tenant not found | Check ID |
| 409 | Slug already exists | Use different slug |

## Quick Commands

### Check License Status
```bash
curl -X GET https://api.applyforus.com/api/v1/tenants/:id/license \
  -H "Authorization: Bearer $TOKEN"
```

### Export All Users
```bash
curl -X GET https://api.applyforus.com/api/v1/tenants/:id/users/export/csv \
  -H "Authorization: Bearer $TOKEN" \
  -o users.csv
```

### Update Branding
```bash
curl -X PUT https://api.applyforus.com/api/v1/tenants/:id/branding \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"primary_color": "#0066CC"}'
```

## Environment Variables

```env
ENABLE_MULTI_TENANCY=true
DEFAULT_TRIAL_DAYS=30
ENABLE_WHITE_LABELING=true
ENABLE_SSO=true
TENANT_RATE_LIMIT_ENABLED=true
```

## Database Tables

- `tenants` - Organizations
- `tenant_users` - User associations
- `tenant_licenses` - License management
- `tenant_departments` - Department grouping
- `placement_tracking` - Graduate outcomes
- `cohorts` - Student cohorts

## Key Services

- **TenantService** - Main business logic
- **CohortService** - University features
- **ExportUtil** - CSV/PDF generation

## Guards & Middleware

- **TenantLicenseGuard** - Feature enforcement
- **TenantIsolationMiddleware** - Data isolation
- **TenantRateLimitMiddleware** - Rate limiting

## Support

- Docs: https://docs.applyforus.com
- Support: support@applyforus.com
- Status: https://status.applyforus.com
