# Auto-Apply Service API Reference

Base URL: `http://localhost:8005/api/v1`

All endpoints require the `x-user-id` header unless otherwise specified.

## Applications Endpoints

### List Applications

```http
GET /applications?page=1&limit=10&status=applied&company_name=Google
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status
- `company_name` (string, optional): Filter by company name
- `ats_platform` (string, optional): Filter by ATS platform
- `sort_by` (string, optional): Sort field (default: 'created_at')
- `sort_order` (string, optional): 'ASC' or 'DESC' (default: 'DESC')

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "job_id": "uuid",
      "status": "applied",
      "company_name": "Google",
      "position_title": "Software Engineer",
      "applied_at": "2025-12-08T10:00:00Z",
      "auto_applied": true,
      "match_score": 85.5,
      "ats_platform": "greenhouse",
      "source": "auto_apply"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "total_pages": 10
  }
}
```

### Get Application by ID

```http
GET /applications/:id
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "job_id": "uuid",
  "resume_id": "uuid",
  "status": "applied",
  "company_name": "Google",
  "position_title": "Software Engineer",
  "application_url": "https://greenhouse.io/...",
  "ats_platform": "greenhouse",
  "application_reference_id": "APP-12345",
  "screenshot_url": "https://...",
  "form_responses": {},
  "applied_at": "2025-12-08T10:00:00Z",
  "auto_applied": true,
  "match_score": 85.5,
  "source": "auto_apply",
  "created_at": "2025-12-08T10:00:00Z",
  "updated_at": "2025-12-08T10:05:00Z"
}
```

### Get Application Analytics

```http
GET /applications/analytics
```

**Response:**
```json
{
  "total_applications": 150,
  "status_breakdown": {
    "applied": 100,
    "viewed": 30,
    "interviewing": 15,
    "offered": 3,
    "rejected": 2
  },
  "auto_applied_count": 120,
  "manual_applied_count": 30,
  "average_match_score": 82.5,
  "response_rate": 35,
  "platform_breakdown": {
    "greenhouse": 50,
    "workday": 40,
    "lever": 30,
    "icims": 20,
    "taleo": 10
  },
  "applications_last_30_days": 75
}
```

### Log Manual Application

```http
POST /applications/manual
```

