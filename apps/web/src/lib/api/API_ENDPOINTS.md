# API Endpoints Documentation

This document provides a comprehensive reference for all API endpoints used in the ApplyForUs frontend application.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.applyforus.com`

All endpoints are prefixed with the base URL. The backend gateway handles routing to appropriate microservices.

---

## Authentication API (`/auth/*`)

### POST /auth/login
Login with email and password.
- **Request**: `{ email: string, password: string }`
- **Response**: `AuthResponse | MfaRequiredResponse`

### POST /auth/mfa/login
Verify MFA code during login.
- **Request**: `{ tempToken: string, code: string }`
- **Response**: `AuthResponse`

### POST /auth/register
Register new user account.
- **Request**: `{ email: string, password: string, firstName: string, lastName: string }`
- **Response**: `AuthResponse`

### POST /auth/logout
Logout current user.
- **Response**: `void`

### POST /auth/refresh
Refresh access token using refresh token.
- **Request**: `{ refreshToken: string }`
- **Response**: `{ accessToken: string }`

### GET /auth/me
Get current authenticated user.
- **Response**: `{ user: User }`

### POST /auth/forgot-password
Request password reset email.
- **Request**: `{ email: string }`
- **Response**: `{ message: string }`

### POST /auth/reset-password
Reset password with token from email.
- **Request**: `{ token: string, password: string }`
- **Response**: `{ message: string }`

### POST /auth/verify-email
Verify email with token.
- **Request**: `{ token: string }`
- **Response**: `{ message: string }`

### POST /auth/resend-verification
Resend email verification.
- **Response**: `{ message: string }`

### POST /auth/mfa/setup
Setup MFA for user account.
- **Response**: `MfaSetup`

### POST /auth/mfa/verify
Verify and enable MFA.
- **Request**: `{ token: string }`
- **Response**: `{ message: string }`

### POST /auth/mfa/disable
Disable MFA.
- **Request**: `{ token: string }`
- **Response**: `{ message: string }`

### POST /auth/mfa/backup-codes
Generate new MFA backup codes.
- **Request**: `{ code: string }`
- **Response**: `{ backupCodes: string[] }`

---

## User API (`/users/*`)

### GET /users/profile
Get user profile.
- **Response**: `UserProfile`

### PATCH /users/profile
Update user profile.
- **Request**: `UpdateProfileData`
- **Response**: `UserProfile`

### POST /users/profile/photo
Upload profile photo.
- **Request**: `FormData (photo: File)`
- **Response**: `UploadPhotoResponse`

### DELETE /users/profile/photo
Delete profile photo.
- **Response**: `{ message: string }`

### GET /users/preferences
Get user preferences.
- **Response**: `UserPreferences`

### PATCH /users/preferences
Update user preferences.
- **Request**: `UpdatePreferencesData`
- **Response**: `UserPreferences`

### GET /users/subscription
Get user subscription.
- **Response**: `Subscription`

### GET /users/subscription/plans
Get available subscription plans.
- **Response**: `SubscriptionPlanDetails[]`

### POST /users/subscription/checkout
Create checkout session for subscription.
- **Request**: `{ plan: string, interval?: 'month' | 'year' }`
- **Response**: `CheckoutSession`

### POST /users/subscription/cancel
Cancel subscription.
- **Request**: `{ reason?: string, feedback?: string }`
- **Response**: `{ message: string }`

### POST /users/subscription/resume
Resume cancelled subscription.
- **Response**: `Subscription`

### POST /users/subscription/payment-method
Update payment method.
- **Response**: `{ url: string }`

### GET /users/activity
Get user activity logs.
- **Query Params**: `page?, limit?, dateFrom?, dateTo?`
- **Response**: `{ logs: ActivityLog[], total: number, page: number, limit: number }`

### POST /users/change-password
Change user password.
- **Request**: `{ currentPassword: string, newPassword: string }`
- **Response**: `{ message: string }`

### POST /users/delete-account
Delete user account.
- **Request**: `{ password: string, reason?: string }`
- **Response**: `{ message: string }`

### GET /users/export-data
Export user data.
- **Response**: `Blob`

---

## Jobs API (`/jobs/*`)

### GET /jobs/search
Search jobs with filters.
- **Query Params**: `JobSearchFilters`
- **Response**: `JobSearchResponse`

### GET /jobs/:id
Get single job by ID.
- **Response**: `Job`

### GET /jobs/recommended
Get recommended jobs for user.
- **Query Params**: `limit?, resumeId?`
- **Response**: `RecommendedJobsResponse`

### POST /jobs/saved
Save a job.
- **Request**: `{ jobId: string, notes?: string, tags?: string[] }`
- **Response**: `SavedJob`

### DELETE /jobs/saved/:jobId
Unsave a job.
- **Response**: `{ message: string }`

### GET /jobs/saved
Get all saved jobs.
- **Query Params**: `page?, limit?, tags?`
- **Response**: `{ savedJobs: SavedJob[], total: number, page: number, limit: number }`

### PATCH /jobs/saved/:jobId
Update saved job.
- **Request**: `{ notes?: string, tags?: string[] }`
- **Response**: `SavedJob`

### POST /jobs/match-score
Get match score between job and resume.
- **Request**: `{ jobId: string, resumeId: string }`
- **Response**: `JobMatchScore`

### GET /jobs/:jobId/similar
Get similar jobs.
- **Query Params**: `limit?`
- **Response**: `Job[]`

### GET /jobs/:jobId/interview-questions
Get interview questions for job.
- **Response**: `InterviewQuestions`

### POST /jobs/salary-prediction
Get salary prediction.
- **Request**: `{ jobTitle: string, location: string, experienceYears: number, skills: string[], education?: string }`
- **Response**: `SalaryPrediction`

### POST /jobs/:jobId/report
Report a job posting.
- **Request**: `{ reason: string, details?: string }`
- **Response**: `{ message: string }`

### GET /jobs/reports
Get all job reports (Admin only).
- **Query Params**: `page?, limit?, status?, reason?`
- **Response**: `JobReportsResponse`

### PUT /jobs/reports/:reportId/status
Update job report status (Admin only).
- **Request**: `UpdateReportStatusDto`
- **Response**: `JobReport`

### GET /jobs/alerts
Get all job alerts.
- **Response**: `JobAlertListResponse`

### GET /jobs/alerts/:id
Get single job alert.
- **Response**: `JobAlert`

### POST /jobs/alerts
Create job alert.
- **Request**: `CreateJobAlertInput`
- **Response**: `JobAlert`

### PUT /jobs/alerts/:id
Update job alert.
- **Request**: `UpdateJobAlertInput`
- **Response**: `JobAlert`

### DELETE /jobs/alerts/:id
Delete job alert.
- **Response**: `{ message: string }`

### PATCH /jobs/alerts/:id
Toggle job alert status.
- **Request**: `{ isActive: boolean }`
- **Response**: `JobAlert`

---

## Resumes API (`/resumes/*`)

### GET /resumes
Get all resumes for user.
- **Query Params**: `page?, limit?, search?`
- **Response**: `ResumeListResponse`

### GET /resumes/:id
Get single resume by ID.
- **Response**: `Resume`

### POST /resumes
Create new resume.
- **Request**: `CreateResumeData`
- **Response**: `Resume`

### PUT /resumes/:id
Update resume.
- **Request**: `UpdateResumeData`
- **Response**: `Resume`

### DELETE /resumes/:id
Delete resume.
- **Response**: `{ message: string }`

### POST /resumes/:id/duplicate
Duplicate resume.
- **Response**: `Resume`

### PATCH /resumes/:id/set-default
Set resume as default.
- **Response**: `Resume`

### GET /resumes/:id/export
Export resume in specified format.
- **Query Params**: `format: 'pdf' | 'docx' | 'txt'`
- **Response**: `Blob`

### POST /resumes/import
Import resume from file.
- **Request**: `FormData (file: File, parseFormat?: string)`
- **Response**: `Resume`

### POST /resumes/:resumeId/ats-score
Get ATS score for resume.
- **Request**: `{ jobDescription: string }`
- **Response**: `ATSScore`

### POST /resumes/parse
Parse resume from text or file.
- **Request**: `{ text?: string, file?: File }`
- **Response**: `Partial<Resume>`

---

## Applications API (`/applications/*`)

### GET /applications
Get all applications with filters.
- **Query Params**: `ApplicationFilters`
- **Response**: `ApplicationListResponse`

### GET /applications/:id
Get single application.
- **Response**: `Application`

### POST /applications
Create new application.
- **Request**: `CreateApplicationData`
- **Response**: `Application`

### PATCH /applications/:id
Update application.
- **Request**: `UpdateApplicationData`
- **Response**: `Application`

### PATCH /applications/:id/status
Update application status.
- **Request**: `{ status: string, note?: string }`
- **Response**: `Application`

### DELETE /applications/:id
Delete application.
- **Response**: `{ message: string }`

### POST /applications/:id/withdraw
Withdraw application.
- **Request**: `{ reason?: string }`
- **Response**: `Application`

### GET /applications/analytics
Get application analytics.
- **Query Params**: `dateFrom?, dateTo?`
- **Response**: `ApplicationAnalytics`

### GET /applications/auto-apply/settings
Get auto-apply settings.
- **Response**: `AutoApplySettings`

### PUT /applications/auto-apply/settings
Update auto-apply settings.
- **Request**: `AutoApplySettings`
- **Response**: `AutoApplySettings`

### POST /applications/auto-apply/start
Start auto-apply.
- **Request**: `Partial<AutoApplySettings>`
- **Response**: `AutoApplyStatus`

### POST /applications/auto-apply/stop
Stop auto-apply.
- **Response**: `AutoApplyStatus`

### GET /applications/auto-apply/status
Get auto-apply status.
- **Response**: `AutoApplyStatus`

### GET /applications/export
Export applications.
- **Query Params**: `format: 'csv' | 'xlsx' | 'json', ...ApplicationFilters`
- **Response**: `Blob`

---

## AI API (`/ai/*`)

### POST /ai/generate-summary
Generate professional summary.
- **Request**: `GenerateSummaryRequest`
- **Response**: `GenerateSummaryResponse`

### POST /ai/generate-bullets
Generate bullet points for experience.
- **Request**: `GenerateBulletsRequest`
- **Response**: `GenerateBulletsResponse`

### POST /ai/generate-cover-letter
Generate cover letter.
- **Request**: `GenerateCoverLetterRequest`
- **Response**: `GenerateCoverLetterResponse`

### POST /ai/ats-score
Get ATS score for resume.
- **Request**: `{ resumeId: string, jobDescription: string }`
- **Response**: `ATSScoreResponse`

### POST /ai/optimize-resume
Optimize resume for job.
- **Request**: `OptimizeResumeRequest`
- **Response**: `OptimizeResumeResponse`

### POST /ai/improve-text
Improve text with AI.
- **Request**: `ImproveTextRequest`
- **Response**: `ImproveTextResponse`

### POST /ai/interview-prep
Get interview preparation.
- **Request**: `{ jobId: string, resumeId?: string }`
- **Response**: `InterviewPrepResponse`

### POST /ai/salary-prediction
Get salary prediction.
- **Request**: `{ jobTitle: string, location: string, experienceYears: number, skills: string[], education?: string, industry?: string }`
- **Response**: `SalaryPredictionResponse`

### POST /ai/skill-gap-analysis
Analyze skill gaps.
- **Request**: `SkillGapAnalysisRequest`
- **Response**: `SkillGapAnalysisResponse`

### POST /ai/career-path
Get career path suggestions.
- **Request**: `{ resumeId: string }`
- **Response**: `CareerPathResponse`

### POST /ai/suggest-skills
Suggest skills based on resume.
- **Request**: `SuggestSkillsRequest`
- **Response**: `SuggestSkillsResponse`

---

## Analytics API (`/analytics/*`)

### GET /analytics/dashboard
Get dashboard summary with key metrics.
- **Query Params**: `AnalyticsFilters`
- **Response**: `DashboardSummary`

### GET /analytics/applications
Get application analytics (timeline and breakdown).
- **Query Params**: `AnalyticsFilters`
- **Response**: `ApplicationAnalytics`

### GET /analytics/jobs
Get job search analytics (companies, categories, locations).
- **Query Params**: `AnalyticsFilters`
- **Response**: `JobAnalytics`

### GET /analytics/activity
Get user activity metrics (heatmap data).
- **Query Params**: `AnalyticsFilters`
- **Response**: `ActivityMetrics`

### GET /analytics/response-trends
Get response rate trends over time.
- **Query Params**: `AnalyticsFilters`
- **Response**: `ResponseTrend[]`

### GET /analytics/export/:format
Export analytics data.
- **Params**: `format: 'csv' | 'pdf'`
- **Query Params**: `AnalyticsFilters`
- **Response**: `Blob`

---

## Notes

1. All endpoints (except `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`) require authentication via Bearer token in the `Authorization` header.

2. The API client automatically handles:
   - Token refresh on 401 errors
   - Retry logic for transient failures (network errors, 5xx errors)
   - Request/response logging in development mode
   - Error categorization and user-friendly error messages

3. Query parameters with `?` suffix are optional.

4. All responses follow a consistent format with proper HTTP status codes:
   - `200`: Success
   - `201`: Created
   - `400`: Bad Request (validation errors)
   - `401`: Unauthorized (authentication required)
   - `403`: Forbidden (insufficient permissions)
   - `404`: Not Found
   - `429`: Too Many Requests (rate limiting)
   - `500`: Internal Server Error

5. Validation errors (400, 422) return an `errors` object with field-specific error messages:
   ```json
   {
     "message": "Validation failed",
     "errors": {
       "email": ["Email is required", "Email must be valid"],
       "password": ["Password must be at least 8 characters"]
     }
   }
   ```
