# JobPilot AI Platform - API Reference

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [Common Patterns](#common-patterns)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Service APIs](#service-apis)
  - [Auth Service](#auth-service)
  - [User Service](#user-service)
  - [Resume Service](#resume-service)
  - [Job Service](#job-service)
  - [Auto-Apply Service](#auto-apply-service)
  - [Analytics Service](#analytics-service)
  - [Notification Service](#notification-service)
  - [AI Service](#ai-service)

## Overview

The JobPilot AI Platform provides a comprehensive RESTful API for managing job applications, resumes, user profiles, and AI-powered features. All APIs follow consistent patterns and return standardized responses.

### API Version

Current Version: `v1`

All endpoints are versioned and prefixed with `/api/v1/`

## Authentication

### Authentication Methods

1. **JWT Bearer Token** (Primary method)
2. **API Key** (Service-to-service communication)
3. **OAuth 2.0** (Social login)

### Using JWT Tokens

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-access-token>
```

### Token Lifecycle

- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- Refresh access tokens using the `/auth/refresh` endpoint before expiration

### Example Authentication Flow

```bash
# 1. Login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

# Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}

# 2. Use access token for authenticated requests
curl -X GET http://localhost:8002/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Base URLs

### Development
- **API Gateway**: `http://localhost:3000/api`
- **Auth Service**: `http://localhost:8001/api/v1`
- **User Service**: `http://localhost:8002/api/v1`
- **Resume Service**: `http://localhost:8003/api/v1`
- **Job Service**: `http://localhost:8004/api/v1`
- **Auto-Apply Service**: `http://localhost:8005/api/v1`
- **Analytics Service**: `http://localhost:8006/api/v1`
- **Notification Service**: `http://localhost:8007/api/v1`
- **AI Service**: `http://localhost:8000/api/v1`

### Production
- **API Gateway**: `https://api.jobpilot.ai`

## Common Patterns

### Request Format

All requests should include:
- `Content-Type: application/json` header for POST/PATCH/PUT requests
- `Authorization: Bearer <token>` header for authenticated endpoints

### Response Format

All responses follow a consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error context
    }
  },
  "statusCode": 400
}
```

### Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtering

Use query parameters for filtering:
```
GET /api/v1/jobs?location=Remote&type=Full-time&minSalary=80000
```

## Rate Limiting

Rate limits are applied per user/IP address:

| Tier | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| Free | 60 | 1,000 | 10,000 |
| Pro | 300 | 10,000 | 100,000 |
| Enterprise | Custom | Custom | Custom |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

## Error Handling

### HTTP Status Codes

- `200 OK` - Successful GET request
- `201 Created` - Successful POST request creating a resource
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

### Common Error Codes

- `UNAUTHORIZED` - Invalid or missing authentication token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Internal server error

---

## Service APIs

## Auth Service

Base URL: `http://localhost:8001/api/v1`

### Register User

Create a new user account.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com"
  },
  "message": "Registration successful. Please verify your email."
}
```

### Login

Authenticate a user and receive tokens.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Refresh Token

Get a new access token using refresh token.

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

Invalidate the current session.

```http
POST /auth/logout
Authorization: Bearer <access-token>
```

### Forgot Password

Request password reset email.

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Reset Password

Reset password using token from email.

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

### Verify Email

Verify email address using token.

```http
GET /auth/verify-email?token=<verification-token>
```

### OAuth Login

Authenticate using OAuth provider.

```http
GET /auth/oauth/{provider}
```

Supported providers: `google`, `linkedin`, `github`

---

## User Service

Base URL: `http://localhost:8002/api/v1`

### Get Current User

Get authenticated user's profile.

```http
GET /users/me
Authorization: Bearer <access-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "title": "Software Engineer",
    "bio": "Experienced software engineer...",
    "skills": ["JavaScript", "TypeScript", "Node.js"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile

Update user profile information.

```http
PATCH /users/:id
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "title": "Senior Software Engineer",
  "bio": "Experienced software engineer with 5+ years..."
}
```

### Add Skills

Add skills to user profile.

```http
POST /users/:id/skills
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "skills": ["React", "Node.js", "PostgreSQL"]
}
```

### Get User Preferences

Get user preferences and settings.

```http
GET /users/:id/preferences
Authorization: Bearer <access-token>
```

### Update User Preferences

Update user preferences.

```http
PATCH /users/:id/preferences
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "jobPreferences": {
    "locations": ["San Francisco", "Remote"],
    "jobTypes": ["Full-time", "Contract"],
    "minSalary": 100000,
    "remote": true
  },
  "notifications": {
    "email": true,
    "push": true,
    "jobAlerts": true
  }
}
```

---

## Resume Service

Base URL: `http://localhost:8003/api/v1`

### Create Resume

Create a new resume.

```http
POST /resumes
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "title": "Software Engineer Resume",
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "San Francisco, CA"
  },
  "summary": "Experienced software engineer...",
  "experience": [...],
  "education": [...],
  "skills": [...]
}
```

### List Resumes

Get all resumes for the authenticated user.

```http
GET /resumes
Authorization: Bearer <access-token>
```

### Get Resume

Get a specific resume by ID.

```http
GET /resumes/:id
Authorization: Bearer <access-token>
```

### Update Resume

Update an existing resume.

```http
PATCH /resumes/:id
Authorization: Bearer <access-token>
```

### Delete Resume

Delete a resume.

```http
DELETE /resumes/:id
Authorization: Bearer <access-token>
```

### Parse Resume

Upload and parse a resume file.

```http
POST /resumes/parse
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - Resume file (PDF, DOCX)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "personalInfo": {...},
    "summary": "...",
    "experience": [...],
    "education": [...],
    "skills": [...]
  }
}
```

### Optimize Resume

Get AI-powered optimization suggestions.

```http
POST /resumes/:id/optimize
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "jobDescription": "We are looking for a senior software engineer..."
}
```

### Export Resume

Export resume in various formats.

```http
GET /resumes/:id/export?format=pdf
Authorization: Bearer <access-token>
```

Query parameters:
- `format` - `pdf`, `docx`, `txt`, `json`

---

## Job Service

Base URL: `http://localhost:8004/api/v1`

### Search Jobs

Search for jobs with filters.

```http
GET /jobs?keyword=software&location=Remote&type=Full-time
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `keyword` - Job title or keywords
- `location` - Job location
- `type` - Job type (Full-time, Part-time, Contract)
- `remote` - Remote jobs only (true/false)
- `minSalary` - Minimum salary
- `maxSalary` - Maximum salary
- `page` - Page number
- `limit` - Results per page

### Get Job Details

Get detailed information about a specific job.

```http
GET /jobs/:id
Authorization: Bearer <access-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "job-123",
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "type": "Full-time",
    "remote": true,
    "salary": {
      "min": 120000,
      "max": 180000,
      "currency": "USD"
    },
    "description": "We are looking for...",
    "requirements": [...],
    "benefits": [...],
    "postedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Save Job

Save a job for later.

```http
POST /jobs/:id/save
Authorization: Bearer <access-token>
```

### Unsave Job

Remove a job from saved jobs.

```http
DELETE /jobs/:id/save
Authorization: Bearer <access-token>
```

### Get Saved Jobs

Get all saved jobs.

```http
GET /jobs/saved
Authorization: Bearer <access-token>
```

### Get Job Recommendations

Get personalized job recommendations.

```http
GET /jobs/recommendations
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `limit` - Number of recommendations (default: 20)

### Get Match Score

Get match score between resume and job.

```http
POST /jobs/:id/match-score
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "resumeId": "resume-123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "score": 85,
    "matchedSkills": ["JavaScript", "React", "Node.js"],
    "missingSkills": ["Python", "Docker"],
    "recommendations": [...]
  }
}
```

### Generate Interview Questions

Get AI-generated interview questions for a job.

```http
POST /jobs/:id/interview-questions
Authorization: Bearer <access-token>
```

### Predict Salary

Get salary prediction for a job.

```http
POST /jobs/:id/predict-salary
Authorization: Bearer <access-token>
```

---

## Auto-Apply Service

Base URL: `http://localhost:8005/api/v1`

