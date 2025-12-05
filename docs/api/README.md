# JobPilot API Documentation

Welcome to the JobPilot API documentation. This comprehensive guide provides details about all available endpoints, authentication methods, and integration instructions for the JobPilot platform.

## Overview

JobPilot is a comprehensive job application automation platform built with a microservices architecture. The API provides access to job search, resume management, automated applications, user profiles, and AI-powered job matching.

## Base URL

```
Production: https://api.jobpilot.com
Development: http://localhost:3000
```

## API Architecture

JobPilot uses a microservices architecture with the following services:

- **Auth Service** (Port 3001): User authentication and authorization
- **User Service** (Port 3002): User profiles, skills, preferences, and subscriptions
- **Job Service** (Port 3003): Job listings, search, and recommendations
- **Resume Service** (Port 3004): Resume creation, management, and export
- **Auto-Apply Service** (Port 3005): Job application automation and tracking

## API Gateway

All requests are routed through an API Gateway that handles:
- Request routing to appropriate microservices
- Load balancing
- Rate limiting
- Request/response transformation
- Unified error handling

## Authentication

The JobPilot API uses JWT (JSON Web Tokens) for authentication. See [Authentication Documentation](./authentication.md) for detailed information.

### Quick Start

1. Register a new account:
```bash
curl -X POST https://api.jobpilot.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. Login to get access token:
```bash
curl -X POST https://api.jobpilot.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

3. Use the access token in subsequent requests:
```bash
curl -X GET https://api.jobpilot.com/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Rate Limiting

API rate limits vary by endpoint and subscription tier:

| Endpoint Category | Free Tier | Pro Tier | Enterprise |
|------------------|-----------|----------|------------|
| Authentication | 5/min | 10/min | Custom |
| Job Search | 30/min | 100/min | Custom |
| Resume Operations | 20/min | 100/min | Custom |
| Auto-Apply | 10/min | 50/min | Custom |
| General API | 60/min | 300/min | Custom |

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

## Response Format

All API responses follow a consistent JSON format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
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

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort_by`: Field to sort by
- `sort_order`: Sort direction (`asc` or `desc`)

Example paginated response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

## API Endpoints

### Authentication & Users
- [Authentication](./authentication.md) - Registration, login, OAuth, MFA
- [Users](./users.md) - User management and profiles

### Job Management
- [Jobs](./jobs.md) - Job search, recommendations, and saved jobs
- [Applications](./applications.md) - Application tracking and management

### Resume Management
- [Resumes](./resumes.md) - Resume CRUD, import/export, versioning

### AI Features
- [AI Services](./ai.md) - AI-powered job matching and resume optimization

### Error Handling
- [Error Codes](./errors.md) - Complete error code reference

## Versioning

The API uses URL versioning. The current version is `v1`.

```
https://api.jobpilot.com/v1/jobs
```

Breaking changes will be introduced in new versions while maintaining backward compatibility for previous versions.

## SDKs and Libraries

Official SDKs are available for:
- JavaScript/TypeScript (npm: `@jobpilot/sdk`)
- Python (pip: `jobpilot-sdk`)
- Go (go get: `github.com/jobpilot/jobpilot-go`)

## Webhooks

JobPilot supports webhooks for real-time event notifications. Configure webhooks in your account settings to receive:
- New job matches
- Application status updates
- Resume feedback
- Account events

## Support

- Documentation: https://docs.jobpilot.com
- API Status: https://status.jobpilot.com
- Developer Forum: https://community.jobpilot.com
- Email Support: api-support@jobpilot.com

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for API version history and updates.

## Legal

- [Terms of Service](https://jobpilot.com/terms)
- [Privacy Policy](https://jobpilot.com/privacy)
- [API Usage Policy](https://jobpilot.com/api-policy)
