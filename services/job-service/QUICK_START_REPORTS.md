# Quick Start Guide - Job Reports Feature

## Setup

### 1. Run Database Migration

```bash
cd services/job-service
npm run migration:run
```

This will create the `job_reports` table in your PostgreSQL database.

### 2. Verify Installation

```bash
# Build the service
npm run build

# Run tests
npm run test jobs.report.spec.ts
```

## Usage Examples

### User: Report a Job

```http
POST http://localhost:3002/jobs/{jobId}/report
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "reason": "spam",
  "details": "This job posting appears to be fraudulent"
}
```

**Response:**
```json
{
  "message": "Job reported successfully. Our team will review it shortly.",
  "reportId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### User: Check if Already Reported

```http
GET http://localhost:3002/jobs/{jobId}/has-reported
Authorization: Bearer {userToken}
```

**Response:**
```json
{
  "hasReported": true
}
```

### User: Get My Reports

```http
GET http://localhost:3002/reports/my-reports?page=1&limit=20
Authorization: Bearer {userToken}
```

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "jobId": "job-123",
      "userId": "user-456",
      "reportType": "spam",
      "reason": "spam",
      "description": "This job posting appears to be fraudulent",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

### Admin: Get All Reports

```http
GET http://localhost:3002/reports?status=pending&page=1&limit=20
Authorization: Bearer {adminToken}
```

### Admin: Get Reports for Specific Job

```http
GET http://localhost:3002/jobs/{jobId}/reports?page=1&limit=20
Authorization: Bearer {adminToken}
```

### Admin: Update Report Status

```http
PATCH http://localhost:3002/reports/{reportId}
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionNotes": "Job posting has been reviewed and removed as it violated our terms of service."
}
```

### Admin: Get Report Statistics

```http
GET http://localhost:3002/reports/stats
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "total": 150,
  "pending": 45,
  "reviewed": 30,
  "resolved": 60,
  "dismissed": 15,
  "byType": {
    "spam": 80,
    "expired": 20,
    "misleading": 25,
    "duplicate": 10,
    "inappropriate": 10,
    "other": 5
  }
}
```

## Report Types

Valid report types (enum):
- `spam` - Fraudulent or spam posting
- `expired` - Job posting is expired
- `misleading` - Misleading information
- `duplicate` - Duplicate posting
- `inappropriate` - Inappropriate content
- `other` - Other issues

## Report Status Flow

```
pending → reviewed → resolved
         ↓
         dismissed
```

- **pending**: Initial state when report is created
- **reviewed**: Admin has reviewed the report
- **resolved**: Issue has been resolved (may auto-deactivate job)
- **dismissed**: Report was invalid or not actionable

## Code Examples

### TypeScript/JavaScript Client

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3002';

// Report a job
async function reportJob(jobId: string, reason: string, details: string, token: string) {
  try {
    const response = await axios.post(
      `${API_URL}/jobs/${jobId}/report`,
      { reason, details },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Report submitted:', response.data.reportId);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.error('You have already reported this job');
    } else if (error.response?.status === 404) {
      console.error('Job not found');
    } else {
      console.error('Failed to report job:', error.message);
    }
    throw error;
  }
}

// Check if user has reported a job
async function hasUserReported(jobId: string, token: string) {
  const response = await axios.get(
    `${API_URL}/jobs/${jobId}/has-reported`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.hasReported;
}

// Get user's reports
async function getMyReports(page = 1, limit = 20, token: string) {
  const response = await axios.get(
    `${API_URL}/reports/my-reports?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// Admin: Get all reports
