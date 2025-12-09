# ApplyforUs Platform - API Routes Inventory

> Auto-generated API inventory for all microservices
> Generated: 2025-12-09

## Overview

| Service | Base Port | Total Endpoints | Auth Required |
|---------|-----------|-----------------|---------------|
| Auth Service | 3001 | 31 | Partial |
| User Service | 8002 | 54 | Yes |
| Job Service | 8004 | 44 | Yes |
| Resume Service | 8003 | 28 | Yes |
| Auto-Apply Service | 8005 | 22 | Yes |
| Notification Service | 8007 | 18 | Yes |
| Analytics Service | 8006 | 15 | Yes |
| Orchestrator Service | 3009 | 12 | Yes |
| AI Service (Python) | 8000 | 25 | Yes |
| **Total** | - | **249** | - |

---

## Auth Service (Port 3001)

### Authentication Controller (`/auth`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/auth/register` | `register()` | No | Register new user |
| POST | `/auth/login` | `login()` | No | User login |
| POST | `/auth/logout` | `logout()` | JWT | User logout |
| POST | `/auth/refresh` | `refreshToken()` | JWT | Refresh access token |
| POST | `/auth/forgot-password` | `forgotPassword()` | No | Request password reset |
| POST | `/auth/reset-password` | `resetPassword()` | No | Reset password with token |
| POST | `/auth/verify-email` | `verifyEmail()` | No | Verify email address |
| POST | `/auth/resend-verification` | `resendVerification()` | No | Resend verification email |
| GET | `/auth/me` | `getCurrentUser()` | JWT | Get current user info |
| PATCH | `/auth/change-password` | `changePassword()` | JWT | Change password |

### OAuth Controller (`/auth/oauth`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/auth/oauth/google` | `googleAuth()` | No | Initiate Google OAuth |
| GET | `/auth/oauth/google/callback` | `googleCallback()` | No | Google OAuth callback |
| GET | `/auth/oauth/linkedin` | `linkedinAuth()` | No | Initiate LinkedIn OAuth |
| GET | `/auth/oauth/linkedin/callback` | `linkedinCallback()` | No | LinkedIn OAuth callback |
| GET | `/auth/oauth/github` | `githubAuth()` | No | Initiate GitHub OAuth |
| GET | `/auth/oauth/github/callback` | `githubCallback()` | No | GitHub OAuth callback |

### MFA Controller (`/auth/mfa`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/auth/mfa/enable` | `enableMfa()` | JWT | Enable MFA |
| POST | `/auth/mfa/disable` | `disableMfa()` | JWT | Disable MFA |
| POST | `/auth/mfa/verify` | `verifyMfa()` | JWT | Verify MFA code |
| GET | `/auth/mfa/backup-codes` | `getBackupCodes()` | JWT | Get backup codes |
| POST | `/auth/mfa/regenerate-backup` | `regenerateBackupCodes()` | JWT | Regenerate backup codes |

### Users Controller (`/users`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/users` | `findAll()` | Admin | List all users |
| GET | `/users/:id` | `findOne()` | JWT | Get user by ID |
| PATCH | `/users/:id` | `update()` | JWT | Update user |
| DELETE | `/users/:id` | `remove()` | Admin | Delete user |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |
| GET | `/health/live` | `liveness()` | No | Liveness probe |

---

## User Service (Port 8002)

### Profile Controller (`/profile`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/profile` | `getProfile()` | JWT | Get user profile |
| PATCH | `/profile` | `updateProfile()` | JWT | Update profile |
| POST | `/profile/avatar` | `uploadAvatar()` | JWT | Upload avatar |
| DELETE | `/profile/avatar` | `deleteAvatar()` | JWT | Delete avatar |
| GET | `/profile/completion` | `getCompletion()` | JWT | Get profile completion % |

