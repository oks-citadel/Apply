# Auto-Apply Service - API Integration Reference

## Quick Reference for Service-to-Service Calls

### Job Service Integration

**Endpoint:** `GET {JOB_SERVICE_URL}/jobs/:id`

**Expected Response:**
```json
{
  "id": "job-123",
  "title": "Software Engineer",
  "company": {
    "name": "Tech Company"
  },
  "url": "https://careers.company.com/job/123",
  "description": "Job description text...",
  "requirements": ["5+ years experience", "JavaScript", "TypeScript"],
  "location": "Remote",
  "atsType": "workday"
}
```

**Alternative Fields Supported:**
- `company` (string) or `company.name` (object)
- `url`, `jobUrl`, or `externalUrl`
- `atsType` or `ats_type`

---

### User Service Integration

**Endpoint:** `GET {USER_SERVICE_URL}/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "id": "user-123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "yearsOfExperience": 5,
  "skills": [
    {"name": "JavaScript"},
    {"name": "TypeScript"}
  ],
  "workExperience": [
    {
      "title": "Software Engineer",
      "startDate": "2020-01-01",
      "endDate": "2023-01-01"
    }
  ],
  "preferences": {
    "workAuthorization": true,
    "requiresSponsorship": false,
    "availability": "2 weeks notice"
  }
}
```

**Alternative Fields Supported:**
- `firstName` or `first_name`
- `lastName` or `last_name`
- `yearsOfExperience` or `years_of_experience`
- Skills as array of strings or objects
- Work experience used to calculate years if not provided

---

### Resume Service Integration

#### Get Single Resume

**Endpoint:** `GET {RESUME_SERVICE_URL}/resumes/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "id": "resume-123",
  "userId": "user-123",
  "fileName": "resume.pdf",
  "filePath": "/uploads/resumes/resume-123.pdf",
  "title": "Software Engineer Resume",
  "isPrimary": true,
  "skills": ["JavaScript", "TypeScript", "Node.js"],
  "sections": [
    {
      "type": "skills",
      "items": [
        {"name": "JavaScript"},
        {"name": "TypeScript"}
      ]
    },
    {
      "type": "experience",
      "items": [
        {
          "title": "Software Engineer",
          "company": "Tech Company"
        }
      ]
    },
    {
      "type": "education",
      "items": [
        {
          "degree": "Bachelor of Science",
          "fieldOfStudy": "Computer Science"
        }
      ]
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Alternative Fields Supported:**
- `userId` or `user_id`
- `fileName` or `file_name`
- `filePath` or `file_path`
- `isPrimary` or `is_primary`
- Skills from direct array or from sections
- Experience and education from sections

#### Get All User Resumes

**Endpoint:** `GET {RESUME_SERVICE_URL}/resumes?page=1&limit=100`

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "resumes": [
    {
      "id": "resume-123",
      "userId": "user-123",
      "title": "Software Engineer Resume",
      "isPrimary": true,
      ...
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 100
}
```

**Alternative Response Format:**
```json
[
  {
    "id": "resume-123",
    "userId": "user-123",
    ...
  }
]
```

---

### Cover Letter Service Integration

**Endpoint:** `GET {RESUME_SERVICE_URL}/cover-letters/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "id": "cover-letter-123",
  "userId": "user-123",
  "fileName": "cover-letter.pdf",
  "filePath": "/uploads/cover-letters/cover-letter-123.pdf",
  "title": "Software Engineer Cover Letter",
  "isTemplate": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Alternative Fields Supported:**
- `userId` or `user_id`
- `fileName` or `file_name`
- `filePath` or `file_path`
- `isTemplate` or `is_template`

**Note:** Cover letters are optional. If not found, the service continues without error.

---

## Service URLs Configuration

Set these environment variables:

```bash
JOB_SERVICE_URL=http://localhost:8004/api/v1
USER_SERVICE_URL=http://localhost:8002/api/v1
RESUME_SERVICE_URL=http://localhost:8003/api/v1
AI_SERVICE_URL=http://localhost:8007/api/v1
HTTP_TIMEOUT=30000
```

---

## Circuit Breaker Status

**Endpoint:** `GET /health/circuit-breakers`

**Response:**
```json
{
  "status": "ok",
  "circuitBreakers": {
    "job-service": "CLOSED",
    "user-service": "CLOSED",
    "resume-service": "CLOSED",
    "ai-service": "CLOSED"
  },
  "timestamp": "2025-12-15T12:00:00.000Z"
}
```

**Circuit Breaker States:**
- `CLOSED` - Service is healthy, requests are passing through
- `OPEN` - Service is failing, requests are being blocked
- `HALF_OPEN` - Service is recovering, limited requests allowed

---

## Error Responses

### Service Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Job 123 not found or unavailable",
  "error": "Not Found"
}
```

### Service Unavailable (503)
```json
{
  "statusCode": 503,
  "message": "job-service is currently unavailable",
  "error": "Service Unavailable"
}
```

### Circuit Breaker Open (503)
```json
{
  "statusCode": 503,
  "message": "Circuit breaker is OPEN for job-service. Service is temporarily unavailable.",
  "error": "Service Unavailable"
}
```

---

## Retry and Timeout Configuration

### Standard Requests
- **Timeout:** 30 seconds
- **Retries:** 2 attempts
- **Retry Delay:** 1 second

### AI Service Requests
- **Timeout:** 60 seconds (longer for generation)
- **Retries:** 1 attempt
- **Retry Delay:** 2 seconds

### Circuit Breaker
- **Failure Threshold:** 5 consecutive failures
- **Success Threshold:** 2 consecutive successes (in HALF_OPEN)
- **Reset Timeout:** 60 seconds

---

## Authentication

When calling authenticated endpoints, pass the JWT token:

```typescript
const headers = {
  'Authorization': `Bearer ${token}`
};
```

The ServiceClientService accepts an optional `authToken` parameter for methods that require authentication.

---

## Testing Service Calls

### Test Job Service
```bash
curl http://localhost:8004/api/v1/jobs/{jobId}
```

### Test User Service
```bash
curl -H "Authorization: Bearer {token}" \
     http://localhost:8002/api/v1/profile
```

### Test Resume Service
```bash
curl -H "Authorization: Bearer {token}" \
     http://localhost:8003/api/v1/resumes/{resumeId}
```

### Test Circuit Breaker Status
```bash
curl http://localhost:8005/health/circuit-breakers
```

---

## Common Integration Issues

### Issue: Service Returns 404
**Cause:** Resource not found
**Solution:** Verify the ID exists in the target service

### Issue: Service Returns 503
**Cause:** Service is down or circuit breaker is open
**Solution:** Check service health and circuit breaker status

### Issue: Request Timeout
**Cause:** Service is slow or unresponsive
**Solution:** Check service logs, increase timeout if needed

### Issue: Circuit Breaker Stuck in OPEN
**Cause:** Service has been failing consistently
**Solution:** Fix the underlying service issue, wait 60s for reset

---

## Monitoring Checklist

- [ ] Monitor circuit breaker state changes
- [ ] Track service call success/failure rates
- [ ] Monitor average response times
- [ ] Alert on circuit breaker OPEN state
- [ ] Track retry counts
- [ ] Monitor timeout occurrences
- [ ] Check service health endpoints regularly

---

## Response Mapping

The ServiceClientService automatically handles various response formats:

- **Snake_case** ↔ **camelCase** field names
- **Nested objects** vs **flat strings**
- **Array variations** (direct arrays vs paginated responses)
- **Optional fields** with fallback values

This ensures compatibility with different service implementations.
