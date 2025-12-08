# Auto-Apply Service API Documentation

The Auto-Apply Service manages job applications, both manual and automated, tracking their status and providing analytics.

## Base URL

```
http://localhost:3006/api/applications
```

## Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header.

```http
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Applications

Retrieve all applications for the authenticated user with optional filtering.

```http
GET /applications
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | enum | No | Filter by application status |
| company_name | string | No | Filter by company name |
| ats_platform | string | No | Filter by ATS platform |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20, max: 100) |
| sort_by | string | No | Field to sort by (default: created_at) |
| sort_order | string | No | ASC or DESC (default: DESC) |

**Status Values:**
- `pending` - Application submitted, awaiting response
- `in_review` - Under review by employer
- `interview_scheduled` - Interview scheduled
- `offer_received` - Job offer received
- `accepted` - Offer accepted
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn by user

**Example Request:**

```http
GET /applications?status=pending&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "job_id": "550e8400-e29b-41d4-a716-446655440002",
      "resume_id": "550e8400-e29b-41d4-a716-446655440003",
      "cover_letter_id": "550e8400-e29b-41d4-a716-446655440004",
      "status": "pending",
      "match_score": 85.5,
      "auto_applied": true,
      "company_name": "Tech Corp Inc.",
      "position_title": "Senior Software Engineer",
      "application_url": "https://jobs.techcorp.com/apply/12345",
      "ats_platform": "Greenhouse",
      "submitted_at": "2024-01-15T10:30:00.000Z",
      "response_received_at": null,
      "notes": "Great company culture",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Rate Limit:** 100 requests/minute

---

### 2. Get Application by ID

Retrieve a specific application by ID.

```http
GET /applications/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Application ID |

**Example Request:**

```http
GET /applications/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "job_id": "550e8400-e29b-41d4-a716-446655440002",
  "resume_id": "550e8400-e29b-41d4-a716-446655440003",
  "cover_letter_id": "550e8400-e29b-41d4-a716-446655440004",
  "status": "pending",
  "match_score": 85.5,
  "auto_applied": true,
  "company_name": "Tech Corp Inc.",
  "position_title": "Senior Software Engineer",
  "application_url": "https://jobs.techcorp.com/apply/12345",
  "ats_platform": "Greenhouse",
  "form_responses": {
    "availability": "Immediately",
    "salary_expectation": "$120,000",
    "willing_to_relocate": true
  },
  "submitted_at": "2024-01-15T10:30:00.000Z",
  "response_received_at": null,
  "notes": "Great company culture",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Application not found
- `403 Forbidden` - Application belongs to another user

**Rate Limit:** 100 requests/minute

---

### 3. Log Manual Application

Create a new manual application record.

```http
POST /applications/manual
```

**Request Body:**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440002",
  "resume_id": "550e8400-e29b-41d4-a716-446655440003",
  "cover_letter_id": "550e8400-e29b-41d4-a716-446655440004",
  "match_score": 85.5,
  "company_name": "Tech Corp Inc.",
  "position_title": "Senior Software Engineer",
  "application_url": "https://jobs.techcorp.com/apply/12345",
  "ats_platform": "Greenhouse",
  "notes": "Applied via company website",
  "form_responses": {
    "availability": "Immediately",
    "salary_expectation": "$120,000"
  }
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| job_id | uuid | Yes | Job ID being applied to |
| resume_id | uuid | No | Resume used for application |
| cover_letter_id | uuid | No | Cover letter used for application |
| match_score | number | No | Match score (0-100) |
| auto_applied | boolean | No | Whether auto-applied (default: false) |
| company_name | string | No | Company name |
| position_title | string | No | Position title |
| application_url | string | No | Application URL |
| ats_platform | string | No | ATS platform name |
| notes | string | No | Additional notes |
| form_responses | object | No | Form responses object |

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "job_id": "550e8400-e29b-41d4-a716-446655440002",
  "status": "pending",
  "auto_applied": false,
  "created_at": "2024-01-15T10:30:00.000Z",
  "message": "Application logged successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request data
- `409 Conflict` - Application already exists for this job

**Rate Limit:** 50 requests/minute

---

### 4. Update Application

Update an existing application.

```http
PUT /applications/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Application ID |

**Request Body:**