### Career Controller (`/career`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/career/experience` | `getExperience()` | JWT | Get work experience |
| POST | `/career/experience` | `addExperience()` | JWT | Add experience |
| PATCH | `/career/experience/:id` | `updateExperience()` | JWT | Update experience |
| DELETE | `/career/experience/:id` | `deleteExperience()` | JWT | Delete experience |
| GET | `/career/education` | `getEducation()` | JWT | Get education history |
| POST | `/career/education` | `addEducation()` | JWT | Add education |
| PATCH | `/career/education/:id` | `updateEducation()` | JWT | Update education |
| DELETE | `/career/education/:id` | `deleteEducation()` | JWT | Delete education |
| GET | `/career/certifications` | `getCertifications()` | JWT | Get certifications |
| POST | `/career/certifications` | `addCertification()` | JWT | Add certification |
| PATCH | `/career/certifications/:id` | `updateCertification()` | JWT | Update certification |
| DELETE | `/career/certifications/:id` | `deleteCertification()` | JWT | Delete certification |

### Skills Controller (`/skills`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/skills` | `getSkills()` | JWT | Get user skills |
| POST | `/skills` | `addSkill()` | JWT | Add skill |
| PATCH | `/skills/:id` | `updateSkill()` | JWT | Update skill |
| DELETE | `/skills/:id` | `deleteSkill()` | JWT | Delete skill |
| GET | `/skills/suggestions` | `getSuggestions()` | JWT | Get skill suggestions |
| POST | `/skills/bulk` | `bulkAddSkills()` | JWT | Add multiple skills |

### Preferences Controller (`/preferences`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/preferences` | `getPreferences()` | JWT | Get job preferences |
| PATCH | `/preferences` | `updatePreferences()` | JWT | Update preferences |
| GET | `/preferences/job-types` | `getJobTypes()` | JWT | Get preferred job types |
| PATCH | `/preferences/job-types` | `updateJobTypes()` | JWT | Update job types |
| GET | `/preferences/locations` | `getLocations()` | JWT | Get preferred locations |
| PATCH | `/preferences/locations` | `updateLocations()` | JWT | Update locations |
| GET | `/preferences/salary` | `getSalaryExpectation()` | JWT | Get salary expectations |
| PATCH | `/preferences/salary` | `updateSalaryExpectation()` | JWT | Update salary |
| GET | `/preferences/industries` | `getIndustries()` | JWT | Get preferred industries |
| PATCH | `/preferences/industries` | `updateIndustries()` | JWT | Update industries |

### Subscription Controller (`/subscription`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/subscription` | `getSubscription()` | JWT | Get subscription status |
| POST | `/subscription/upgrade` | `upgrade()` | JWT | Upgrade subscription |
| POST | `/subscription/cancel` | `cancel()` | JWT | Cancel subscription |
| GET | `/subscription/plans` | `getPlans()` | No | Get available plans |
| GET | `/subscription/usage` | `getUsage()` | JWT | Get usage stats |
| POST | `/subscription/webhook` | `handleWebhook()` | Stripe | Stripe webhook |

### Analytics Controller (`/user-analytics`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/user-analytics/dashboard` | `getDashboard()` | JWT | User dashboard stats |
| GET | `/user-analytics/activity` | `getActivity()` | JWT | Recent activity |
| GET | `/user-analytics/applications` | `getApplicationStats()` | JWT | Application statistics |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |
| GET | `/health/live` | `liveness()` | No | Liveness probe |

---

## Job Service (Port 8004)

### Jobs Controller (`/jobs`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/jobs` | `findAll()` | JWT | List jobs with filters |
| GET | `/jobs/:id` | `findOne()` | JWT | Get job by ID |
| POST | `/jobs` | `create()` | Admin | Create job posting |
| PATCH | `/jobs/:id` | `update()` | Admin | Update job posting |
| DELETE | `/jobs/:id` | `remove()` | Admin | Delete job posting |
| GET | `/jobs/:id/similar` | `findSimilar()` | JWT | Get similar jobs |
| POST | `/jobs/:id/view` | `trackView()` | JWT | Track job view |