async function getAllReports(filters: any, adminToken: string) {
  const params = new URLSearchParams(filters);
  const response = await axios.get(
    `${API_URL}/reports?${params.toString()}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return response.data;
}

// Admin: Resolve a report
async function resolveReport(
  reportId: string,
  resolutionNotes: string,
  adminToken: string
) {
  const response = await axios.patch(
    `${API_URL}/reports/${reportId}`,
    {
      status: 'resolved',
      resolutionNotes
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return response.data;
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useJobReport(jobId: string) {
  const [hasReported, setHasReported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkReported() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `/jobs/${jobId}/has-reported`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHasReported(response.data.hasReported);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    checkReported();
  }, [jobId]);

  const reportJob = async (reason: string, details: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/jobs/${jobId}/report`,
        { reason, details },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasReported(true);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { hasReported, reportJob, loading, error };
}
```

## Database Queries

### Get pending reports count
```sql
SELECT COUNT(*) FROM job_reports WHERE status = 'pending';
```

### Get most reported jobs
```sql
SELECT job_id, COUNT(*) as report_count
FROM job_reports
GROUP BY job_id
ORDER BY report_count DESC
LIMIT 10;
```

### Get reports by type
```sql
SELECT report_type, COUNT(*) as count
FROM job_reports
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY report_type;
```

### Get user's reporting history
```sql
SELECT jr.*, j.title as job_title
FROM job_reports jr
LEFT JOIN jobs j ON jr.job_id = j.id
WHERE jr.user_id = 'user-123'
ORDER BY jr.created_at DESC;
```

## Error Handling

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Report created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Job or report not found
- `409 Conflict` - User already reported this job
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "statusCode": 409,
  "message": "You have already reported this job. Your previous report is being reviewed.",
  "error": "Conflict"
}
```

## Best Practices

### For Users
1. ✅ Provide detailed descriptions in reports
2. ✅ Only report genuine issues
3. ✅ Check if you've already reported before trying again
4. ❌ Don't spam the reporting system

### For Admins
1. ✅ Review reports promptly
2. ✅ Add resolution notes for transparency
3. ✅ Monitor report statistics regularly
4. ✅ Take action on resolved reports (deactivate jobs, ban users, etc.)

### For Developers
1. ✅ Always handle errors gracefully
2. ✅ Use pagination for lists
3. ✅ Validate input with DTOs
4. ✅ Use TypeScript types for type safety
5. ✅ Test edge cases (duplicate reports, non-existent jobs, etc.)

## Testing

### Manual Testing with cURL

```bash
# Report a job
curl -X POST http://localhost:3002/jobs/job-123/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "spam", "details": "Fraudulent posting"}'

# Check if reported
curl http://localhost:3002/jobs/job-123/has-reported \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get my reports
curl http://localhost:3002/reports/my-reports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Unit Tests

```bash
# Run all tests
npm run test

# Run report-specific tests
npm run test jobs.report.spec.ts

# Run with coverage
npm run test:cov
```

## Swagger/OpenAPI Documentation

Access interactive API documentation:
```
http://localhost:3002/api-docs
```

## Troubleshooting

### Issue: "Job not found" error
**Solution:** Verify the job ID exists and is active in the database.

### Issue: "You have already reported this job"
**Solution:** Users can only report each job once. Check `/jobs/:id/has-reported` first.

### Issue: Migration fails
**Solution:** Ensure PostgreSQL is running and UUID extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue: Rate limit errors
**Solution:** Implement exponential backoff in your client code.

## Support

For issues or questions:
1. Check the main documentation: `REPORT_PERSISTENCE_IMPLEMENTATION.md`
2. Review test cases: `src/modules/jobs/__tests__/jobs.report.spec.ts`
3. Check logs: `docker logs job-service`

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=jobpilot

# Service
PORT=3002
NODE_ENV=development
```

## Quick Reference

| Feature | Endpoint | Method | Auth |
|---------|----------|--------|------|
| Report job | `/jobs/:id/report` | POST | User |
| Check if reported | `/jobs/:id/has-reported` | GET | User |
| My reports | `/reports/my-reports` | GET | User |
| All reports | `/reports` | GET | Admin |
| Job reports | `/jobs/:id/reports` | GET | Admin |
| Report stats | `/reports/stats` | GET | Admin |
| Update report | `/reports/:id` | PATCH | Admin |
| Delete report | `/reports/:id` | DELETE | Admin |
