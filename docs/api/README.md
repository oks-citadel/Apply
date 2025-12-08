# JobPilot AI Platform - API Documentation

Complete API documentation for all microservices in the JobPilot AI Platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Services](#services)
- [Postman Collection](#postman-collection)

## Overview

The JobPilot AI Platform consists of the following microservices:

| Service | Port | Base URL | Swagger Docs |
|---------|------|----------|--------------|
| Auth Service | 3001 | `/api/auth` | `/docs` |
| User Service | 3002 | `/api/users` | `/docs` |
| Job Service | 3003 | `/api/jobs` | `/docs` |
| Resume Service | 3004 | `/api/resumes` | `/docs` |
| Notification Service | 3005 | `/api/notifications` | `/docs` |
| Auto-Apply Service | 3006 | `/api/applications` | `/docs` |
| Analytics Service | 3007 | `/api/analytics` | `/docs` |
| AI Service | 8000 | `/ai` | `/docs` |

## Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Acquisition

**Register:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Token Refresh

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Multi-Factor Authentication (MFA)

1. **Setup MFA:**
```http
POST /api/auth/mfa/setup
Authorization: Bearer <token>
```

2. **Verify and Enable:**
```http
POST /api/auth/mfa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

## Rate Limiting

Rate limits are applied per endpoint to prevent abuse:

| Endpoint Type | Limit | Time Window |
|--------------|-------|-------------|
| Authentication (Login) | 10 requests | 1 minute |
| Authentication (Register) | 5 requests | 1 minute |
| Password Reset | 3 requests | 1 minute |
| Token Refresh | 20 requests | 1 minute |
| Standard API | 100 requests | 1 minute |
| AI Endpoints | 30 requests | 1 minute |
| File Upload | 10 requests | 1 minute |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Error Handling

### Standard Error Response

All errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/endpoint",
  "details": {
    "field": "email",
    "constraint": "must be a valid email"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

```typescript
// Authentication Errors
INVALID_CREDENTIALS
TOKEN_EXPIRED
TOKEN_INVALID
MFA_REQUIRED
EMAIL_NOT_VERIFIED
ACCOUNT_LOCKED

// Validation Errors
VALIDATION_ERROR
MISSING_REQUIRED_FIELD
INVALID_FORMAT
VALUE_OUT_OF_RANGE

// Resource Errors
RESOURCE_NOT_FOUND
RESOURCE_ALREADY_EXISTS
INSUFFICIENT_PERMISSIONS
QUOTA_EXCEEDED

// Service Errors
INTERNAL_SERVER_ERROR
SERVICE_UNAVAILABLE
EXTERNAL_SERVICE_ERROR
DATABASE_ERROR
```

## Pagination

### Query Parameters

All list endpoints support pagination:

```http
GET /api/endpoint?page=1&limit=20&sortBy=createdAt&sortOrder=DESC
```

**Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sortBy` (string, optional): Field to sort by
- `sortOrder` (string, optional): 'ASC' or 'DESC' (default: DESC)

### Response Format

```json
{
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

## Services

### Individual Service Documentation

- [Auth Service](./auth-service.md) - User authentication and authorization
- [User Service](./user-service.md) - User profile and preferences management
- [Job Service](./job-service.md) - Job search and management
- [Resume Service](./resume-service.md) - Resume creation and optimization
- [Notification Service](./notification-service.md) - Email and push notifications
- [Auto-Apply Service](./auto-apply-service.md) - Automatic job applications
- [Analytics Service](./analytics-service.md) - Analytics and tracking
- [AI Service](./ai-service.md) - AI-powered features

## Postman Collection

### Import Collection

1. Download the Postman collection: [JobPilot-API.postman_collection.json](./JobPilot-API.postman_collection.json)
2. Open Postman
3. Click "Import" button
4. Select the downloaded file
5. Configure environment variables:
   - `BASE_URL`: Your API base URL
   - `AUTH_TOKEN`: Your JWT token (auto-updated after login)

### Environment Variables

Create a new environment with these variables:

```json
{
  "BASE_URL": "http://localhost:3000",
  "AUTH_SERVICE_URL": "http://localhost:3001",
  "USER_SERVICE_URL": "http://localhost:3002",
  "JOB_SERVICE_URL": "http://localhost:3003",
  "RESUME_SERVICE_URL": "http://localhost:3004",
  "NOTIFICATION_SERVICE_URL": "http://localhost:3005",
  "AUTO_APPLY_SERVICE_URL": "http://localhost:3006",
  "ANALYTICS_SERVICE_URL": "http://localhost:3007",
  "AI_SERVICE_URL": "http://localhost:8000",
  "AUTH_TOKEN": "",
  "REFRESH_TOKEN": "",
  "USER_ID": ""
}
```

## Common Request Examples

### Creating a Resume

```http
POST /api/resumes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Engineer Resume",
  "template": "modern",
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

### Searching Jobs

```http
GET /api/jobs/search?keywords=software+engineer&location=remote&page=1&limit=20
Authorization: Bearer <token>
```

### Calculating Match Score

```http
POST /api/jobs/match-score
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "resumeId": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Auto-Applying to Jobs

```http
POST /api/applications/manual
Authorization: Bearer <token>
Content-Type: application/json

{
  "job_id": "550e8400-e29b-41d4-a716-446655440001",
  "resume_id": "550e8400-e29b-41d4-a716-446655440002",
  "cover_letter_id": "550e8400-e29b-41d4-a716-446655440003",
  "auto_applied": false
}
```

## Webhooks

### Event Types

The platform supports webhooks for real-time event notifications:

- `application.submitted` - Application submitted successfully
- `application.status_changed` - Application status updated
- `job.matched` - New job match found
- `notification.received` - New notification
- `resume.optimized` - Resume optimization completed

### Webhook Payload

```json
{
  "event": "application.submitted",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "applicationId": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "jobId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "pending"
  }
}
```

## Support

For API support, please:
- Check the individual service documentation
- Review the [FAQ](../FAQ.md)
- Contact: api-support@jobpilot.ai

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for API version history and breaking changes.
