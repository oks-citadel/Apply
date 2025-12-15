# Multi-Tenant Licensing API Examples

## Quick Start Guide

This guide provides practical examples for using the multi-tenant licensing API.

## Table of Contents

1. [Setup](#setup)
2. [Enterprise Use Cases](#enterprise-use-cases)
3. [University Use Cases](#university-use-cases)
4. [Analytics & Reporting](#analytics--reporting)
5. [Administration](#administration)

## Setup

### Base URL
```
Production: https://api.applyforus.com
Development: http://localhost:3000
```

### Authentication
All requests require a Bearer token:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Enterprise Use Cases

### 1. Create Enterprise Tenant

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechCorp Inc",
    "slug": "techcorp",
    "type": "enterprise",
    "admin_email": "hr@techcorp.com",
    "billing_email": "billing@techcorp.com",
    "license_type": "professional",
    "industry": "Technology",
    "website": "https://techcorp.com",
    "description": "Global technology company",
    "branding_settings": {
      "logoUrl": "https://cdn.techcorp.com/logo.png",
      "primaryColor": "#0052CC",
      "secondaryColor": "#172B4D"
    }
  }'
```

Response:
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "TechCorp Inc",
    "slug": "techcorp",
    "type": "enterprise",
    "status": "trial",
    "trial_ends_at": "2024-02-15T00:00:00Z",
    "api_key": "apfu_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "created_at": "2024-01-15T00:00:00Z"
  }
}
```

### 2. Bulk Import Employees

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "john.doe@techcorp.com",
        "full_name": "John Doe",
        "role": "member",
        "department": "Engineering",
        "job_title": "Software Engineer",
        "employee_id": "EMP-001",
        "send_invitation": true
      },
      {
        "email": "jane.smith@techcorp.com",
        "full_name": "Jane Smith",
        "role": "manager",
        "department": "Engineering",
        "job_title": "Engineering Manager",
        "employee_id": "EMP-002",
        "send_invitation": true
      },
      {
        "email": "hr@techcorp.com",
        "full_name": "HR Admin",
        "role": "admin",
        "department": "Human Resources",
        "job_title": "HR Director",
        "employee_id": "EMP-003",
        "send_invitation": true
      }
    ],
    "send_invitations": true,
    "skip_duplicates": true
  }'
```

Response:
```json
{
  "success": true,
  "message": "Bulk import completed",
  "data": {
    "success": [
      {
        "email": "john.doe@techcorp.com",
        "name": "John Doe"
      },
      {
        "email": "jane.smith@techcorp.com",
        "name": "Jane Smith"
      }
    ],
    "failed": [],
    "skipped": [
      {
        "email": "hr@techcorp.com",
        "reason": "User already exists in tenant"
      }
    ]
  }
}
```

### 3. Create Departments

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering",
    "code": "ENG",
    "description": "Software engineering and development",
    "target_headcount": 150,
    "annual_budget": 12000000,
    "settings": {
      "autoApproveApplications": false,
      "requireManagerApproval": true,
      "notificationEmail": "engineering-hr@techcorp.com"
    }
  }'
```

### 4. Configure White-Label Branding

```bash
curl -X PUT https://api.applyforus.com/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000/branding \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logo_url": "https://cdn.techcorp.com/career-logo.png",
    "primary_color": "#0052CC",
    "secondary_color": "#172B4D",
    "custom_domain": "careers.techcorp.com",
    "branding_settings": {
      "faviconUrl": "https://cdn.techcorp.com/favicon.ico",
      "accentColor": "#36B37E",
      "emailFooter": "TechCorp Careers Team | careers@techcorp.com",
      "termsUrl": "https://techcorp.com/careers/terms",
      "privacyUrl": "https://techcorp.com/careers/privacy"
    }
  }'
```

### 5. Get Department Analytics

```bash
curl -X GET https://api.applyforus.com/api/v1/tenants/550e8400-e29b-41d4-a716-446655440000/departments/dept-id/analytics \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": "dept-id",
        "name": "Engineering",
        "code": "ENG",
        "headcount": 142,
        "target_headcount": 150,
        "total_applications": 1250,
        "successful_placements": 35,
        "placement_rate": 2.8,
        "average_salary_placed": 95000
      }
    ]
  }
}
```

## University Use Cases

### 1. Create University Tenant

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "State University Career Services",
    "slug": "state-university",
    "type": "university",
    "admin_email": "careers@stateuniversity.edu",
    "billing_email": "billing@stateuniversity.edu",
    "license_type": "university_pro",
    "website": "https://careers.stateuniversity.edu",
    "description": "Career services for State University students and alumni",
    "branding_settings": {
      "logoUrl": "https://www.stateuniversity.edu/images/su-logo.png",
      "primaryColor": "#003366",
      "secondaryColor": "#CC0000",
      "customDomain": "careers.stateuniversity.edu"
    }
  }'