### Submit Application

Submit a job application.

```http
POST /applications
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "jobId": "job-123",
  "resumeId": "resume-123",
  "coverLetter": "I am writing to express my interest...",
  "autoGenerate": false
}
```

### List Applications

Get all applications for the authenticated user.

```http
GET /applications
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `status` - Filter by status (pending, submitted, rejected, etc.)
- `page` - Page number
- `limit` - Results per page

### Get Application

Get details of a specific application.

```http
GET /applications/:id
Authorization: Bearer <access-token>
```

### Update Application

Update application status or notes.

```http
PATCH /applications/:id
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "status": "interview_scheduled",
  "notes": "Interview scheduled for next week"
}
```

### Delete Application

Delete an application record.

```http
DELETE /applications/:id
Authorization: Bearer <access-token>
```

### Get Auto-Apply Settings

Get auto-apply configuration.

```http
GET /auto-apply/settings
Authorization: Bearer <access-token>
```

### Update Auto-Apply Settings

Configure auto-apply preferences.

```http
POST /auto-apply/settings
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "enabled": true,
  "maxApplicationsPerDay": 20,
  "platforms": ["LinkedIn", "Indeed"],
  "jobPreferences": {
    "locations": ["Remote"],
    "types": ["Full-time"],
    "minSalary": 100000
  }
}
```

### Start Auto-Apply

Start automated job application process.

```http
POST /auto-apply/start
Authorization: Bearer <access-token>
```

### Stop Auto-Apply

Stop automated job application process.

```http
POST /auto-apply/stop
Authorization: Bearer <access-token>
```

---

## Analytics Service

Base URL: `http://localhost:8006/api/v1`

### Get Dashboard Data

Get analytics dashboard data.

```http
GET /analytics/dashboard
Authorization: Bearer <access-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalApplications": 150,
    "applicationsByStatus": {
      "pending": 20,
      "submitted": 80,
      "interviewing": 30,
      "rejected": 15,
      "accepted": 5
    },
    "successRate": 3.3,
    "averageResponseTime": 7.5,
    "topCompanies": [...]
  }
}
```