### Search Controller (`/jobs/search`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/jobs/search` | `search()` | JWT | Search jobs |
| GET | `/jobs/search/advanced` | `advancedSearch()` | JWT | Advanced search |
| GET | `/jobs/search/suggestions` | `getSuggestions()` | JWT | Search suggestions |
| GET | `/jobs/search/autocomplete` | `autocomplete()` | JWT | Autocomplete |
| POST | `/jobs/search/filters` | `searchWithFilters()` | JWT | Search with filters |

### Saved Jobs Controller (`/jobs/saved`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/jobs/saved` | `getSavedJobs()` | JWT | Get saved jobs |
| POST | `/jobs/saved/:jobId` | `saveJob()` | JWT | Save a job |
| DELETE | `/jobs/saved/:jobId` | `unsaveJob()` | JWT | Unsave a job |
| GET | `/jobs/saved/check/:jobId` | `checkSaved()` | JWT | Check if job saved |

### Alerts Controller (`/jobs/alerts`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/jobs/alerts` | `getAlerts()` | JWT | Get job alerts |
| POST | `/jobs/alerts` | `createAlert()` | JWT | Create job alert |
| PATCH | `/jobs/alerts/:id` | `updateAlert()` | JWT | Update alert |
| DELETE | `/jobs/alerts/:id` | `deleteAlert()` | JWT | Delete alert |
| POST | `/jobs/alerts/:id/toggle` | `toggleAlert()` | JWT | Toggle alert on/off |

### Companies Controller (`/companies`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/companies` | `findAll()` | JWT | List companies |
| GET | `/companies/:id` | `findOne()` | JWT | Get company by ID |
| GET | `/companies/:id/jobs` | `getCompanyJobs()` | JWT | Get company's jobs |
| GET | `/companies/:id/reviews` | `getReviews()` | JWT | Get company reviews |
| POST | `/companies/:id/follow` | `follow()` | JWT | Follow company |
| DELETE | `/companies/:id/follow` | `unfollow()` | JWT | Unfollow company |

### Reports Controller (`/jobs/reports`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/jobs/reports` | `reportJob()` | JWT | Report a job |
| GET | `/jobs/reports` | `getReports()` | Admin | Get all reports |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |
| GET | `/health/live` | `liveness()` | No | Liveness probe |

---

## Resume Service (Port 8003)

### Resume Controller (`/resumes`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/resumes` | `findAll()` | JWT | List user's resumes |
| GET | `/resumes/:id` | `findOne()` | JWT | Get resume by ID |
| POST | `/resumes` | `create()` | JWT | Create resume |
| PATCH | `/resumes/:id` | `update()` | JWT | Update resume |
| DELETE | `/resumes/:id` | `remove()` | JWT | Delete resume |
| POST | `/resumes/:id/duplicate` | `duplicate()` | JWT | Duplicate resume |
| PATCH | `/resumes/:id/default` | `setDefault()` | JWT | Set as default |

### Upload Controller (`/resumes/upload`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/resumes/upload` | `uploadResume()` | JWT | Upload resume file |
| POST | `/resumes/upload/parse` | `parseResume()` | JWT | Parse uploaded resume |
| GET | `/resumes/upload/:id/status` | `getParseStatus()` | JWT | Get parse status |

### Export Controller (`/resumes/export`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/resumes/:id/export/pdf` | `exportPdf()` | JWT | Export as PDF |
| GET | `/resumes/:id/export/docx` | `exportDocx()` | JWT | Export as DOCX |
| GET | `/resumes/:id/preview` | `preview()` | JWT | Preview resume |

### Templates Controller (`/resumes/templates`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/resumes/templates` | `getTemplates()` | JWT | List templates |
| GET | `/resumes/templates/:id` | `getTemplate()` | JWT | Get template |
| GET | `/resumes/templates/:id/preview` | `previewTemplate()` | JWT | Preview template |