```

### 2. Create Student Cohort

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants/tenant-id/cohorts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class of 2024 - Spring",
    "program": "Computer Science BS",
    "description": "Spring 2024 graduating class in Computer Science",
    "start_date": "2020-08-15",
    "end_date": "2024-05-10",
    "graduation_date": "2024-05-15",
    "target_enrollment": 150,
    "instructors": [
      "Prof. John Smith",
      "Dr. Jane Doe"
    ],
    "coordinator_email": "cs-coordinator@stateuniversity.edu"
  }'
```

### 3. Bulk Import Students

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants/tenant-id/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "alice@stateuniversity.edu",
        "full_name": "Alice Johnson",
        "role": "student",
        "student_id": "STU-2024-001",
        "cohort": "Class of 2024 - Spring",
        "major": "Computer Science",
        "graduation_year": "2024",
        "send_invitation": true
      },
      {
        "email": "bob@stateuniversity.edu",
        "full_name": "Bob Williams",
        "role": "student",
        "student_id": "STU-2024-002",
        "cohort": "Class of 2024 - Spring",
        "major": "Computer Science",
        "graduation_year": "2024",
        "send_invitation": true
      }
    ],
    "send_invitations": true
  }'
```

### 4. Track Graduate Placement

```bash
curl -X POST https://api.applyforus.com/api/v1/tenants/tenant-id/placements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "student_id": "STU-2024-001",
    "student_name": "Alice Johnson",
    "student_email": "alice@stateuniversity.edu",
    "cohort": "Class of 2024 - Spring",
    "program": "Computer Science BS",
    "major": "Computer Science",
    "graduation_year": "2024",
    "graduation_date": "2024-05-15",
    "placement_status": "placed",
    "company_name": "Google",
    "job_title": "Software Engineer",
    "industry": "Technology",
    "location": "Mountain View, CA",
    "employment_type": "full-time",
    "salary": 125000,
    "salary_currency": "USD",
    "start_date": "2024-06-15",
    "placement_date": "2024-04-20",
    "total_applications": 45,
    "interviews_attended": 12,
    "offers_received": 3,
    "job_source": "platform",
    "used_platform": true,
    "attended_career_services": true,
    "skills": ["Python", "JavaScript", "React", "Node.js"],
    "certifications": ["AWS Certified Developer"],
    "satisfaction_score": 5,
    "feedback": "Career services was extremely helpful!"
  }'
```

### 5. Get Cohort Placement Analytics

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/cohorts/Class%20of%202024%20-%20Spring/analytics?time_range=year" \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "cohort": "Class of 2024 - Spring",
    "summary": {
      "totalStudents": 150,
      "placedStudents": 135,
      "seekingStudents": 10,
      "notSeekingStudents": 5,
      "placementRate": "90.00",
      "averageSalary": "78500.00",
      "averageDaysToPlacement": "45"
    },
    "byIndustry": {
      "Technology": 65,
      "Finance": 35,
      "Healthcare": 20,
      "Consulting": 15
    },
    "byCompany": {
      "Google": 12,
      "Microsoft": 10,
      "Amazon": 8,
      "Apple": 7
    },
    "topSkills": [
      { "skill": "Python", "count": 85 },
      { "skill": "JavaScript", "count": 72 },
      { "skill": "SQL", "count": 65 }
    ]
  }
}
```

### 6. Export Cohort Data

```bash
# Export to CSV
curl -X GET https://api.applyforus.com/api/v1/tenants/tenant-id/cohorts/Class%20of%202024%20-%20Spring/export/csv \
  -H "Authorization: Bearer $TOKEN" \
  -o cohort-placements.csv

# Response: CSV file download
```

## Analytics & Reporting

