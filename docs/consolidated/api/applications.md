# Auto-Apply Service API

The Auto-Apply Service handles job application tracking, automated job applications, and application analytics.

## Base Path

```
/applications
```

## Application Management

### Get All Applications

List all job applications for current user.

**Endpoint:** `GET /applications`

**Authentication:** Required (via `x-user-id` header)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: `pending`, `submitted`, `reviewing`, `interviewing`, `offered`, `rejected`, `withdrawn` |
| job_title | string | Filter by job title |
| company_name | string | Filter by company name |
| date_from | date | Filter applications from date (ISO 8601) |
| date_to | date | Filter applications to date (ISO 8601) |
| application_method | string | Filter by method: `manual`, `auto`, `platform` |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| sort_by | string | Sort field (default: `applied_at`) |
| sort_order | string | `asc` or `desc` (default: `desc`) |

**Success Response (200 OK):**
```json
{
  "applications": [
    {
      "id": "app-123",
      "user_id": "user-456",
      "job_id": "job-789",
      "job_title": "Senior Backend Engineer",
      "company_name": "Tech Corp",
      "company_logo": "https://cdn.jobpilot.com/logos/...",
      "location": "San Francisco, CA",
      "status": "interviewing",
      "application_method": "auto",
      "resume_id": "resume-123",
      "cover_letter": "Dear Hiring Manager...",
      "applied_at": "2025-12-01T10:00:00Z",
      "last_updated": "2025-12-03T14:30:00Z",
      "timeline": [
        {
          "status": "submitted",
          "date": "2025-12-01T10:00:00Z",
          "note": "Application submitted"
        },
        {
          "status": "reviewing",
          "date": "2025-12-02T09:00:00Z",
          "note": "Application under review"
        },
        {
          "status": "interviewing",
          "date": "2025-12-03T14:30:00Z",
          "note": "Phone screen scheduled"
        }
      ],
      "next_action": {
        "type": "interview",
        "description": "Phone screen with recruiter",
        "date": "2025-12-05T15:00:00Z"
      },
      "notes": "Great opportunity, aligns with career goals",
      "tags": ["high-priority", "backend", "remote"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "summary": {
    "total": 45,
    "by_status": {
      "pending": 5,
      "submitted": 15,
      "reviewing": 12,
      "interviewing": 8,
      "offered": 2,
      "rejected": 3
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET "https://api.jobpilot.com/applications?status=interviewing&page=1&limit=20" \
  -H "x-user-id: YOUR_USER_ID"
```

---

### Get Application by ID

Get detailed application information.

**Endpoint:** `GET /applications/:id`

**Authentication:** Required (via `x-user-id` header)

**Success Response (200 OK):**
```json
{
  "id": "app-123",
  "user_id": "user-456",
  "job_id": "job-789",
  "job_title": "Senior Backend Engineer",
  "company_name": "Tech Corp",
  "company_logo": "https://cdn.jobpilot.com/logos/...",
  "location": "San Francisco, CA",
  "remote_type": "hybrid",
  "salary_range": "150k - 200k USD",
  "status": "interviewing",
  "application_method": "auto",
  "resume_id": "resume-123",
  "resume_version": 3,
  "cover_letter": "Dear Hiring Manager...",
  "additional_documents": [
    {
      "type": "portfolio",
      "url": "https://cdn.jobpilot.com/docs/..."
    }
  ],
  "applied_at": "2025-12-01T10:00:00Z",
  "last_updated": "2025-12-03T14:30:00Z",
  "timeline": [
    {
      "status": "submitted",
      "date": "2025-12-01T10:00:00Z",
      "note": "Application submitted via JobPilot",
      "automated": true
    },
    {
      "status": "reviewing",
      "date": "2025-12-02T09:00:00Z",
      "note": "Application viewed by recruiter"
    },
    {
      "status": "interviewing",
      "date": "2025-12-03T14:30:00Z",
      "note": "Phone screen scheduled for Dec 5 at 3:00 PM PST",
      "metadata": {
        "interview_type": "phone",
        "interviewer": "Jane Smith - Senior Recruiter",
        "duration": "30 minutes"
      }
    }
  ],
  "contacts": [
    {
      "name": "Jane Smith",
      "role": "Senior Recruiter",
      "email": "jane.smith@techcorp.com",
      "phone": "+1234567890"
    }
  ],
  "interviews": [
    {
      "id": "int-123",
      "type": "phone",
      "scheduled_at": "2025-12-05T15:00:00Z",
      "duration": 30,
      "interviewer": "Jane Smith",
      "status": "scheduled",
      "notes": "Prepare technical questions"
    }
  ],
  "notes": "Great opportunity, aligns with career goals. Company has strong engineering culture.",
  "tags": ["high-priority", "backend", "remote"],
  "feedback": {
    "received_at": "2025-12-03T16:00:00Z",
    "content": "Strong technical background, good culture fit"
  },
  "rejection_reason": null,
  "offer_details": null
}
```

