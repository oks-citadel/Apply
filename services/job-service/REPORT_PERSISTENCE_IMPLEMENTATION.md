# Job Report Persistence Implementation

## Overview

This document describes the implementation of job report persistence in the Job Service. The TODO at lines 617-623 in `jobs.service.ts` has been successfully implemented to store job reports in the database.

## Implementation Summary

### 1. Database Schema

The `job_reports` table was created with the following schema (migration: `1733400000000-CreateReportsTable.ts`):

#### Table: `job_reports`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | Foreign key to jobs table |
| user_id | UUID | User who reported the job |
| report_type | ENUM | Type of report (spam, expired, misleading, duplicate, inappropriate, other) |
| reason | VARCHAR(255) | Brief reason for the report |
| description | TEXT | Detailed description |
| status | ENUM | Report status (pending, reviewed, resolved, dismissed) |
| resolved_by | UUID | Admin who resolved the report |
| resolved_at | TIMESTAMP | When the report was resolved |
| resolution_notes | TEXT | Admin notes on resolution |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMP | When the report was created |
| updated_at | TIMESTAMP | When the report was last updated |

#### Indexes

- `IDX_JOB_REPORTS_JOB_ID` - On job_id
- `IDX_JOB_REPORTS_USER_ID` - On user_id
- `IDX_JOB_REPORTS_STATUS` - On status
- `IDX_JOB_REPORTS_CREATED_AT` - On created_at
- `IDX_JOB_REPORTS_REPORT_TYPE` - On report_type
- `IDX_JOB_REPORTS_USER_JOB_UNIQUE` - Unique index on (user_id, job_id) to prevent duplicate reports

### 2. Entity Layer

**File:** `services/job-service/src/modules/reports/entities/report.entity.ts`

The `JobReport` entity maps to the `job_reports` table with proper TypeORM decorators and relationships.

### 3. Service Layer

#### ReportsService

**File:** `services/job-service/src/modules/reports/reports.service.ts`

Key methods:
- `createReport(jobId, userId, createReportDto)` - Creates a new report with duplicate checking
- `getReports(queryDto)` - Get all reports with filtering and pagination (admin)
- `getReportsByJobId(jobId, page, limit)` - Get reports for a specific job
- `getReportsByUserId(userId, page, limit)` - Get reports submitted by a user
- `getReportById(reportId)` - Get a single report by ID
- `updateReport(reportId, adminUserId, updateReportDto)` - Update report status (admin)
- `deleteReport(reportId)` - Delete a report (admin)
- `getReportStats()` - Get statistics about reports
- `hasUserReportedJob(userId, jobId)` - Check if user already reported a job
- `getJobReportCount(jobId)` - Get count of reports for a job

#### JobsService Integration

**File:** `services/job-service/src/modules/jobs/jobs.service.ts`

The `reportJob` method was updated to:
1. Validate that the job exists
2. Map the old DTO format to the new CreateReportDto
3. Call `reportsService.createReport()` to persist the report
4. Return success message with report ID

Additional helper methods added:
- `getJobReports(jobId, page, limit)` - Get reports for a job
- `hasUserReportedJob(userId, jobId)` - Check if user reported a job
- `getJobReportCount(jobId)` - Get report count for a job

### 4. Controller Layer

#### ReportsController

**File:** `services/job-service/src/modules/reports/reports.controller.ts`

Admin endpoints:
- `GET /reports` - Get all reports with filtering (admin)
- `GET /reports/stats` - Get report statistics (admin)
- `GET /reports/my-reports` - Get current user's reports
- `GET /reports/:id` - Get report by ID (admin)
- `PATCH /reports/:id` - Update report status (admin)
- `DELETE /reports/:id` - Delete a report (admin)

#### JobReportsController

**File:** `services/job-service/src/modules/reports/job-reports.controller.ts`

Job-specific endpoints:
- `POST /jobs/:id/report` - Report a job
- `GET /jobs/:id/reports` - Get reports for a job (admin)
- `GET /jobs/:id/reports/count` - Get report count for a job (admin)

#### JobsController

**File:** `services/job-service/src/modules/jobs/jobs.controller.ts`

Additional endpoints added:
- `POST /jobs/:id/report` - Report a job (existing endpoint, now persists to DB)
- `GET /jobs/:id/reports` - Get reports for a job
- `GET /jobs/:id/report-count` - Get report count
- `GET /jobs/:id/has-reported` - Check if user has reported the job

### 5. DTO Layer

#### CreateReportDto

**File:** `services/job-service/src/modules/reports/dto/create-report.dto.ts`

Validates:
- `reportType` (required) - Enum of report types
- `reason` (optional) - Brief reason
- `description` (optional) - Detailed description

#### ReportJobDto

**File:** `services/job-service/src/modules/jobs/dto/report-job.dto.ts`

Legacy DTO for backward compatibility:
- `reason` (required) - Report reason (now enum validated)
- `details` (optional) - Report details

Updated with proper enum validation.

### 6. Module Configuration

**File:** `services/job-service/src/modules/jobs/jobs.module.ts`

The JobsModule now imports ReportsModule to enable dependency injection of ReportsService.

### 7. Error Handling

The implementation includes comprehensive error handling:

- **NotFoundException** - When job doesn't exist
- **ConflictException** - When user already reported the job (enforced by unique index)
- **BadRequestException** - For general validation errors

### 8. Features

#### Duplicate Prevention