### 1. Overall Tenant Analytics

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/analytics?time_range=quarter" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Placement Analytics

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/analytics?type=placement&time_range=month&graduation_year=2024" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. User Activity Analytics

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/analytics?type=user_activity&department_id=dept-id" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Export Analytics to CSV

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/analytics/export/csv?type=placement&cohort=Class%20of%202024" \
  -H "Authorization: Bearer $TOKEN" \
  -o placement-report.csv
```

### 5. Export Analytics to PDF

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/analytics/export/pdf?type=placement" \
  -H "Authorization: Bearer $TOKEN" \
  -o analytics-report.pdf
```

## Administration

### 1. Check License Status

```bash
curl -X GET https://api.applyforus.com/api/v1/tenants/tenant-id/license \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "license-id",
    "tenant_id": "tenant-id",
    "license_type": "university_pro",
    "status": "active",
    "monthly_price": 1499.00,
    "billing_cycle": "annual",
    "max_users": null,
    "current_users": 2500,
    "max_applications_per_month": null,
    "applications_this_month": 15420,
    "features": {
      "bulkImport": true,
      "advancedAnalytics": true,
      "whiteLabeling": true,
      "apiAccess": true,
      "placementTracking": true,
      "cohortManagement": true
    },
    "is_trial": false,
    "next_billing_date": "2025-01-15T00:00:00Z"
  }
}
```

### 2. Check Rate Limits

```bash
curl -X GET https://api.applyforus.com/api/v1/tenants/tenant-id/rate-limits \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "limits": {
      "apiCallsPerMinute": 1000,
      "apiCallsPerHour": 10000,
      "apiCallsPerDay": 100000,
      "bulkImportPerDay": null,
      "concurrentUsers": null
    },
    "usage": {
      "api_calls_today": 2543,
      "applications_this_month": 15420,
      "storage_used_gb": 45.67
    },
    "maxLimits": {
      "max_api_calls_per_day": null,
      "max_applications_per_month": null,
      "max_storage_gb": null,
      "max_users": null
    },
    "current_users": 2500
  }
}
```

### 3. Get Tenant Users

```bash
curl -X GET "https://api.applyforus.com/api/v1/tenants/tenant-id/users?limit=50&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Export All Users

```bash
curl -X GET https://api.applyforus.com/api/v1/tenants/tenant-id/users/export/csv \
  -H "Authorization: Bearer $TOKEN" \
  -o tenant-users.csv
```

### 5. Update Tenant Settings

```bash
curl -X PUT https://api.applyforus.com/api/v1/tenants/tenant-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Tenant Name",
    "description": "Updated description",
    "admin_email": "newadmin@example.com",
    "status": "active"
  }'
```

## CSV Bulk Import Format

### Students CSV Format

```csv
email,full_name,role,student_id,cohort,major,graduation_year
alice@university.edu,Alice Johnson,student,STU-001,Class of 2024,Computer Science,2024
bob@university.edu,Bob Williams,student,STU-002,Class of 2024,Computer Science,2024
carol@university.edu,Carol Davis,student,STU-003,Class of 2024,Information Systems,2024
```

### Employees CSV Format

```csv
email,full_name,role,employee_id,department,job_title
john@company.com,John Doe,member,EMP-001,Engineering,Software Engineer
jane@company.com,Jane Smith,manager,EMP-002,Engineering,Engineering Manager
admin@company.com,Admin User,admin,EMP-003,HR,HR Director
```

## Error Handling

### Common Error Responses

#### 403 Forbidden - License Limit Exceeded
```json
{
  "statusCode": 403,
  "message": "User limit exceeded. Your license allows 50 users, but you're trying to add 10 more (current: 45)",
  "error": "Forbidden"
}
```

#### 403 Forbidden - Feature Not Available
```json
{
  "statusCode": 403,
  "message": "White-labeling is not available in your current license",
  "error": "Forbidden"
}
```

#### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded: too many requests per minute",
  "retryAfter": 60,
  "error": "Too Many Requests"
}
```

## Best Practices

1. **Bulk Imports**: Use the `skip_duplicates` flag to avoid errors on re-runs
2. **Rate Limits**: Monitor the rate limit headers in responses
3. **Pagination**: Use limit/offset for large datasets
4. **Analytics**: Use time_range parameters for better performance
5. **Exports**: Schedule large exports during off-peak hours

## Support

For API support:
- Documentation: https://docs.applyforus.com
- Technical Support: api-support@applyforus.com
- Status Page: https://status.applyforus.com