```json
{
  "status": "interview_scheduled",
  "notes": "Phone interview scheduled for next week",
  "response_received_at": "2024-01-16T14:00:00.000Z"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "interview_scheduled",
  "notes": "Phone interview scheduled for next week",
  "response_received_at": "2024-01-16T14:00:00.000Z",
  "updated_at": "2024-01-15T15:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request data
- `404 Not Found` - Application not found
- `403 Forbidden` - Cannot modify another user's application

**Rate Limit:** 100 requests/minute

---

### 5. Update Application Status

Update only the status of an application.

```http
PUT /applications/:id/status
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Application ID |

**Request Body:**

```json
{
  "status": "rejected",
  "notes": "Position filled"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "rejected",
  "notes": "Position filled",
  "updated_at": "2024-01-20T10:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid status value
- `404 Not Found` - Application not found

**Rate Limit:** 100 requests/minute

---

### 6. Get Application Analytics

Get analytics for user's applications.

```http
GET /applications/analytics
```

**Example Request:**

```http
GET /applications/analytics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "total_applications": 45,
  "by_status": {
    "pending": 15,
    "in_review": 10,
    "interview_scheduled": 5,
    "offer_received": 2,
    "accepted": 1,
    "rejected": 10,
    "withdrawn": 2
  },
  "auto_applied": 30,
  "manual_applied": 15,
  "average_match_score": 78.5,
  "success_rate": 6.7,
  "by_month": [
    {
      "month": "2024-01",
      "count": 15
    },
    {
      "month": "2024-02",
      "count": 20
    }
  ],
  "top_companies": [
    {
      "company_name": "Tech Corp Inc.",
      "count": 5
    }
  ],
  "by_ats_platform": {
    "Greenhouse": 15,
    "Lever": 10,
    "Workday": 8,
    "Other": 12
  }
}
```

**Rate Limit:** 100 requests/minute

---

### 7. Delete Application

Delete an application record.

```http
DELETE /applications/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Application ID |

**Response (200 OK):**

```json
{
  "message": "Application deleted successfully"
}
```

**Error Responses:**

- `404 Not Found` - Application not found
- `403 Forbidden` - Cannot delete another user's application

**Rate Limit:** 50 requests/minute

---

## Data Models

### Application

```typescript
interface Application {
  id: string;                          // UUID
  user_id: string;                     // UUID
  job_id: string;                      // UUID
  resume_id?: string;                  // UUID (optional)
  cover_letter_id?: string;            // UUID (optional)
  status: ApplicationStatus;           // Enum
  match_score?: number;                // 0-100
  auto_applied: boolean;               // Default: false
  company_name?: string;
  position_title?: string;
  application_url?: string;
  ats_platform?: string;
  form_responses?: Record<string, any>;
  submitted_at: Date;
  response_received_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

enum ApplicationStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  OFFER_RECEIVED = 'offer_received',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| APPLICATION_NOT_FOUND | 404 | Application not found |
| APPLICATION_EXISTS | 409 | Application already exists for this job |
| INVALID_STATUS | 400 | Invalid application status |
| UNAUTHORIZED_ACCESS | 403 | Cannot access another user's application |
| VALIDATION_ERROR | 400 | Request validation failed |

## Examples

### Complete Application Flow

1. **Create Application:**
```bash
curl -X POST http://localhost:3006/api/applications/manual \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "550e8400-e29b-41d4-a716-446655440002",
    "resume_id": "550e8400-e29b-41d4-a716-446655440003",
    "company_name": "Tech Corp Inc.",
    "position_title": "Senior Software Engineer"
  }'
```

2. **Update Status to Interview:**
```bash
curl -X PUT http://localhost:3006/api/applications/<id>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "interview_scheduled",
    "notes": "Interview on Friday at 2pm"
  }'
```

3. **Check Analytics:**
```bash
curl -X GET http://localhost:3006/api/applications/analytics \
  -H "Authorization: Bearer <token>"
```

## Best Practices

1. **Always include job_id** when creating applications
2. **Update status regularly** to track application progress
3. **Use match_score** to prioritize applications
4. **Add notes** for important updates or reminders
5. **Track form_responses** for custom application questions
6. **Monitor analytics** to optimize application strategy

## Webhooks

Subscribe to application events:

- `application.created` - New application created
- `application.status_changed` - Status updated
- `application.response_received` - Response received from employer

## Notes

- User ID is extracted from JWT token, not from request body
- Applications are soft-deleted and can be recovered within 30 days
- Auto-applied applications are created automatically by the system
- Match scores are calculated by the AI service