**Error Responses:**
- `404 Not Found` - Application not found or doesn't belong to user

---

### Log Manual Application

Record a job application submitted outside the platform.

**Endpoint:** `POST /applications/manual`

**Authentication:** Required (via `x-user-id` header)

**Request Body:**
```json
{
  "job_id": "job-789",
  "job_title": "Senior Backend Engineer",
  "company_name": "Tech Corp",
  "company_website": "https://techcorp.com",
  "location": "San Francisco, CA",
  "job_url": "https://techcorp.com/careers/123",
  "application_method": "manual",
  "resume_used": "resume-123",
  "cover_letter": "Dear Hiring Manager...",
  "applied_at": "2025-12-01T10:00:00Z",
  "status": "submitted",
  "notes": "Applied directly through company website",
  "tags": ["high-priority"]
}
```

**Success Response (201 Created):**
```json
{
  "id": "app-124",
  "job_title": "Senior Backend Engineer",
  "company_name": "Tech Corp",
  "status": "submitted",
  "applied_at": "2025-12-01T10:00:00Z",
  "created_at": "2025-12-04T11:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST https://api.jobpilot.com/applications/manual \
  -H "x-user-id: YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Backend Engineer",
    "company_name": "Tech Corp",
    "status": "submitted",
    "notes": "Applied through company website"
  }'
```

---

### Update Application

Update application details.

**Endpoint:** `PUT /applications/:id`

**Authentication:** Required (via `x-user-id` header)

**Request Body:**
```json
{
  "status": "interviewing",
  "notes": "Updated notes after phone screen",
  "tags": ["high-priority", "backend"],
  "timeline_entry": {
    "status": "interviewing",
    "note": "Phone screen completed, moving to technical round",
    "date": "2025-12-05T16:00:00Z"
  },
  "next_action": {
    "type": "interview",
    "description": "Technical interview with team",
    "date": "2025-12-08T14:00:00Z"
  }
}
```

**Success Response (200 OK):**
```json
{
  "id": "app-123",
  "status": "interviewing",
  "updated_at": "2025-12-05T16:30:00Z",
  "message": "Application updated successfully"
}
```

---

### Update Application Status

Update only the application status.

**Endpoint:** `PUT /applications/:id/status`

**Authentication:** Required (via `x-user-id` header)

**Request Body:**
```json
{
  "status": "offered",
  "note": "Received offer letter",
  "metadata": {
    "salary": 180000,
    "start_date": "2026-01-15",
    "equity": "0.1%"
  }
}
```

**Status values:**
- `pending` - Application prepared but not submitted
- `submitted` - Application submitted
- `reviewing` - Under review by company
- `interviewing` - In interview process
- `offered` - Offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn by user
- `accepted` - Offer accepted
- `declined` - Offer declined