**Request Body:**
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "cover_letter_id": "uuid",
  "company_name": "Google",
  "position_title": "Software Engineer",
  "application_url": "https://...",
  "ats_platform": "greenhouse",
  "notes": "Applied directly through company website"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "auto_applied": false,
  "queue_status": "completed",
  "source": "manual",
  "applied_at": "2025-12-08T10:00:00Z",
  ...
}
```

### Update Application

```http
PUT /applications/:id
```

**Request Body:**
```json
{
  "notes": "Follow-up email sent",
  "match_score": 90.0
}
```

### Update Application Status

```http
PUT /applications/:id/status
```

**Request Body:**
```json
{
  "status": "interviewing",
  "notes": "Phone screen scheduled for next week"
}
```

### Delete Application

```http
DELETE /applications/:id
```

**Response:**
```json
{
  "message": "Application deleted successfully"
}
```

## Auto-Apply Endpoints

### Get Auto-Apply Settings

```http
GET /auto-apply/settings
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "enabled": true,
  "filters": {
    "jobTitle": ["Software Engineer", "Backend Developer"],
    "location": ["Remote", "New York"],
    "experienceLevel": ["Mid-Level", "Senior"],
    "employmentType": ["Full-time"],
    "salaryMin": 100000,
    "keywords": ["Python", "TypeScript"],
    "excludeKeywords": ["PHP", "Junior"]
  },
  "resume_id": "uuid",
  "cover_letter_template": "Dear Hiring Manager...",
  "max_applications_per_day": 50,
  "auto_response": false,
  "created_at": "2025-12-01T00:00:00Z",
  "updated_at": "2025-12-08T10:00:00Z"
}
```

### Update Auto-Apply Settings

```http
PUT /auto-apply/settings
```

**Request Body:**
```json
{
  "enabled": true,
  "resumeId": "uuid",
  "coverLetterTemplate": "Dear Hiring Manager...",
  "maxApplicationsPerDay": 50,
  "autoResponse": false,
  "filters": {
    "jobTitle": ["Software Engineer"],
    "location": ["Remote"],
    "experienceLevel": ["Mid-Level"],
    "employmentType": ["Full-time"],
    "salaryMin": 100000,
    "keywords": ["Python"],
    "excludeKeywords": ["PHP"]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "enabled": true,
  ...
}
```

### Start Auto-Apply

```http
POST /auto-apply/start
```

**Response:**
```json
{
  "isRunning": true,
  "applicationsToday": 5,
  "totalApplications": 150,
  "successRate": 85.5,
  "lastRunAt": "2025-12-08T10:00:00Z",
  "nextRunAt": null
}
```

**Errors:**
- `400`: Auto-apply is not enabled
- `400`: Resume is required for auto-apply
- `400`: Daily application limit reached

### Stop Auto-Apply

```http
POST /auto-apply/stop
```

**Response:**
```json
{
  "isRunning": false,
  "applicationsToday": 5,
  "totalApplications": 150,
  "successRate": 85.5,
  "lastRunAt": "2025-12-08T10:00:00Z",
  "nextRunAt": null
}
```

### Get Auto-Apply Status

```http
GET /auto-apply/status
```

**Response:**
```json
{
  "isRunning": true,
  "applicationsToday": 5,
  "totalApplications": 150,
  "successRate": 85.5,
  "lastRunAt": "2025-12-08T10:00:00Z",
  "nextRunAt": null
}
```

## Queue Management Endpoints

### Get Queue Statistics

```http
GET /auto-apply/queue/stats
```

**Response:**
```json
{
  "waiting": 10,
  "active": 2,
  "completed": 150,
  "failed": 5,
  "delayed": 3,
  "total": 170
}
```

### Get Queued Jobs

```http
GET /auto-apply/queue/jobs
```

**Response:**
```json
{
  "waiting": [
    {
      "id": "1",
      "data": {
        "userId": "uuid",
        "jobUrl": "https://greenhouse.io/...",
        "companyName": "Google"
      },
      "progress": 0,
      "attemptsMade": 0,
      "timestamp": 1234567890,
      "processedOn": null,
      "finishedOn": null
    }
  ],
  "active": [
    {
      "id": "2",
      "data": {
        "userId": "uuid",
        "jobUrl": "https://lever.co/...",
        "companyName": "Facebook"
      },
      "progress": 50,
      "attemptsMade": 1,
      "timestamp": 1234567890,
      "processedOn": 1234567900,
      "finishedOn": null
    }
  ],
  "delayed": []
}
```

### Get Failed Jobs

```http
GET /auto-apply/queue/failed
```

**Response:**
```json
[
  {
    "id": "3",
    "data": {
      "userId": "uuid",
      "jobUrl": "https://workday.com/...",
      "companyName": "Amazon"
    },
    "progress": 0,
    "attemptsMade": 3,
    "timestamp": 1234567890,
    "processedOn": 1234567900,
    "finishedOn": 1234567950,
    "failedReason": "CAPTCHA detected",
    "stacktrace": ["Error: CAPTCHA detected", "  at ..."]
  }
]
```

### Retry Failed Job

```http
POST /auto-apply/queue/:jobId/retry
Headers: x-job-id: <job-id>
```

**Response:**
```json
{
  "message": "Job queued for retry"
}
```

### Remove Job from Queue

```http
POST /auto-apply/queue/:jobId/remove
Headers: x-job-id: <job-id>
```

**Response:**
```json
{
  "message": "Job removed from queue"
}
```

### Pause Queue

```http
POST /auto-apply/queue/pause
```

**Response:**
```json
{
  "message": "Queue paused"
}
```

### Resume Queue

```http
POST /auto-apply/queue/resume
```

**Response:**
```json
{
  "message": "Queue resumed"
}
```

### Clear Queue

```http
POST /auto-apply/queue/clear
```

**Response:**
```json
{
  "message": "Queue cleared"
}
```

## Error Responses

All endpoints return standard error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "User ID is required in headers",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Application with ID xyz not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Rate Limiting

Platform-specific rate limits are applied:

| Platform | Applications/Hour | Delay Between |
|----------|------------------|---------------|
| Workday | 20 | 3 minutes |
| Greenhouse | 30 | 2 minutes |
| Lever | 30 | 2 minutes |
| iCIMS | 25 | 2.4 minutes |
| Taleo | 15 | 4 minutes |
| SmartRecruiters | 30 | 2 minutes |
| Default | 20 | 3 minutes |

## WebSocket Events (Future)

Future implementation will support real-time updates:

```javascript
// Subscribe to application updates
socket.on('application:started', (data) => {
  console.log('Application started:', data);
});

socket.on('application:completed', (data) => {
  console.log('Application completed:', data);
});

socket.on('application:failed', (data) => {
  console.log('Application failed:', data);
});

socket.on('queue:stats', (data) => {
  console.log('Queue stats:', data);
});
```

## Example Usage

### JavaScript/TypeScript Client

```typescript
class AutoApplyClient {
  private baseUrl = 'http://localhost:8005/api/v1';
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async getApplications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/applications?${query}`);
  }

  async getSettings() {
    return this.request('/auto-apply/settings');
  }

  async updateSettings(settings: any) {
    return this.request('/auto-apply/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async start() {
    return this.request('/auto-apply/start', { method: 'POST' });
  }

  async stop() {
    return this.request('/auto-apply/stop', { method: 'POST' });
  }

  async getStatus() {
    return this.request('/auto-apply/status');
  }

  async getQueueStats() {
    return this.request('/auto-apply/queue/stats');
  }
}

// Usage
const client = new AutoApplyClient('user-uuid');

// Start auto-apply
await client.start();

// Check status
const status = await client.getStatus();
console.log('Applications today:', status.applicationsToday);

// Get queue stats
const stats = await client.getQueueStats();
console.log('Active jobs:', stats.active);
```

### cURL Examples

```bash
# Get applications
curl -H "x-user-id: user-uuid" \
  http://localhost:8005/api/v1/applications

# Update settings
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-uuid" \
  -d '{"enabled":true,"resumeId":"resume-uuid","maxApplicationsPerDay":50}' \
  http://localhost:8005/api/v1/auto-apply/settings

# Start auto-apply
curl -X POST \
  -H "x-user-id: user-uuid" \
  http://localhost:8005/api/v1/auto-apply/start

# Get queue stats
curl http://localhost:8005/api/v1/auto-apply/queue/stats
```

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-08T10:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```