### AI Enhancement Controller (`/resumes/ai`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/resumes/:id/ai/enhance` | `enhanceResume()` | JWT | AI enhance resume |
| POST | `/resumes/:id/ai/tailor` | `tailorForJob()` | JWT | Tailor for job |
| POST | `/resumes/:id/ai/suggestions` | `getSuggestions()` | JWT | Get AI suggestions |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |
| GET | `/health/live` | `liveness()` | No | Liveness probe |

---

## Auto-Apply Service (Port 8005)

### Applications Controller (`/applications`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/applications` | `findAll()` | JWT | List applications |
| GET | `/applications/:id` | `findOne()` | JWT | Get application |
| POST | `/applications` | `create()` | JWT | Submit application |
| PATCH | `/applications/:id` | `update()` | JWT | Update application |
| DELETE | `/applications/:id` | `withdraw()` | JWT | Withdraw application |
| GET | `/applications/:id/status` | `getStatus()` | JWT | Get status |
| GET | `/applications/stats` | `getStats()` | JWT | Get statistics |

### Auto-Apply Controller (`/auto-apply`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/auto-apply/settings` | `getSettings()` | JWT | Get auto-apply settings |
| PATCH | `/auto-apply/settings` | `updateSettings()` | JWT | Update settings |
| POST | `/auto-apply/start` | `start()` | JWT | Start auto-apply |
| POST | `/auto-apply/stop` | `stop()` | JWT | Stop auto-apply |
| GET | `/auto-apply/queue` | `getQueue()` | JWT | Get queue |
| DELETE | `/auto-apply/queue/:id` | `removeFromQueue()` | JWT | Remove from queue |
| GET | `/auto-apply/history` | `getHistory()` | JWT | Get history |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |
| GET | `/health/live` | `liveness()` | No | Liveness probe |

---

## Notification Service (Port 8007)

### Notifications Controller (`/notifications`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/notifications` | `findAll()` | JWT | List notifications |
| GET | `/notifications/:id` | `findOne()` | JWT | Get notification |
| PATCH | `/notifications/:id/read` | `markAsRead()` | JWT | Mark as read |
| POST | `/notifications/read-all` | `markAllRead()` | JWT | Mark all as read |
| DELETE | `/notifications/:id` | `remove()` | JWT | Delete notification |
| GET | `/notifications/unread/count` | `getUnreadCount()` | JWT | Get unread count |

### Preferences Controller (`/notifications/preferences`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/notifications/preferences` | `getPreferences()` | JWT | Get preferences |
| PATCH | `/notifications/preferences` | `updatePreferences()` | JWT | Update preferences |

### Push Controller (`/notifications/push`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/notifications/push/subscribe` | `subscribe()` | JWT | Subscribe to push |
| POST | `/notifications/push/unsubscribe` | `unsubscribe()` | JWT | Unsubscribe |
| POST | `/notifications/push/test` | `sendTest()` | JWT | Send test notification |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |
| GET | `/health/live` | `liveness()` | No | Liveness probe |

---

## Analytics Service (Port 8006)

### Dashboard Controller (`/analytics/dashboard`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/analytics/dashboard` | `getDashboard()` | JWT | Get dashboard data |
| GET | `/analytics/dashboard/summary` | `getSummary()` | JWT | Get summary |

### Applications Analytics (`/analytics/applications`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/analytics/applications` | `getApplicationAnalytics()` | JWT | Application stats |
| GET | `/analytics/applications/trends` | `getTrends()` | JWT | Trend analysis |
| GET | `/analytics/applications/conversion` | `getConversion()` | JWT | Conversion rates |

### Jobs Analytics (`/analytics/jobs`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/analytics/jobs/market` | `getMarketInsights()` | JWT | Market insights |
| GET | `/analytics/jobs/salary` | `getSalaryData()` | JWT | Salary data |

### Reports Controller (`/analytics/reports`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/analytics/reports` | `getReports()` | JWT | List reports |
| POST | `/analytics/reports` | `generateReport()` | JWT | Generate report |
| GET | `/analytics/reports/:id` | `getReport()` | JWT | Get report |
| GET | `/analytics/reports/:id/download` | `downloadReport()` | JWT | Download report |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |

---