**Success Response (200 OK):**
```json
{
  "id": "app-123",
  "status": "offered",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

---

### Delete Application

Remove application record.

**Endpoint:** `DELETE /applications/:id`

**Authentication:** Required (via `x-user-id` header)

**Success Response (200 OK):**
```json
{
  "message": "Application deleted successfully"
}
```

---

## Application Analytics

### Get Application Analytics

Get comprehensive application analytics and statistics.

**Endpoint:** `GET /applications/analytics`

**Authentication:** Required (via `x-user-id` header)

**Success Response (200 OK):**
```json
{
  "overview": {
    "total_applications": 150,
    "active_applications": 35,
    "applications_this_month": 23,
    "response_rate": 65,
    "interview_rate": 22,
    "offer_rate": 8
  },
  "by_status": {
    "pending": 5,
    "submitted": 45,
    "reviewing": 30,
    "interviewing": 12,
    "offered": 3,
    "rejected": 50,
    "withdrawn": 5
  },
  "by_method": {
    "auto": 80,
    "manual": 60,
    "platform": 10
  },
  "timeline": [
    {
      "date": "2025-12-01",
      "applications": 5,
      "responses": 3,
      "interviews": 1
    },
    {
      "date": "2025-12-02",
      "applications": 8,
      "responses": 5,
      "interviews": 2
    }
  ],
  "conversion_funnel": {
    "applied": 150,
    "reviewed": 98,
    "interviewed": 33,
    "offered": 12,
    "accepted": 1
  },
  "average_response_time": {
    "days": 5,
    "hours": 120
  },
  "top_companies": [
    {
      "name": "Tech Corp",
      "applications": 5,
      "interviews": 2,
      "offers": 1
    }
  ],
  "top_positions": [
    {
      "title": "Backend Engineer",
      "applications": 25,
      "interviews": 8
    }
  ],
  "success_metrics": {
    "application_to_interview": 22,
    "interview_to_offer": 36,
    "overall_success_rate": 8
  },
  "recommendations": [
    "Your response rate is above average",
    "Consider following up on applications after 1 week",
    "Update resume to improve ATS score"
  ]
}
```

---

## Automated Applications

### Start Auto-Apply Campaign

Initiate automated job application campaign.

**Endpoint:** `POST /applications/auto-apply/start`

**Authentication:** Required (via `x-user-id` header)

**Request Body:**
```json
{
  "campaign_name": "Backend Engineer SF Bay Area",
  "search_criteria": {
    "keywords": "backend engineer",
    "location": "San Francisco Bay Area",
    "remote_type": "hybrid",
    "salary_min": 150000,
    "experience_level": "senior"
  },
  "resume_id": "resume-123",
  "cover_letter_template": "Dear Hiring Manager...",
  "daily_limit": 10,
  "filters": {
    "min_match_score": 80,
    "exclude_companies": ["Company A", "Company B"],
    "required_keywords": ["Node.js", "PostgreSQL"]
  },
  "auto_follow_up": true,
  "follow_up_days": 7
}
```

**Success Response (201 Created):**
```json
{
  "campaign_id": "campaign-123",
  "name": "Backend Engineer SF Bay Area",
  "status": "active",
  "estimated_matches": 45,
  "daily_limit": 10,
  "created_at": "2025-12-04T11:00:00Z"
}
```

---

### Get Auto-Apply Status

Check status of auto-apply campaign.

**Endpoint:** `GET /applications/auto-apply/:campaign_id/status`

**Authentication:** Required (via `x-user-id` header)

**Success Response (200 OK):**
```json
{
  "campaign_id": "campaign-123",
  "name": "Backend Engineer SF Bay Area",
  "status": "active",
  "statistics": {
    "jobs_matched": 45,
    "applications_sent": 28,
    "applications_pending": 17,
    "daily_limit": 10,
    "remaining_today": 3
  },
  "recent_applications": [
    {
      "job_id": "job-789",
      "job_title": "Senior Backend Engineer",
      "company": "Tech Corp",
      "applied_at": "2025-12-04T10:00:00Z",
      "status": "submitted"
    }
  ],
  "created_at": "2025-12-01T08:00:00Z",
  "last_run": "2025-12-04T10:00:00Z"
}
```

---

### Pause/Resume Auto-Apply

Control auto-apply campaign execution.

**Endpoint:** `POST /applications/auto-apply/:campaign_id/pause`
**Endpoint:** `POST /applications/auto-apply/:campaign_id/resume`

**Authentication:** Required (via `x-user-id` header)

**Success Response (200 OK):**
```json
{
  "campaign_id": "campaign-123",
  "status": "paused",
  "message": "Campaign paused successfully"
}
```

---

### Stop Auto-Apply

Stop and delete auto-apply campaign.

**Endpoint:** `DELETE /applications/auto-apply/:campaign_id`

**Authentication:** Required (via `x-user-id` header)

**Success Response (200 OK):**
```json
{
  "message": "Campaign stopped and deleted successfully",
  "final_stats": {
    "applications_sent": 28,
    "success_rate": 65
  }
}
```

---

## Application Filters & Search

### Advanced Application Search

Search through applications with complex filters.

**Endpoint:** `GET /applications/search`

**Query Parameters:**
- All parameters from "Get All Applications"
- `keywords`: Search in job title, company, notes
- `has_interview`: Boolean - applications with scheduled interviews
- `has_offer`: Boolean - applications with offers
- `salary_min`: Minimum salary from job
- `salary_max`: Maximum salary from job

**Success Response:** Same as "Get All Applications"

---

## Application Templates

### Save Application Template

Save application materials as reusable template.

**Endpoint:** `POST /applications/templates`

**Request Body:**
```json
{
  "name": "Backend Engineer Template",
  "resume_id": "resume-123",
  "cover_letter": "Template cover letter...",
  "questions_answers": {
    "Why do you want to work here?": "Template answer...",
    "What's your expected salary?": "150k-180k"
  }
}
```

---

## Rate Limiting

Application service endpoints have the following rate limits:

| Endpoint | Free Tier | Pro Tier |
|----------|-----------|----------|
| Get Applications | 30/min | 100/min |
| Create Application | 20/min | 100/min |
| Update Application | 30/min | 100/min |
| Auto-Apply | 10/day | 100/day |
| Analytics | 10/min | 50/min |

---

## Webhooks

Subscribe to application events via webhooks:

### Available Events

- `application.created` - New application logged
- `application.updated` - Application status changed
- `application.interview_scheduled` - Interview scheduled
- `application.offer_received` - Offer received
- `application.rejected` - Application rejected

Configure webhooks in user settings to receive real-time notifications.

---

## Error Codes

| Code | Description |
|------|-------------|
| APP001 | Application not found |
| APP002 | Invalid application status |
| APP003 | Application already exists for this job |
| APP004 | Auto-apply limit reached |
| APP005 | Invalid campaign configuration |
| APP006 | Campaign not found |
| APP007 | Resume not found for application |
| APP008 | Cannot update completed application |
| APP009 | Invalid date format |
| APP010 | Missing required fields |

See [Error Codes](./errors.md) for complete error documentation.
