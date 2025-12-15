# End-to-End Flow Validation

**Version:** 1.0.0
**Last Updated:** December 2024

This document defines the critical user journeys in ApplyForUs and validates each flow from frontend to backend.

---

## Table of Contents

1. [Registration & Onboarding Flow](#1-registration--onboarding-flow)
2. [Login Flow (Standard, OAuth, MFA)](#2-login-flow)
3. [Profile Completion Flow](#3-profile-completion-flow)
4. [Resume Creation & AI Enhancement](#4-resume-creation--ai-enhancement)
5. [Job Search & Save Flow](#5-job-search--save-flow)
6. [Application Automation Flow](#6-application-automation-flow)
7. [Subscription & Payment Flow](#7-subscription--payment-flow)
8. [Settings & Preferences Flow](#8-settings--preferences-flow)

---

## 1. Registration & Onboarding Flow

### User Journey
1. User visits landing page
2. Clicks "Get Started Free"
3. Fills registration form (email, password, name)
4. Submits form
5. Receives verification email
6. Clicks verification link
7. Redirected to onboarding wizard

### Technical Flow

```
Frontend (web)                     Auth Service                    Notification Service
     │                                  │                                │
     │  POST /auth/register             │                                │
     │─────────────────────────────────>│                                │
     │                                  │  Validate input                │
     │                                  │  Hash password                 │
     │                                  │  Create user (unverified)     │
     │                                  │  Generate verification token   │
     │                                  │                                │
     │                                  │  POST /notifications/email     │
     │                                  │───────────────────────────────>│
     │                                  │                                │  Send verification email
     │  201 Created                     │                                │
     │<─────────────────────────────────│                                │
     │  { message: "Check email" }      │                                │
     │                                  │                                │
     │  User clicks email link          │                                │
     │                                  │                                │
     │  POST /auth/verify-email         │                                │
     │─────────────────────────────────>│                                │
     │                                  │  Verify token                  │
     │                                  │  Mark user verified            │
     │                                  │  Generate JWT tokens           │
     │  200 OK                          │                                │
     │<─────────────────────────────────│                                │
     │  { accessToken, refreshToken }   │                                │
     │                                  │                                │
     │  Redirect to /onboarding         │                                │
```

### Validation Points

| Step | Expected Behavior | Status |
|------|-------------------|--------|
| Form validation | Email format, password 8+ chars, uppercase, number | ✅ |
| Duplicate email check | Returns 409 Conflict | ✅ |
| Rate limiting | 5 requests/minute | ✅ |
| Verification email sent | Email delivered within 30s | ✅ |
| Token expiration | 24 hours validity | ✅ |
| Post-verification redirect | Redirect to onboarding | ✅ |

---

## 2. Login Flow

### 2.1 Standard Email/Password Login

```
Frontend                           Auth Service
     │                                  │
     │  POST /auth/login                │
     │  { email, password }             │
     │─────────────────────────────────>│
     │                                  │  Validate credentials
     │                                  │  Check if MFA enabled
     │                                  │
     │  [If MFA disabled]               │
     │  200 OK                          │
     │<─────────────────────────────────│
     │  { accessToken, refreshToken }   │
     │                                  │
     │  [If MFA enabled]                │
     │  200 OK                          │
     │<─────────────────────────────────│
     │  { requiresMfa: true, mfaToken } │
     │                                  │
     │  POST /auth/mfa/verify           │
     │  { mfaToken, code }              │
     │─────────────────────────────────>│
     │                                  │  Verify TOTP code
     │  200 OK                          │
     │<─────────────────────────────────│
     │  { accessToken, refreshToken }   │
```

### 2.2 OAuth Login (Google/LinkedIn/GitHub)

```
Frontend                           Auth Service                    OAuth Provider
     │                                  │                                │
     │  GET /auth/google                │                                │
     │─────────────────────────────────>│                                │
     │                                  │  302 Redirect                  │
     │<─────────────────────────────────│                                │
     │                                  │                                │
     │  Redirect to Google OAuth        │                                │
     │────────────────────────────────────────────────────────────────-->│
     │                                  │                                │
     │  User authenticates              │                                │
     │                                  │                                │
     │  Redirect with auth code         │                                │
     │<──────────────────────────────────────────────────────────────────│
     │                                  │                                │
     │  GET /auth/google/callback       │                                │
     │  ?code=xxx                       │                                │
     │─────────────────────────────────>│                                │
     │                                  │  Exchange code for tokens      │
     │                                  │───────────────────────────────>│
     │                                  │  Get user profile              │
     │                                  │<───────────────────────────────│
     │                                  │  Create/link user account      │
     │                                  │  Generate JWT tokens           │
     │  302 Redirect                    │                                │
     │<─────────────────────────────────│                                │
     │  → /dashboard?token=xxx          │                                │
```

### Validation Points

| Step | Expected Behavior | Status |
|------|-------------------|--------|
| Invalid credentials | Returns 401 Unauthorized | ✅ |
| Unverified email | Returns 403 with message | ✅ |
| Rate limiting | 10 requests/minute | ✅ |
| MFA flow | Requires valid TOTP code | ✅ |
| OAuth account linking | Links to existing account by email | ✅ |
| Token refresh | Works with valid refresh token | ✅ |

---

## 3. Profile Completion Flow

### User Journey
1. After registration, user enters profile wizard
2. Fills basic information (name, location, headline)
3. Adds work experience
4. Adds education
5. Adds skills
6. Sets job preferences
7. Profile marked complete

### Technical Flow

```
Frontend                           User Service                   AI Service
     │                                  │                              │
     │  GET /profile                    │                              │
     │─────────────────────────────────>│                              │
     │  { profile, completeness: 20% }  │                              │
     │<─────────────────────────────────│                              │
     │                                  │                              │
     │  PUT /profile                    │                              │
     │  { firstName, lastName, ... }    │                              │
     │─────────────────────────────────>│                              │
     │  200 OK                          │                              │
     │<─────────────────────────────────│                              │
     │                                  │                              │
     │  POST /profile/work-experience   │                              │
     │  { company, title, dates, ... }  │                              │
     │─────────────────────────────────>│                              │
     │  201 Created                     │                              │
     │<─────────────────────────────────│                              │
     │                                  │                              │
     │  GET /skills/suggestions         │                              │
     │─────────────────────────────────>│                              │
     │                                  │  POST /api/ai/generate/skills │
     │                                  │─────────────────────────────>│
     │                                  │                              │  Analyze experience
     │                                  │<─────────────────────────────│
     │  { suggestions: [...] }          │                              │
     │<─────────────────────────────────│                              │
     │                                  │                              │
     │  POST /skills                    │                              │
     │  { name, proficiency }           │                              │
     │─────────────────────────────────>│                              │
     │  201 Created                     │                              │
     │<─────────────────────────────────│                              │
     │                                  │                              │
     │  PUT /preferences                │                              │
     │  { jobTypes, locations, ... }    │                              │
     │─────────────────────────────────>│                              │
     │  200 OK                          │                              │
     │<─────────────────────────────────│                              │
     │                                  │                              │
     │  GET /profile/completeness       │                              │
     │─────────────────────────────────>│                              │
     │  { completeness: 100% }          │                              │
     │<─────────────────────────────────│                              │
```

### Completeness Score Calculation

| Component | Weight | Status |
|-----------|--------|--------|
| Basic Info (name, location) | 15% | ✅ |
| Headline/Bio | 10% | ✅ |
| Profile Photo | 5% | ✅ |
| Work Experience (1+) | 25% | ✅ |
| Education (1+) | 15% | ✅ |
| Skills (5+) | 15% | ✅ |
| Job Preferences | 15% | ✅ |

---

## 4. Resume Creation & AI Enhancement

### User Journey
1. User creates new resume or imports existing
2. Fills/edits resume sections
3. Uses AI to optimize content
4. Previews and exports resume

### Technical Flow

```
Frontend                     Resume Service                  AI Service
     │                            │                              │
     │  POST /resumes             │                              │
     │  { title, templateId }     │                              │
     │───────────────────────────>│                              │
     │  201 Created               │                              │
     │<───────────────────────────│                              │
     │  { id, sections: [] }      │                              │
     │                            │                              │
     │  POST /resumes/:id/sections│                              │
     │  { type: "experience" }    │                              │
     │───────────────────────────>│                              │
     │  201 Created               │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  POST /resumes/:id/optimize│                              │
     │───────────────────────────>│                              │
     │                            │  POST /api/ai/optimize/resume │
     │                            │─────────────────────────────>│
     │                            │                              │  Analyze resume
     │                            │                              │  Generate suggestions
     │                            │<─────────────────────────────│
     │  { suggestions: [...] }    │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  POST /resumes/:id/ats-score│                             │
     │───────────────────────────>│                              │
     │                            │  POST /ai/ats-score          │
     │                            │─────────────────────────────>│
     │                            │                              │  Calculate ATS score
     │                            │<─────────────────────────────│
     │  { score: 85, issues: [] } │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  GET /resumes/:id/export/pdf│                             │
     │───────────────────────────>│                              │
     │  Binary PDF file           │                              │
     │<───────────────────────────│                              │
```

### AI Enhancement Features

| Feature | Endpoint | Status |
|---------|----------|--------|
| Summary generation | `/api/ai/generate/summary` | ✅ |
| Bullet point enhancement | `/api/ai/generate/bullets` | ✅ |
| Skill suggestions | `/api/ai/generate/skills` | ✅ |
| ATS optimization | `/ai/ats-score` | ✅ |
| Cover letter generation | `/api/ai/generate/cover-letter` | ✅ |

---

## 5. Job Search & Save Flow

### Technical Flow

```
Frontend                     Job Service                    AI Service
     │                            │                              │
     │  GET /jobs/search          │                              │
     │  ?q=engineer&loc=SF        │                              │
     │───────────────────────────>│                              │
     │                            │  Query job database          │
     │                            │  Apply filters               │
     │  { jobs: [...], total }    │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  POST /jobs/match-score    │                              │
     │  { jobId, resumeId }       │                              │
     │───────────────────────────>│                              │
     │                            │  POST /api/ai/match/job      │
     │                            │─────────────────────────────>│
     │                            │                              │  Calculate match
     │                            │<─────────────────────────────│
     │  { score: 87, reasons }    │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  POST /jobs/saved          │                              │
     │  { jobId }                 │                              │
     │───────────────────────────>│                              │
     │  201 Created               │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  GET /jobs/recommended     │                              │
     │───────────────────────────>│                              │
     │                            │  POST /api/ai/match/jobs     │
     │                            │─────────────────────────────>│
     │                            │                              │  Find best matches
     │                            │<─────────────────────────────│
     │  { recommendations: [...] }│                              │
     │<───────────────────────────│                              │
```

### Search Filters

| Filter | Type | Status |
|--------|------|--------|
| Keywords | Text | ✅ |
| Location | String/Geo | ✅ |
| Radius | Number (miles) | ✅ |
| Job Type | Enum (Full-time, Part-time, etc.) | ✅ |
| Remote | Boolean | ✅ |
| Salary Range | Number range | ✅ |
| Experience Level | Enum | ✅ |
| Date Posted | Date range | ✅ |
| Company | String | ✅ |

---

## 6. Application Automation Flow

### User Journey
1. User selects jobs to apply
2. Selects resume and cover letter
3. Starts auto-apply process
4. Monitors application progress
5. Reviews results

### Technical Flow

```
Frontend                     Auto-Apply Service              External Job Sites
     │                            │                              │
     │  POST /engine/batch-apply  │                              │
     │  { jobIds, resumeId,       │                              │
     │    coverLetterId }         │                              │
     │───────────────────────────>│                              │
     │  202 Accepted              │                              │
     │<───────────────────────────│                              │
     │  { batchId, status }       │  Queue applications          │
     │                            │                              │
     │                            │  For each job:               │
     │                            │  ────────────────────────────│
     │                            │  │ Launch browser            │
     │                            │  │ Navigate to job site      │──>│
     │                            │  │ Fill application form     │<──│
     │                            │  │ Submit application        │──>│
     │                            │  │ Capture confirmation      │<──│
     │                            │  │ Update status             │
     │                            │  ────────────────────────────│
     │                            │                              │
     │  GET /engine/status/:id    │                              │
     │───────────────────────────>│                              │
     │  { status: "in_progress",  │                              │
     │    completed: 5, total: 10 │                              │
     │    failed: 1 }             │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  [Polling until complete]  │                              │
     │                            │                              │
     │  GET /applications         │                              │
     │───────────────────────────>│                              │
     │  { applications: [...] }   │                              │
     │<───────────────────────────│                              │
```

### Application Status Flow

```
QUEUED → IN_PROGRESS → SUBMITTED → (INTERVIEWING → OFFER / REJECTED)
                    ↘
                      FAILED (can retry)
```

---

## 7. Subscription & Payment Flow

### User Journey
1. User views pricing
2. Selects subscription tier
3. Redirected to Stripe checkout
4. Completes payment
5. Subscription activated

### Technical Flow

```
Frontend                     Payment Service                 Stripe
     │                            │                              │
     │  POST /subscriptions/      │                              │
     │  checkout-session          │                              │
     │  { tier: "pro", period }   │                              │
     │───────────────────────────>│                              │
     │                            │  Create checkout session     │
     │                            │─────────────────────────────>│
     │                            │<─────────────────────────────│
     │  { sessionId, url }        │                              │
     │<───────────────────────────│                              │
     │                            │                              │
     │  Redirect to Stripe        │                              │
     │────────────────────────────────────────────────────────-->│
     │                            │                              │
     │  User completes payment    │                              │
     │                            │                              │
     │  Redirect back to app      │                              │
     │<──────────────────────────────────────────────────────────│
     │                            │                              │
     │                            │  POST /stripe/webhook        │
     │                            │<─────────────────────────────│
     │                            │  checkout.session.completed  │
     │                            │                              │
     │                            │  Activate subscription       │
     │                            │  Send confirmation email     │
     │                            │                              │
     │  GET /subscription         │                              │
     │───────────────────────────>│                              │
     │  { tier: "pro", active }   │                              │
     │<───────────────────────────│                              │
```

### Subscription Tiers

| Tier | Price/Month | Applications/Month | Features |
|------|-------------|-------------------|----------|
| Free | $0 | 5 | Basic search, manual apply |
| Starter | $9.99 | 50 | AI resume, cover letters |
| Basic | $19.99 | 150 | Auto-apply, tracking |
| Pro | $39.99 | 500 | Interview prep, priority |
| Business | $79.99 | 1,500 | Team features, analytics |
| Enterprise | Custom | Unlimited | API, custom AI, SLA |

---

## 8. Settings & Preferences Flow

### Available Settings

| Category | Settings | Endpoint |
|----------|----------|----------|
| Account | Email, password, MFA | Auth Service |
| Profile | Personal info, photo | User Service |
| Privacy | Data visibility, export | User Service |
| Notifications | Email, push, frequency | Notification Service |
| Job Preferences | Types, locations, salary | User Service |
| Connected Accounts | OAuth providers | Auth Service |

### Technical Flow

```
Frontend                     Multiple Services
     │                            │
     │  GET /auth/me              │ Auth Service
     │───────────────────────────>│
     │  { user, oauth, mfa }      │
     │<───────────────────────────│
     │                            │
     │  GET /profile              │ User Service
     │───────────────────────────>│
     │  { profile }               │
     │<───────────────────────────│
     │                            │
     │  GET /preferences          │ User Service
     │───────────────────────────>│
     │  { preferences }           │
     │<───────────────────────────│
     │                            │
     │  GET /notifications/       │ Notification Service
     │  preferences/:userId       │
     │───────────────────────────>│
     │  { notificationPrefs }     │
     │<───────────────────────────│
     │                            │
     │  [User makes changes]      │
     │                            │
     │  PUT /preferences          │ User Service
     │───────────────────────────>│
     │  200 OK                    │
     │<───────────────────────────│
```

---

## Validation Summary

### All Flows Validated

| Flow | Status | Notes |
|------|--------|-------|
| Registration & Onboarding | ✅ Valid | Email verification working |
| Login (Standard) | ✅ Valid | Rate limiting active |
| Login (OAuth) | ✅ Valid | Google, LinkedIn, GitHub |
| Login (MFA) | ✅ Valid | TOTP working |
| Profile Completion | ✅ Valid | Completeness score calculating |
| Resume Creation | ✅ Valid | Version history working |
| AI Enhancement | ✅ Valid | All AI endpoints functional |
| Job Search | ✅ Valid | Filters and pagination working |
| Job Save/Recommendations | ✅ Valid | ML matching active |
| Auto-Apply | ✅ Valid | Browser automation working |
| Subscription | ✅ Valid | Stripe integration complete |
| Virtual Coins | ✅ Valid | Boost feature working |
| Settings | ✅ Valid | All settings sync properly |

---

## Error Handling

All flows implement:
- Retry logic for transient failures
- User-friendly error messages
- Fallback states for degraded service
- Audit logging for troubleshooting

---

*Document maintained by ApplyForUs Engineering Team*
*© 2024 ApplyForUs Inc.*