## Orchestrator Service (Port 3009)

### Workflow Controller (`/workflows`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/workflows` | `findAll()` | JWT | List workflows |
| GET | `/workflows/:id` | `findOne()` | JWT | Get workflow |
| POST | `/workflows` | `create()` | JWT | Create workflow |
| POST | `/workflows/:id/execute` | `execute()` | JWT | Execute workflow |
| GET | `/workflows/:id/status` | `getStatus()` | JWT | Get status |
| POST | `/workflows/:id/cancel` | `cancel()` | JWT | Cancel workflow |

### Tasks Controller (`/tasks`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/tasks` | `findAll()` | JWT | List tasks |
| GET | `/tasks/:id` | `findOne()` | JWT | Get task |
| POST | `/tasks/:id/retry` | `retry()` | JWT | Retry failed task |

### Health Controller (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `check()` | No | Service health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |
| GET | `/health/live` | `liveness()` | No | Liveness probe |

---

## AI Service (Port 8000 - Python/FastAPI)

### Resume Analysis (`/api/v1/resume`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/v1/resume/analyze` | `analyze_resume()` | JWT | Analyze resume |
| POST | `/api/v1/resume/parse` | `parse_resume()` | JWT | Parse resume file |
| POST | `/api/v1/resume/enhance` | `enhance_resume()` | JWT | Enhance content |
| POST | `/api/v1/resume/tailor` | `tailor_resume()` | JWT | Tailor for job |
| POST | `/api/v1/resume/score` | `score_resume()` | JWT | Score resume |

### Job Matching (`/api/v1/jobs`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/v1/jobs/match` | `match_jobs()` | JWT | Match jobs to profile |
| POST | `/api/v1/jobs/recommend` | `recommend_jobs()` | JWT | Recommend jobs |
| POST | `/api/v1/jobs/analyze` | `analyze_job()` | JWT | Analyze job posting |
| POST | `/api/v1/jobs/compare` | `compare_jobs()` | JWT | Compare jobs |

### Cover Letter (`/api/v1/cover-letter`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/v1/cover-letter/generate` | `generate_cover_letter()` | JWT | Generate cover letter |
| POST | `/api/v1/cover-letter/improve` | `improve_cover_letter()` | JWT | Improve cover letter |

### Interview Prep (`/api/v1/interview`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/v1/interview/questions` | `generate_questions()` | JWT | Generate questions |
| POST | `/api/v1/interview/feedback` | `get_feedback()` | JWT | Get answer feedback |
| POST | `/api/v1/interview/tips` | `get_tips()` | JWT | Get interview tips |

### Skills Analysis (`/api/v1/skills`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/v1/skills/extract` | `extract_skills()` | JWT | Extract skills |
| POST | `/api/v1/skills/gap` | `analyze_gap()` | JWT | Gap analysis |
| POST | `/api/v1/skills/recommend` | `recommend_skills()` | JWT | Recommend skills |

### Chat (`/api/v1/chat`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/v1/chat/message` | `chat()` | JWT | Chat with AI |
| GET | `/api/v1/chat/history` | `get_history()` | JWT | Get chat history |
| DELETE | `/api/v1/chat/history` | `clear_history()` | JWT | Clear history |

### Health (`/health`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | `health_check()` | No | Health check |
| GET | `/health/ready` | `readiness()` | No | Readiness probe |

---

## Authentication Details

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1702123456,
  "exp": 1702127056
}
```

### Guards Used
- `JwtAuthGuard` - Validates JWT token
- `RolesGuard` - Validates user roles
- `ThrottlerGuard` - Rate limiting

### Role Types
- `user` - Standard user
- `premium` - Premium subscriber
- `admin` - Administrator

---

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Base URLs by Environment

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:{port}` |
| Staging | `https://api-staging.applyforus.com` |
| Production | `https://api.applyforus.com` |

---

## Next Steps

1. Generate OpenAPI specification from this inventory
2. Create Postman collection for API testing
3. Implement E2E test suite
4. Set up API monitoring and alerting