### Get Application Metrics

Get detailed application analytics.

```http
GET /analytics/applications
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `groupBy` - Group by (day, week, month)

### Track Custom Event

Track a custom analytics event.

```http
POST /analytics/track
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "event": "resume_downloaded",
  "properties": {
    "resumeId": "resume-123",
    "format": "pdf"
  }
}
```

---

## Notification Service

Base URL: `http://localhost:8007/api/v1`

### Get Notifications

Get all notifications for the user.

```http
GET /notifications
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `unreadOnly` - Show only unread (true/false)
- `type` - Filter by notification type
- `page` - Page number
- `limit` - Results per page

### Mark as Read

Mark a notification as read.

```http
PATCH /notifications/:id/read
Authorization: Bearer <access-token>
```

### Mark All as Read

Mark all notifications as read.

```http
PATCH /notifications/read-all
Authorization: Bearer <access-token>
```

### Delete Notification

Delete a notification.

```http
DELETE /notifications/:id
Authorization: Bearer <access-token>
```

### Get Notification Preferences

Get user notification preferences.

```http
GET /notifications/preferences
Authorization: Bearer <access-token>
```

### Update Notification Preferences

Update notification preferences.

```http
PATCH /notifications/preferences
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "email": {
    "jobAlerts": true,
    "applicationUpdates": true,
    "weeklyDigest": false
  },
  "push": {
    "jobAlerts": true,
    "applicationUpdates": true
  }
}
```

### Subscribe to Push Notifications

Register device for push notifications.

```http
POST /notifications/subscribe
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "deviceToken": "fcm-device-token",
  "platform": "android"
}
```

---

## AI Service

Base URL: `http://localhost:8000/api/v1`

### Parse Resume

Parse resume content using AI.

```http
POST /ai/parse-resume
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - Resume file (PDF, DOCX)

### Match Jobs

Find matching jobs for a resume.

```http
POST /ai/match-jobs
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "resumeId": "resume-123",
  "limit": 20
}
```

### Optimize Resume

Get AI-powered resume optimization suggestions.

```http
POST /ai/optimize-resume
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "resumeId": "resume-123",
  "jobDescription": "We are looking for..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "score": 75,
    "suggestions": [
      {
        "type": "skills",
        "message": "Add Python to your skills section",
        "importance": "high"
      },
      {
        "type": "experience",
        "message": "Quantify your achievements with metrics",
        "importance": "medium"
      }
    ]
  }
}
```

### Generate Cover Letter

Generate a cover letter using AI.

```http
POST /ai/generate-cover-letter
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "resumeId": "resume-123",
  "jobDescription": "We are looking for...",
  "tone": "professional"
}
```

### Predict Salary

Predict salary range for a job.

```http
POST /ai/predict-salary
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "experience": 5,
  "skills": ["JavaScript", "React", "Node.js"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "min": 130000,
    "max": 180000,
    "median": 155000,
    "currency": "USD",
    "confidence": 0.85
  }
}
```

### Generate Interview Questions

Generate interview questions for a job.

```http
POST /ai/generate-questions
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "jobDescription": "We are looking for...",
  "difficulty": "medium",
  "count": 10
}
```

---

## Webhooks

JobPilot supports webhooks for real-time event notifications.

### Configure Webhook

```http
POST /webhooks
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["application.submitted", "job.matched"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

- `application.submitted` - New application submitted
- `application.status_changed` - Application status updated
- `job.matched` - New job match found
- `resume.optimized` - Resume optimization completed
- `notification.sent` - Notification sent

### Webhook Payload

```json
{
  "event": "application.submitted",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "applicationId": "app-123",
    "jobId": "job-123",
    "status": "submitted"
  }
}
```

---

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
import { JobPilotClient } from '@jobpilot/sdk';

const client = new JobPilotClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.jobpilot.ai'
});

// Search jobs
const jobs = await client.jobs.search({
  keyword: 'software engineer',
  location: 'Remote',
  limit: 20
});

// Submit application
const application = await client.applications.create({
  jobId: 'job-123',
  resumeId: 'resume-123'
});
```

### Python

```python
from jobpilot import JobPilotClient

client = JobPilotClient(
    api_key='your-api-key',
    base_url='https://api.jobpilot.ai'
)

# Search jobs
jobs = client.jobs.search(
    keyword='software engineer',
    location='Remote',
    limit=20
)

# Submit application
application = client.applications.create(
    job_id='job-123',
    resume_id='resume-123'
)
```

---

## Support

For API support:
- Email: api-support@jobpilot.ai
- Documentation: https://docs.jobpilot.ai
- API Status: https://status.jobpilot.ai

For more detailed API documentation, see:
- [Authentication Guide](consolidated/api/authentication.md)
- [User API](consolidated/api/users.md)
- [Job API](consolidated/api/jobs.md)
- [Resume API](consolidated/api/resumes.md)
- [Application API](consolidated/api/applications.md)
- [AI API](consolidated/api/ai.md)