A unique index on `(user_id, job_id)` prevents users from reporting the same job multiple times.

#### Auto-deactivation

When a report is resolved with certain types (spam, expired, inappropriate), the job is automatically deactivated.

#### Pagination

All list endpoints support pagination with:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

#### Filtering

The reports endpoint supports filtering by:
- Status (pending, reviewed, resolved, dismissed)
- Report type
- Job ID
- User ID
- Sort field and order

## API Endpoints Summary

### User Endpoints

```http
# Report a job
POST /jobs/{jobId}/report
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "spam",
  "details": "This posting appears to be a scam"
}

# Check if user has reported a job
GET /jobs/{jobId}/has-reported
Authorization: Bearer {token}

# Get user's own reports
GET /reports/my-reports?page=1&limit=20
Authorization: Bearer {token}
```

### Admin Endpoints

```http
# Get all reports with filtering
GET /reports?status=pending&reportType=spam&page=1&limit=20
Authorization: Bearer {adminToken}

# Get report statistics
GET /reports/stats
Authorization: Bearer {adminToken}

# Get reports for a specific job
GET /jobs/{jobId}/reports?page=1&limit=20
Authorization: Bearer {adminToken}

# Get report count for a job
GET /jobs/{jobId}/report-count
Authorization: Bearer {adminToken}

# Update report status
PATCH /reports/{reportId}
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionNotes": "Job posting has been removed"
}

# Delete a report
DELETE /reports/{reportId}
Authorization: Bearer {adminToken}
```

## Database Migration

To apply the migration, run:

```bash
cd services/job-service
npm run migration:run
```

To revert the migration:

```bash
npm run migration:revert
```

## Testing

Unit tests have been created to verify the report functionality:

**File:** `services/job-service/src/modules/jobs/__tests__/jobs.report.spec.ts`

Run tests with:

```bash
cd services/job-service
npm run test
```

Run specific test file:

```bash
npm run test -- jobs.report.spec.ts
```

## Example Usage

### Reporting a Job

```typescript
// User reports a job as spam
const result = await jobsService.reportJob(
  'job-123',
  {
    reason: 'spam',
    details: 'This posting is offering unrealistic salary and benefits'
  },
  'user-456'
);

console.log(result);
// {
//   message: 'Job reported successfully. Our team will review it shortly.',
//   reportId: 'report-789'
// }
```

### Checking if User Reported

```typescript
const hasReported = await jobsService.hasUserReportedJob('user-456', 'job-123');
console.log(hasReported); // true
```

### Getting Report Count

```typescript
const count = await jobsService.getJobReportCount('job-123');
console.log(count); // 5
```

### Admin: Reviewing Reports

```typescript
// Get all pending reports
const reports = await reportsService.getReports({
  status: ReportStatus.PENDING,
  page: 1,
  limit: 20
});

// Update a report
const updatedReport = await reportsService.updateReport(
  'report-789',
  'admin-123',
  {
    status: ReportStatus.RESOLVED,
    resolutionNotes: 'Job has been reviewed and removed'
  }
);
```

## Architecture Benefits

1. **Separation of Concerns**: Reports module is independent and reusable
2. **Type Safety**: Full TypeScript support with DTOs and entities
3. **Validation**: Class-validator ensures data integrity
4. **Auditing**: Tracks who created and resolved reports with timestamps
5. **Performance**: Proper indexing for efficient queries
6. **Scalability**: Pagination prevents memory issues with large datasets
7. **Security**: Duplicate prevention and role-based access control

## Future Enhancements

Potential improvements:
1. Email notifications to admins when reports are created
2. Batch processing for resolving multiple reports
3. ML-based automatic spam detection
4. Report trends and analytics dashboard
5. User reputation system based on report accuracy
6. Automated actions based on report thresholds (e.g., auto-hide jobs with 10+ spam reports)

## Files Modified/Created

### Modified Files
- `services/job-service/src/modules/jobs/jobs.module.ts`
- `services/job-service/src/modules/jobs/jobs.service.ts`
- `services/job-service/src/modules/jobs/jobs.controller.ts`
- `services/job-service/src/modules/jobs/dto/report-job.dto.ts`
- `services/job-service/src/modules/reports/reports.service.ts`
- `services/job-service/src/modules/reports/reports.controller.ts`

### Created Files
- `services/job-service/src/modules/jobs/__tests__/jobs.report.spec.ts`
- `services/job-service/REPORT_PERSISTENCE_IMPLEMENTATION.md`

### Existing Files (Already Present)
- `services/job-service/src/migrations/1733400000000-CreateReportsTable.ts`
- `services/job-service/src/modules/reports/entities/report.entity.ts`
- `services/job-service/src/modules/reports/dto/create-report.dto.ts`
- `services/job-service/src/modules/reports/dto/update-report.dto.ts`
- `services/job-service/src/modules/reports/dto/query-reports.dto.ts`
- `services/job-service/src/modules/reports/dto/report-response.dto.ts`
- `services/job-service/src/modules/reports/enums/report-type.enum.ts`
- `services/job-service/src/modules/reports/reports.module.ts`
- `services/job-service/src/modules/reports/job-reports.controller.ts`

## Conclusion

The TODO at lines 617-623 in `jobs.service.ts` has been successfully implemented. Job reports are now fully persisted to the database with comprehensive CRUD operations, validation, error handling, and role-based access control. The implementation is production-ready with proper testing, documentation, and follows NestJS best practices.
