# Job Service API

The Job Service handles job search, recommendations, saved jobs, job alerts, and company information.

## Base Paths

```
/jobs       - Job search and management
/companies  - Company information
/alerts     - Job alerts
```

## Job Search & Management

### Search Jobs

Search for jobs with advanced filters.

**Endpoint:** `GET /jobs`

**Authentication:** Optional (required for personalized results)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| keywords | string | Search keywords (title, skills, company) |
| location | string | Location (city, state, or country) |
| remote_type | enum | `onsite`, `remote`, `hybrid` |
| salary_min | number | Minimum salary |
| salary_max | number | Maximum salary |
| experience_level | enum | `entry`, `junior`, `mid`, `senior`, `lead`, `executive` |
| employment_type | enum | `full-time`, `part-time`, `contract`, `internship`, `temporary` |
| skills | string[] | Required skills (comma-separated) |
| company_id | string | Filter by company ID |
| posted_within_days | number | Posted within N days |
| is_featured | boolean | Only featured jobs |
| is_verified | boolean | Only verified jobs |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| sort_by | string | Sort field (default: `posted_at`) |
| sort_order | string | `asc` or `desc` (default: `desc`) |

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "job-123",
      "external_id": "ext-456",
      "source": "linkedin",
      "title": "Senior Backend Engineer",
      "company_id": "comp-789",
      "company_name": "Tech Corp",
      "company_logo_url": "https://cdn.jobpilot.com/logos/...",
      "location": "San Francisco, CA",
      "city": "San Francisco",
      "state": "CA",
      "country": "USA",
      "remote_type": "hybrid",
      "salary_min": 150000,
      "salary_max": 200000,
      "salary_currency": "USD",
      "salary_period": "yearly",
      "description": "We are looking for...",
      "requirements": [
        "5+ years backend experience",
        "Strong Node.js skills"
      ],
      "benefits": [
        "Health insurance",
        "401k matching",
        "Remote work"
      ],
      "skills": ["Node.js", "PostgreSQL", "Redis", "AWS"],
      "experience_level": "senior",
      "experience_years_min": 5,
      "experience_years_max": 10,
      "employment_type": "full-time",
      "posted_at": "2025-12-01T10:00:00Z",
      "expires_at": "2026-01-01T10:00:00Z",
      "application_url": "https://techcorp.com/apply/123",
      "ats_platform": "greenhouse",
      "tags": ["backend", "senior", "remote-friendly"],
      "view_count": 456,
      "application_count": 23,
      "save_count": 89,
      "is_active": true,
      "is_featured": true,
      "is_verified": true,
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-01T10:00:00Z",
      "match_score": 92,
      "saved": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "facets": {
    "remote_types": [
      { "key": "remote", "count": 45 },
      { "key": "hybrid", "count": 60 },
      { "key": "onsite", "count": 45 }
    ],
    "experience_levels": [
      { "key": "senior", "count": 50 },
      { "key": "mid", "count": 70 },
      { "key": "junior", "count": 30 }
    ],
    "employment_types": [
      { "key": "full-time", "count": 120 },
      { "key": "contract", "count": 30 }
    ],
    "top_skills": [
      { "key": "JavaScript", "count": 80 },
      { "key": "Python", "count": 60 },
      { "key": "React", "count": 55 }
    ],
    "top_locations": [
      { "key": "San Francisco, CA", "count": 40 },
      { "key": "New York, NY", "count": 35 },
      { "key": "Remote", "count": 45 }
    ],
    "salary_ranges": [
      { "key": "100k-150k", "count": 50 },
      { "key": "150k-200k", "count": 60 },
      { "key": "200k+", "count": 40 }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X GET "https://api.jobpilot.com/jobs?keywords=backend+engineer&location=San+Francisco&remote_type=hybrid&salary_min=150000&experience_level=senior&skills=Node.js,PostgreSQL&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Get Job by ID

Get detailed job information.

**Endpoint:** `GET /jobs/:id`

**Authentication:** Optional

**Success Response (200 OK):**
```json
{
  "id": "job-123",
  "external_id": "ext-456",
  "source": "linkedin",
  "title": "Senior Backend Engineer",
  "company_id": "comp-789",
  "company_name": "Tech Corp",
  "company_logo_url": "https://cdn.jobpilot.com/logos/...",
  "location": "San Francisco, CA",
  "remote_type": "hybrid",
  "salary_min": 150000,
  "salary_max": 200000,
  "salary_currency": "USD",
  "description": "Full job description...",
  "requirements": ["5+ years experience"],
  "benefits": ["Health insurance"],
  "skills": ["Node.js", "PostgreSQL"],
  "experience_level": "senior",
  "employment_type": "full-time",
  "posted_at": "2025-12-01T10:00:00Z",
  "application_url": "https://techcorp.com/apply/123",
  "is_active": true,
  "match_score": 92,
  "saved": true
}
```

**Error Responses:**
- `404 Not Found` - Job not found

---

### Get Recommended Jobs

Get AI-recommended jobs based on user profile.

**Endpoint:** `GET /jobs/recommended`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "job-123",
      "title": "Senior Backend Engineer",
      "company_name": "Tech Corp",
      "location": "San Francisco, CA",
      "salary_min": 150000,
      "salary_max": 200000,
      "match_score": 92,
      "match_reasons": [
        "Skills match: Node.js, PostgreSQL",
        "Experience level aligns",
        "Location preference match",
        "Salary range matches expectations"
      ],
      "posted_at": "2025-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**cURL Example:**
```bash
curl -X GET "https://api.jobpilot.com/jobs/recommended?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Get Saved Jobs

Get user's saved jobs.

**Endpoint:** `GET /jobs/saved`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "job-123",
      "title": "Senior Backend Engineer",
      "company_name": "Tech Corp",
      "location": "San Francisco, CA",
      "saved_at": "2025-12-01T15:30:00Z",
      "notes": "Great match for my skills",
      "tags": ["high-priority", "backend"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

### Save Job

Add job to saved list.

**Endpoint:** `POST /jobs/:id/save`

**Authentication:** Required

**Request Body:**
```json
{
  "notes": "Great match for my skills",
  "tags": ["high-priority", "backend"]
}
```

**Success Response (201 Created):**
```json
{
  "message": "Job saved successfully",
  "saved_job": {
    "job_id": "job-123",
    "saved_at": "2025-12-04T10:30:00Z",
    "notes": "Great match for my skills",
    "tags": ["high-priority", "backend"]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Job already saved
- `404 Not Found` - Job not found

---

### Update Saved Job

Update saved job details.

**Endpoint:** `PUT /jobs/:id/save`

**Authentication:** Required

**Request Body:**
```json
{
  "notes": "Updated notes",
  "tags": ["high-priority"]
}
```

**Success Response (200 OK):**
```json
{
  "message": "Saved job updated successfully"
}
```

---

### Unsave Job

Remove job from saved list.

**Endpoint:** `DELETE /jobs/:id/save`

**Authentication:** Required

**Success Response (204 No Content)**

**Error Responses:**
- `404 Not Found` - Saved job not found

---

### Get Match Score

Get match score between job and user profile.

**Endpoint:** `GET /jobs/:id/match-score`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "match_score": 92,
  "reasons": [
    "Strong match in required skills (Node.js, PostgreSQL)",
    "Experience level aligns well (5+ years)",
    "Location preference matches",
    "Salary range meets expectations",
    "Remote work option available"
  ],
  "breakdown": {
    "skills": 95,
    "experience": 90,
    "location": 100,
    "salary": 85,
    "work_style": 90
  },
  "missing_requirements": [
    "Python experience preferred but not required"
  ],
  "recommendations": [
    "Highlight Node.js projects in your resume",
    "Emphasize distributed systems experience"
  ]
}
```

---

### Get Similar Jobs

Get jobs similar to a specific job.

**Endpoint:** `GET /jobs/:id/similar`

**Query Parameters:**
- `limit` (optional): Number of jobs to return (default: 10)

**Authentication:** Optional

**Success Response (200 OK):**
```json
[
  {
    "id": "job-124",
    "title": "Backend Engineer",
    "company_name": "Another Corp",
    "location": "San Francisco, CA",
    "similarity_score": 88,
    "match_factors": [
      "Similar skills required",
      "Same experience level",
      "Comparable salary range"
    ]
  }
]
```

---

### Track Job Application

Track that user applied to a job externally.

**Endpoint:** `POST /jobs/:id/track-application`

**Authentication:** Required

**Success Response (204 No Content)**

This endpoint tracks that the user applied to a job through an external platform, useful for analytics and recommendations.

---

## Job Alerts

### Create Job Alert

Create a new job alert with specific criteria.

**Endpoint:** `POST /alerts`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Senior Backend Roles in SF",
  "keywords": "backend engineer",
  "location": "San Francisco, CA",
  "remote_type": "hybrid",
  "salary_min": 150000,
  "experience_level": "senior",
  "employment_type": "full-time",
  "skills": ["Node.js", "PostgreSQL"],
  "frequency": "daily",
  "isActive": true
}
```

**Frequency options:** `realtime`, `daily`, `weekly`

**Success Response (201 Created):**
```json
{
  "id": "alert-123",
  "name": "Senior Backend Roles in SF",
  "keywords": "backend engineer",
  "location": "San Francisco, CA",
  "frequency": "daily",
  "isActive": true,
  "created_at": "2025-12-04T10:30:00Z"
}
```

---

### Get User Alerts

List all job alerts for current user.

**Endpoint:** `GET /alerts`

**Authentication:** Required

**Success Response (200 OK):**
```json
[
  {
    "id": "alert-123",
    "name": "Senior Backend Roles in SF",
    "keywords": "backend engineer",
    "location": "San Francisco, CA",
    "frequency": "daily",
    "isActive": true,
    "matchCount": 23,
    "lastTriggered": "2025-12-04T08:00:00Z",
    "created_at": "2025-11-15T10:30:00Z"
  }
]
```

---

### Get Alert by ID

Get specific alert details.

**Endpoint:** `GET /alerts/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "alert-123",
  "name": "Senior Backend Roles in SF",
  "keywords": "backend engineer",
  "location": "San Francisco, CA",
  "remote_type": "hybrid",
  "salary_min": 150000,
  "experience_level": "senior",
  "skills": ["Node.js", "PostgreSQL"],
  "frequency": "daily",
  "isActive": true,
  "matchCount": 23,
  "lastTriggered": "2025-12-04T08:00:00Z",
  "created_at": "2025-11-15T10:30:00Z"
}
```

---

### Update Alert

Update job alert criteria.

**Endpoint:** `PUT /alerts/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated alert name",
  "frequency": "weekly",
  "isActive": false
}
```

**Success Response (200 OK):**
```json
{
  "id": "alert-123",
  "message": "Alert updated successfully",
  "updated_at": "2025-12-04T10:30:00Z"
}
```

---

### Delete Alert

Delete job alert.

**Endpoint:** `DELETE /alerts/:id`

**Authentication:** Required

**Success Response (204 No Content)**

---

### Test Alert

Preview jobs that match alert criteria.

**Endpoint:** `GET /alerts/:id/test`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "matchCount": 23,
  "preview": [
    {
      "id": "job-123",
      "title": "Senior Backend Engineer",
      "company_name": "Tech Corp",
      "location": "San Francisco, CA",
      "posted_at": "2025-12-04T08:00:00Z"
    }
  ],
  "message": "This alert would currently match 23 jobs"
}
```

---

## Company Information

### Search Companies

Search companies by name or industry.

**Endpoint:** `GET /companies/search`

**Query Parameters:**
- `query` (required): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "comp-123",
      "name": "Tech Corp",
      "logo_url": "https://cdn.jobpilot.com/logos/...",
      "website": "https://techcorp.com",
      "industry": "Technology",
      "size": "1000-5000",
      "location": "San Francisco, CA",
      "description": "Leading technology company...",
      "rating": 4.5,
      "reviewCount": 234
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**cURL Example:**
```bash
curl -X GET "https://api.jobpilot.com/companies/search?query=tech&page=1&limit=20"
```

---

### Get Company by ID

Get detailed company information.

**Endpoint:** `GET /companies/:id`

**Success Response (200 OK):**
```json
{
  "id": "comp-123",
  "name": "Tech Corp",
  "logo_url": "https://cdn.jobpilot.com/logos/...",
  "website": "https://techcorp.com",
  "industry": "Technology",
  "size": "1000-5000",
  "founded": 2010,
  "headquarters": "San Francisco, CA",
  "description": "Leading technology company...",
  "culture": "Innovation-driven, collaborative...",
  "benefits": [
    "Health insurance",
    "401k matching",
    "Remote work options"
  ],
  "techStack": ["Node.js", "React", "PostgreSQL", "AWS"],
  "socialMedia": {
    "linkedin": "https://linkedin.com/company/techcorp",
    "twitter": "https://twitter.com/techcorp"
  },
  "rating": 4.5,
  "reviewCount": 234,
  "activeJobCount": 45
}
```

**Error Responses:**
- `404 Not Found` - Company not found

---

### Get Company Jobs

Get all jobs from a specific company.

**Endpoint:** `GET /companies/:id/jobs`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "job-123",
      "title": "Senior Backend Engineer",
      "location": "San Francisco, CA",
      "remote_type": "hybrid",
      "employment_type": "full-time",
      "posted_at": "2025-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### Get Company Reviews

Get reviews and ratings for a company.

**Endpoint:** `GET /companies/:id/reviews`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort` (optional): Sort order - `recent`, `helpful`, `rating` (default: `recent`)

**Success Response (200 OK):**
```json
{
  "summary": {
    "overall_rating": 4.5,
    "total_reviews": 234,
    "rating_breakdown": {
      "5": 120,
      "4": 80,
      "3": 20,
      "2": 10,
      "1": 4
    },
    "categories": {
      "work_life_balance": 4.3,
      "compensation": 4.7,
      "career_growth": 4.2,
      "management": 4.0,
      "culture": 4.6
    }
  },
  "reviews": [
    {
      "id": "rev-123",
      "rating": 5,
      "title": "Great place to work",
      "pros": "Excellent benefits, great culture",
      "cons": "Fast-paced environment",
      "position": "Software Engineer",
      "employment_type": "full-time",
      "tenure": "2 years",
      "date": "2025-11-15T00:00:00Z",
      "helpful_count": 23,
      "verified": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 234,
    "total_pages": 12
  }
}
```

---

## Rate Limiting

Job service endpoints have the following rate limits:

| Endpoint | Free Tier | Pro Tier |
|----------|-----------|----------|
| Search Jobs | 30/min | 100/min |
| Get Job Details | 60/min | 200/min |
| Saved Jobs | 20/min | 100/min |
| Recommendations | 10/min | 50/min |
| Alerts | 10/min | 50/min |

## Error Codes

| Code | Description |
|------|-------------|
| JOB001 | Job not found |
| JOB002 | Invalid search parameters |
| JOB003 | Job already saved |
| JOB004 | Saved job not found |
| JOB005 | Alert not found |
| JOB006 | Maximum alerts limit reached |
| JOB007 | Company not found |
| JOB008 | Invalid job ID format |
| JOB009 | Job expired or inactive |
| JOB010 | Search query too complex |

See [Error Codes](./errors.md) for complete error documentation.
