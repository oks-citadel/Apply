# Reports Module

## Overview

The Reports Module provides comprehensive job posting reporting functionality, allowing users to report problematic job listings and administrators to manage and resolve these reports.

## Features

- Submit reports for job postings with various report types
- Prevent duplicate reports from the same user for the same job
- Admin dashboard for managing reports
- Report status tracking and resolution workflow
- Automatic job deactivation for resolved critical reports
- Comprehensive reporting statistics

## Report Types

- **SPAM**: Fraudulent or spam job postings
- **EXPIRED**: Job posting is no longer valid
- **MISLEADING**: Job description is misleading or inaccurate
- **DUPLICATE**: Duplicate job posting
- **INAPPROPRIATE**: Contains inappropriate content
- **OTHER**: Other issues not covered above

## Report Status

- **PENDING**: Newly submitted, awaiting review
- **REVIEWED**: Report has been reviewed by an admin
- **RESOLVED**: Issue has been resolved (job may be deactivated)
- **DISMISSED**: Report was invalid or not actionable

## API Endpoints

### User Endpoints

#### Submit a Report
```
POST /jobs/:id/report
```
**Authentication**: Required
**Body**:
```json
{
  "reportType": "spam",
  "reason": "This job appears to be fraudulent",
  "description": "The salary offered is unrealistic and company details are suspicious"
}
```

**Response**:
```json
{
  "id": "uuid",
  "jobId": "uuid",
  "userId": "uuid",
  "reportType": "spam",
  "reason": "This job appears to be fraudulent",
  "description": "The salary offered is unrealistic...",
  "status": "pending",
  "createdAt": "2024-12-05T10:30:00Z",
  "updatedAt": "2024-12-05T10:30:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Job does not exist
- `409 Conflict`: User has already reported this job
- `429 Too Many Requests`: Rate limit exceeded

### Admin Endpoints

#### List All Reports
```
GET /reports?status=pending&page=1&limit=20
```
**Authentication**: Admin only
**Query Parameters**:
- `status`: Filter by status (pending, reviewed, resolved, dismissed)
- `reportType`: Filter by report type
- `jobId`: Filter by job ID
- `userId`: Filter by user ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Sort field (created_at, updated_at, resolved_at)
- `sortOrder`: ASC or DESC

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

#### Get Report by ID
```
GET /reports/:id
```
**Authentication**: Admin only

#### Update Report Status
```
PATCH /reports/:id
```
**Authentication**: Admin only
**Body**:
```json
{
  "status": "resolved",
  "resolutionNotes": "Job posting removed as confirmed spam"
}
```

#### Get Reports for Specific Job
```
GET /jobs/:id/reports?page=1&limit=20
```
**Authentication**: Admin only

#### Get Report Count for Job
```
GET /jobs/:id/reports/count
```
**Authentication**: Admin only

#### Get Report Statistics
```
GET /reports/stats
```
**Authentication**: Admin only
**Response**:
```json
{
  "total": 150,
  "pending": 45,
  "reviewed": 30,
  "resolved": 60,
  "dismissed": 15,
  "byType": {
    "spam": 50,
    "expired": 30,
    "misleading": 25,
    "duplicate": 20,
    "inappropriate": 15,
    "other": 10
  }
}
```

#### Delete Report
```
DELETE /reports/:id
```
**Authentication**: Admin only

## Database Schema

### Table: job_reports

```sql
CREATE TABLE job_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  report_type report_type NOT NULL,
  reason VARCHAR(255),
  description TEXT,
  status report_status DEFAULT 'pending',
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id) -- Prevents duplicate reports
);

CREATE INDEX idx_job_reports_job_id ON job_reports(job_id);
CREATE INDEX idx_job_reports_user_id ON job_reports(user_id);
CREATE INDEX idx_job_reports_status ON job_reports(status);
CREATE INDEX idx_job_reports_created_at ON job_reports(created_at);
```

## Business Logic

### Duplicate Prevention
The system prevents users from submitting multiple reports for the same job using a unique constraint on (user_id, job_id).

### Automatic Job Deactivation
When a report is resolved with status "RESOLVED" and the report type is SPAM, EXPIRED, or INAPPROPRIATE, the associated job is automatically deactivated.

### Rate Limiting
The `/jobs/:id/report` endpoint should be protected with rate limiting to prevent abuse:
- Recommended: 5 reports per hour per user
- Implement using NestJS Throttler or similar

## Validation Rules

1. **reportType**: Must be one of the valid ReportType enum values
2. **reason**: Optional, max 255 characters
3. **description**: Optional, text field
4. **status**: Must be one of the valid ReportStatus enum values (admin only)
5. **resolutionNotes**: Optional, text field (admin only)

## Migration

Run the migration to create the reports table:

```bash
npm run typeorm migration:run
```

Migration file: `src/migrations/1733400000000-CreateReportsTable.ts`

## Testing

Run unit tests:
```bash
npm test -- reports.service.spec.ts
```

## Module Structure

```
src/modules/reports/
├── dto/
│   ├── create-report.dto.ts       # DTO for creating reports
│   ├── update-report.dto.ts       # DTO for updating reports
│   ├── report-response.dto.ts     # Response DTOs
│   └── query-reports.dto.ts       # Query parameters DTO
├── entities/
│   └── report.entity.ts           # JobReport entity
├── enums/
│   └── report-type.enum.ts        # ReportType and ReportStatus enums
├── reports.controller.ts          # Admin endpoints
├── job-reports.controller.ts      # User endpoints for job reporting
├── reports.service.ts             # Business logic
├── reports.module.ts              # Module definition
├── reports.service.spec.ts        # Unit tests
└── README.md                      # This file
```

## Integration with Jobs Module

The Reports Module is integrated into the Job Service:
- Added to `app.module.ts` imports
- Uses existing Job entity for foreign key relationship
- Complements the existing job reporting endpoint

## Future Enhancements

1. **Email Notifications**: Notify admins of new reports
2. **Report Trends**: Analytics on frequently reported jobs
3. **Auto-moderation**: ML-based automatic report classification
4. **User Reputation**: Track users who submit valid reports
5. **Batch Operations**: Bulk report resolution
6. **Report Appeals**: Allow users to appeal dismissed reports

## Notes

- The original `JobsService.reportJob()` method is kept for backward compatibility but is deprecated
- All new code should use the `ReportsService` instead
- Consider implementing a background job to periodically review pending reports
- Monitor report patterns to identify malicious reporters or systematic issues
