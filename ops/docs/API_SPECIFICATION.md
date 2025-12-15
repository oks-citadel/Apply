# ApplyForUs API Specification

**Version:** 1.0.0
**Last Updated:** December 2024
**Base URLs:**
- Development: `https://api-dev.applyforus.com`
- Staging: `https://api-staging.applyforus.com`
- Production: `https://api.applyforus.com`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Auth Service](#auth-service-port-8001)
3. [User Service](#user-service-port-8002)
4. [Job Service](#job-service-port-8003)
5. [Resume Service](#resume-service-port-8004)
6. [Auto-Apply Service](#auto-apply-service-port-8006)
7. [AI Service](#ai-service-port-8008)
8. [Notification Service](#notification-service-port-8005)
9. [Analytics Service](#analytics-service-port-8007)
10. [Payment Service](#payment-service-port-8009)
11. [Orchestrator Service](#orchestrator-service-port-8010)
12. [Common Response Patterns](#common-response-patterns)
13. [Error Codes](#error-codes)

---

## Authentication

### JWT Bearer Token

Most endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Auth Levels

| Level | Description |
|-------|-------------|
| **Public** | No authentication required |
| **User** | Valid JWT token required |
| **Admin** | JWT token with ADMIN role required |
| **API Key** | Service-to-service authentication |

### Rate Limiting

Rate limits are applied per IP/user. Headers returned:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Auth Service (Port 8001)

Base path: `/auth`

### Authentication Endpoints

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/auth/register` | Public | 5/min | Register new user |
| POST | `/auth/login` | Public | 10/min | Login with credentials |
| POST | `/auth/logout` | User | - | Logout current user |
| POST | `/auth/refresh` | Public | 20/min | Refresh access token |
| POST | `/auth/forgot-password` | Public | 3/min | Request password reset |
| POST | `/auth/reset-password` | Public | 5/min | Reset password with token |
| POST | `/auth/password/change` | User | 5/min | Change password |
| POST | `/auth/verify-email` | Public | 10/min | Verify email with token |
| POST | `/auth/resend-verification` | User | 3/min | Resend verification email |
| GET | `/auth/me` | User | - | Get current user profile |

### OAuth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/google` | Public | Initiate Google OAuth |
| GET | `/auth/google/callback` | Public | Google OAuth callback |
| GET | `/auth/linkedin` | Public | Initiate LinkedIn OAuth |
| GET | `/auth/linkedin/callback` | Public | LinkedIn OAuth callback |
| GET | `/auth/github` | Public | Initiate GitHub OAuth |
| GET | `/auth/github/callback` | Public | GitHub OAuth callback |
| POST | `/auth/oauth/disconnect` | User | Disconnect OAuth provider |

### MFA Endpoints

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/auth/mfa/setup` | User | - | Setup MFA (returns QR code) |
| POST | `/auth/mfa/verify` | User | 5/min | Verify and enable MFA |
| POST | `/auth/mfa/disable` | User | - | Disable MFA |

### User Management (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | Admin | Get all users |
| GET | `/users/:id` | Admin | Get user by ID |
| PATCH | `/users/:id` | Admin | Update user by ID |
| DELETE | `/users/:id` | Admin | Delete user by ID |

### Health Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Basic health check |
| GET | `/health/live` | Public | Liveness probe |
| GET | `/health/ready` | Public | Readiness probe |

---

## User Service (Port 8002)

### Profile Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | User | Get current user profile |
| PUT | `/profile` | User | Update user profile |
| POST | `/profile/photo` | User | Upload profile photo (multipart) |
| DELETE | `/profile/photo` | User | Remove profile photo |
| GET | `/profile/completeness` | User | Get profile completeness score |

### Work Experience

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile/work-experience` | User | Get all work experiences |
| POST | `/profile/work-experience` | User | Create work experience |
| PUT | `/profile/work-experience/:id` | User | Update work experience |
| DELETE | `/profile/work-experience/:id` | User | Delete work experience |

### Education

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile/education` | User | Get all education entries |
| POST | `/profile/education` | User | Create education entry |
| PUT | `/profile/education/:id` | User | Update education entry |
| DELETE | `/profile/education/:id` | User | Delete education entry |

### Skills

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/skills` | User | Get all user skills |
| GET | `/skills/suggestions` | User | Get skill suggestions |
| GET | `/skills/by-category` | User | Get skills by category |
| POST | `/skills` | User | Add new skill |
| PUT | `/skills/:id` | User | Update skill |
| DELETE | `/skills/:id` | User | Remove skill |

### Preferences

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/preferences` | User | Get job preferences |
| PUT | `/preferences` | User | Update job preferences |

### Subscription

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subscription` | User | Get current subscription |
| POST | `/subscription/checkout` | User | Create checkout session |
| POST | `/subscription/portal` | User | Create billing portal |
| POST | `/subscription/webhook` | Public | Handle Stripe webhooks |
| GET | `/subscription/usage` | User | Get feature usage stats |

---

## Job Service (Port 8003)

### Job Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/jobs/search` | Optional | Search jobs with filters |
| GET | `/jobs/recommended` | User | Get recommended jobs |
| GET | `/jobs/:id` | Public | Get job by ID |
| GET | `/jobs/:id/similar` | Public | Get similar jobs |
| GET | `/jobs/:id/interview-questions` | Public | Get interview questions |

### Saved Jobs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/jobs/saved` | User | Get saved jobs |
| POST | `/jobs/saved` | User | Save a job |
| PATCH | `/jobs/saved/:id` | User | Update saved job |
| DELETE | `/jobs/saved/:id` | User | Unsave a job |

### Job Matching

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/jobs/match-score` | User | Calculate match score |
| POST | `/jobs/salary-prediction` | Public | Predict salary |

### Job Reporting

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/jobs/:id/report` | User | Report a job |
| GET | `/jobs/:id/has-reported` | User | Check if user reported |

### Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search` | Public | Global search |
| GET | `/search/autocomplete` | Public | Title autocomplete |
| GET | `/search/suggestions` | Public | Search suggestions |
| GET | `/search/locations` | Public | Location search |
| GET | `/search/recent` | User | Recent searches |
| DELETE | `/search/recent/:id` | User | Delete recent search |

### Job Alerts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/alerts` | User | Create job alert |
| GET | `/alerts` | User | Get user's alerts |
| GET | `/alerts/:id` | User | Get alert by ID |
| PUT | `/alerts/:id` | User | Update alert |
| DELETE | `/alerts/:id` | User | Delete alert |
| GET | `/alerts/:id/test` | User | Test alert |

### Aggregator (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/aggregator/aggregate` | Admin | Trigger aggregation |
| GET | `/aggregator/providers` | Admin | List providers |
| GET | `/aggregator/health` | Admin | Provider health |
| GET | `/aggregator/stats` | Admin | Aggregation stats |

---

## Resume Service (Port 8004)

### Resume CRUD

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/resumes` | User | Create resume |
| GET | `/resumes` | User | Get all resumes (paginated) |
| GET | `/resumes/:id` | User | Get resume by ID |
| PUT | `/resumes/:id` | User | Update resume |
| DELETE | `/resumes/:id` | User | Delete resume |
| POST | `/resumes/:id/duplicate` | User | Duplicate resume |
| POST | `/resumes/:id/set-primary` | User | Set as primary |

### Import/Export

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/resumes/import` | User | Import from PDF/DOCX |
| GET | `/resumes/:id/export/:format` | User | Export (pdf/docx/json) |

### Version History

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/resumes/:id/versions` | User | Get version history |
| POST | `/resumes/:id/versions/:v/restore` | User | Restore version |

### AI Optimization

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/resumes/:id/ats-score` | User | Calculate ATS score |
| POST | `/resumes/:id/optimize` | User | AI optimization |

### Sections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/resumes/:id/sections` | User | Create section |
| GET | `/resumes/:id/sections` | User | Get all sections |
| PUT | `/resumes/:id/sections/:sId` | User | Update section |
| DELETE | `/resumes/:id/sections/:sId` | User | Delete section |
| POST | `/resumes/:id/sections/reorder` | User | Reorder sections |

---

## Auto-Apply Service (Port 8006)

### Applications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/applications` | User | Get all applications |
| GET | `/applications/analytics` | User | Get analytics |
| GET | `/applications/:id` | User | Get application by ID |
| POST | `/applications/manual` | User | Log manual application |
| PUT | `/applications/:id` | User | Update application |
| PUT | `/applications/:id/status` | User | Update status |
| DELETE | `/applications/:id` | User | Delete application |

### Automation Engine

| Method | Path | Auth | Response | Description |
|--------|------|------|----------|-------------|
| POST | `/engine/apply` | User | 202 | Start auto-apply |
| POST | `/engine/batch-apply` | User | 202 | Batch apply |
| GET | `/engine/status/:id` | User | 200 | Check status |
| POST | `/engine/retry/:id` | User | 202 | Retry failed |

---

## AI Service (Port 8008)

**Note:** Python/FastAPI service

### Content Generation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/generate/summary` | User | Generate resume summary |
| POST | `/api/ai/generate/bullets` | User | Generate bullet points |
| POST | `/api/ai/generate/skills` | User | Extract/suggest skills |
| POST | `/api/ai/generate/cover-letter` | User | Generate cover letter |
| POST | `/api/ai/generate/stream-summary` | User | Stream summary (SSE) |

### Job Matching

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/match/job` | User | Calculate match score |
| POST | `/api/ai/match/jobs` | User | Find matching jobs |
| POST | `/api/ai/match/batch-score` | User | Batch scoring |
| POST | `/api/ai/match/explain` | User | Match explanation |

### Analytics & Predictions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/predict/salary` | Public | Predict salary |
| POST | `/ai/skill-gap-analysis` | User | Skill gap analysis |
| POST | `/ai/career-path` | User | Career path suggestions |

### Optimization

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/ats-score` | User | ATS score calculation |
| POST | `/ai/optimize-resume` | User | Resume optimization |
| POST | `/ai/improve-text` | User | Text improvement |
| POST | `/ai/interview-prep` | User | Interview preparation |

---

## Notification Service (Port 8005)

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/notifications/email` | Service | Send email |
| POST | `/notifications/push` | Service | Send push notification |
| POST | `/notifications` | Service | Create notification |
| GET | `/notifications` | Admin | Get all (paginated) |
| GET | `/notifications/user/:userId` | User | Get user notifications |
| GET | `/notifications/user/:userId/unread-count` | User | Unread count |
| GET | `/notifications/:id` | User | Get by ID |
| PATCH | `/notifications/:id/read` | User | Mark as read |
| PATCH | `/notifications/user/:userId/read-all` | User | Mark all read |
| DELETE | `/notifications/:id` | User | Delete notification |

### Preferences

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/preferences/:userId` | User | Get preferences |
| PUT | `/notifications/preferences/:userId` | User | Update preferences |

---

## Analytics Service (Port 8007)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/analytics/events` | User | Track event |
| GET | `/analytics/dashboard` | User | Dashboard metrics |
| GET | `/analytics/applications` | User | Application funnel |
| GET | `/analytics/activity` | User | Recent activity |
| GET | `/analytics/export` | User | Export data (CSV/JSON) |
| GET | `/analytics/health` | Public | Health check |

---

## Payment Service (Port 8009)

### Subscriptions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/subscriptions` | API Key | Create subscription |
| GET | `/subscriptions` | API Key | Get all (paginated) |
| GET | `/subscriptions/user/:userId` | API Key | Get by user |
| GET | `/subscriptions/user/:userId/limits` | API Key | Get limits |
| POST | `/subscriptions/checkout-session` | API Key | Create checkout |
| POST | `/subscriptions/:id/billing-portal` | API Key | Billing portal |
| POST | `/subscriptions/:id/cancel` | API Key | Cancel |
| POST | `/subscriptions/:id/reactivate` | API Key | Reactivate |
| POST | `/subscriptions/:id/upgrade` | API Key | Upgrade tier |

### Virtual Coins

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/coins/balance/:userId` | User | Get balance |
| GET | `/coins/packages` | Public | Available packages |
| POST | `/coins/purchase` | User | Purchase coins |
| GET | `/coins/transactions/:userId` | User | Transaction history |
| GET | `/coins/boost/costs` | Public | Boost pricing |
| POST | `/coins/boost` | User | Boost visibility |
| GET | `/coins/boosts/:userId` | User | Active boosts |
| POST | `/coins/boost/cancel` | User | Cancel boost |

### Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/stripe/webhook` | Stripe Sig | Stripe webhooks |
| POST | `/paystack/webhook` | Public | Paystack webhooks |
| POST | `/flutterwave/webhook` | Public | Flutterwave webhooks |

---

## Orchestrator Service (Port 8010)

### Orchestration

| Method | Path | Auth | Response | Description |
|--------|------|------|----------|-------------|
| POST | `/orchestrate` | User | 202 | Start task |
| GET | `/tasks/:taskId` | User | 200 | Get task status |

### Workflows

| Method | Path | Auth | Response | Description |
|--------|------|------|----------|-------------|
| POST | `/workflows/:type` | User | 202 | Execute workflow |
| GET | `/workflows/:executionId/status` | User | 200 | Execution status |
| GET | `/workflows` | User | 200 | List workflows |

### Agent Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/agents/health` | Admin | All agents health |
| GET | `/agents/:agentType/health` | Admin | Agent health |
| GET | `/agents/circuits` | Admin | Circuit breakers |
| POST | `/agents/:agentType/reset` | Admin | Reset circuit |

---

## Common Response Patterns

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ ... ]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Dependency unavailable |

---

## API Versioning

APIs support versioning via URL prefix:
- `/v1/...` (current, default)
- `/v2/...` (future versions)

---

## SDK & Clients

Official SDKs:
- JavaScript/TypeScript: `@applyforus/api-client`
- Python: `applyforus-py`
- Mobile: React Native SDK included

---

*Generated by ApplyForUs API Documentation System*
*© 2024 ApplyForUs Inc. All rights reserved.*
