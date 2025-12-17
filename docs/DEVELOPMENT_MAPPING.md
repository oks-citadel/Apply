# ApplyForUs AI Platform - Development Mapping Structure

**Version:** 2.0.0
**Last Updated:** December 16, 2025
**Purpose:** Engineering team reference for feature ownership, component alignment, and implementation planning

---

## Table of Contents

1. [Feature-to-Module Mapping](#1-feature-to-module-mapping)
2. [Frontend Components ↔ Backend Services Alignment](#2-frontend-components--backend-services-alignment)
3. [API Ownership per Feature](#3-api-ownership-per-feature)
4. [Infrastructure and Environment Dependencies](#4-infrastructure-and-environment-dependencies)
5. [Build Order and Implementation Sequence](#5-build-order-and-implementation-sequence)
6. [Testing Strategy Mapped to Each Feature](#6-testing-strategy-mapped-to-each-feature)

---

## 1. Feature-to-Module Mapping

### 1.1 Authentication & Authorization

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| User Registration | `apps/web/src/app/(auth)/register` | `auth-service/modules/auth` | auth_db.users | Email (SendGrid) |
| User Login | `apps/web/src/app/(auth)/login` | `auth-service/modules/auth` | auth_db.users | Redis (sessions) |
| Password Reset | `apps/web/src/app/(auth)/forgot-password` | `auth-service/modules/auth` | auth_db.users | Email |
| Email Verification | `apps/web/src/app/(auth)/verify-email` | `auth-service/modules/auth` | auth_db.users | Email |
| Google OAuth | `apps/web/src/components/auth/SocialLoginButtons` | `auth-service/modules/auth/strategies/google` | auth_db.users | Google OAuth API |
| LinkedIn OAuth | `apps/web/src/components/auth/SocialLoginButtons` | `auth-service/modules/auth/strategies/linkedin` | auth_db.users | LinkedIn OAuth API |
| GitHub OAuth | `apps/web/src/components/auth/SocialLoginButtons` | `auth-service/modules/auth/strategies/github` | auth_db.users | GitHub OAuth API |
| MFA Setup | `apps/web/src/components/auth/MfaVerification` | `auth-service/modules/auth` | auth_db.users | Speakeasy (TOTP) |
| Session Management | `apps/web/src/stores/authStore` | `auth-service/modules/auth` | Redis | - |

### 1.2 User Profile Management

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Profile CRUD | `apps/web/src/app/(dashboard)/profile` | `user-service/modules/profile` | user_db.profiles | - |
| Profile Photo | `apps/web/src/components/forms/ProfileForm` | `user-service/modules/storage` | user_db.profiles | AWS S3 |
| Work Experience | `apps/web/src/components/forms/WorkExperienceForm` | `user-service/modules/career` | user_db.work_experiences | - |
| Education | `apps/web/src/components/forms/EducationForm` | `user-service/modules/career` | user_db.educations | - |
| Certifications | `apps/web/src/components/forms/CertificationsForm` | `user-service/modules/career` | user_db.certifications | - |
| Skills | `apps/web/src/components/forms/SkillsForm` | `user-service/modules/skills` | user_db.skills | AI Service |
| Job Preferences | `apps/web/src/app/(dashboard)/settings` | `user-service/modules/preferences` | user_db.preferences | - |
| Subscription | `apps/web/src/app/(dashboard)/settings` | `user-service/modules/subscription` | user_db.subscriptions | Stripe |

### 1.3 Resume Management

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Resume List | `apps/web/src/app/(dashboard)/resumes` | `resume-service/modules/resumes` | resume_db.resumes | - |
| Resume Builder | `apps/web/src/app/ai-tools/resume-builder` | `resume-service/modules/resumes` | resume_db.resumes | AI Service |
| Resume Upload | `apps/web/src/app/(dashboard)/resumes/new` | `resume-service/modules/parser` | resume_db.resumes | AWS S3 |
| Resume Parsing | - (backend triggered) | `resume-service/modules/parser` | resume_db.resumes | AI Service |
| Resume Templates | `apps/web/src/app/(dashboard)/resumes/templates` | `resume-service/modules/templates` | resume_db.templates | - |
| ATS Optimization | `apps/web/src/app/ai-tools/resume-optimizer` | `resume-service/modules/sections`, `ai-service` | resume_db.resumes | OpenAI |
| Resume Export | `apps/web/src/app/(dashboard)/resumes/[id]` | `resume-service/modules/export` | resume_db.resumes | - |
| Job Customization | `apps/web/src/app/(dashboard)/resumes/[id]/customize` | `resume-service/modules/personalization` | resume_db.aligned_resumes | AI Service |
| Cover Letter | `apps/web/src/app/ai-tools/cover-letter-generator` | `resume-service/modules/cover-letter`, `ai-service` | resume_db.cover_letters | OpenAI |

### 1.4 Job Search & Discovery

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Job Search | `apps/web/src/app/(dashboard)/jobs` | `job-service/modules/jobs` | job_db.jobs | Elasticsearch |
| Job Details | `apps/web/src/app/(dashboard)/jobs/[id]` | `job-service/modules/jobs` | job_db.jobs | - |
| Job Recommendations | `apps/web/src/app/(dashboard)/jobs` | `job-service/modules/scoring`, `ai-service` | job_db.jobs | Pinecone, OpenAI |
| Similar Jobs | `apps/web/src/app/(dashboard)/jobs/[id]` | `job-service/modules/jobs` | job_db.jobs | Pinecone |
| Save Jobs | `apps/web/src/components/features/jobs/JobCard` | `job-service/modules/jobs` | job_db.saved_jobs | - |
| Job Alerts | `apps/web/src/app/(dashboard)/jobs/alerts` | `job-service/modules/alerts` | job_db.job_alerts | Notification Service |
| Job Match Score | `apps/web/src/components/features/jobs/JobCard` | `job-service/modules/scoring`, `ai-service` | - | OpenAI, Pinecone |
| Interview Questions | `apps/web/src/app/ai-tools/interview-prep` | `job-service/modules/jobs`, `ai-service` | - | OpenAI |
| Salary Prediction | `apps/web/src/app/ai-tools/salary-assistant` | `ai-service` | - | OpenAI |
| Job Reporting | `apps/web/src/components/features/jobs/ReportJobModal` | `job-service/modules/reports` | job_db.job_reports | - |

### 1.5 Application Management

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Application List | `apps/web/src/app/(dashboard)/applications` | `auto-apply-service/modules/applications` | autoapply_db.applications | - |
| Application Details | `apps/web/src/app/(dashboard)/applications/[id]` | `auto-apply-service/modules/applications` | autoapply_db.applications | - |
| Manual Tracking | `apps/web/src/app/(dashboard)/applications` | `auto-apply-service/modules/applications` | autoapply_db.applications | - |
| Status Updates | `apps/web/src/components/features/applications/ApplicationStatusBadge` | `auto-apply-service/modules/applications` | autoapply_db.applications | Notification Service |

### 1.6 Auto-Apply System

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Auto-Apply Settings | `apps/web/src/app/(dashboard)/auto-apply/settings` | `auto-apply-service/modules/engine` | autoapply_db.settings | - |
| Application Engine | - (backend only) | `auto-apply-service/modules/engine` | autoapply_db.applications | Playwright, ATS APIs |
| Answer Library | `apps/web/src/app/(dashboard)/auto-apply` | `auto-apply-service/modules/answer-library` | autoapply_db.answers | - |
| Activity Log | `apps/web/src/app/(dashboard)/auto-apply/activity` | `auto-apply-service/modules/applications` | autoapply_db.applications | - |
| Quick Review | `apps/web/src/components/features/auto-apply/QuickReviewPanel` | `auto-apply-service/modules/engine` | - | - |
| ATS Adapters | - (backend only) | `auto-apply-service/modules/adapters/*` | - | Greenhouse, Lever, etc. |

### 1.7 AI Tools

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Resume Builder AI | `apps/web/src/app/ai-tools/resume-builder` | `ai-service/routes/generate` | - | OpenAI |
| Cover Letter Gen | `apps/web/src/app/ai-tools/cover-letter-generator` | `ai-service/routes/generate` | - | OpenAI |
| Interview Prep | `apps/web/src/app/ai-tools/interview-prep` | `ai-service/routes/interview` | - | OpenAI |
| Salary Assistant | `apps/web/src/app/ai-tools/salary-assistant` | `ai-service/routes/salary` | - | OpenAI |
| Skills Gap Analysis | `apps/web/src/app/ai-tools/skills-gap` | `ai-service/routes/recommendations` | - | OpenAI |
| Resume Optimization | `apps/web/src/app/ai-tools/resume-optimizer` | `ai-service/routes/optimize` | - | OpenAI |

### 1.8 Notifications

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Notification Center | `apps/web/src/components/features/notifications/NotificationCenter` | `notification-service/modules/notifications` | notification_db.notifications | - |
| Email Notifications | - (backend triggered) | `notification-service/modules/email` | notification_db.notifications | SendGrid/SMTP |
| Push Notifications | - (mobile/extension) | `notification-service/modules/push` | notification_db.device_tokens | FCM |
| Notification Preferences | `apps/web/src/app/(dashboard)/notifications/settings` | `notification-service/modules/notifications` | notification_db.preferences | - |

### 1.9 Analytics

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Dashboard Analytics | `apps/web/src/app/(dashboard)/analytics` | `analytics-service/modules/analytics` | analytics_db.events | - |
| Application Funnel | `apps/web/src/components/features/analytics/ApplicationsChart` | `analytics-service/modules/analytics` | analytics_db.events | - |
| Export Analytics | `apps/web/src/components/features/analytics/ExportButton` | `analytics-service/modules/analytics` | analytics_db.events | - |
| SLA Tracking | - (backend/admin) | `analytics-service/modules/sla` | analytics_db.sla_contracts | - |

### 1.10 Billing & Subscriptions

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Pricing Page | `apps/web/src/app/(marketing)/pricing` | `payment-service/modules/subscriptions` | payment_db.subscriptions | - |
| Checkout | `apps/web/src/components/features/billing/CheckoutForm` | `payment-service/modules/stripe` | payment_db.subscriptions | Stripe |
| Billing Portal | `apps/web/src/app/(dashboard)/settings` | `payment-service/modules/stripe` | - | Stripe |
| Usage Tracking | - (backend) | `payment-service/modules/subscriptions` | payment_db.usage | - |
| African Payments | `apps/web/src/components/features/billing/CheckoutForm` | `payment-service/modules/paystack`, `flutterwave` | payment_db.transactions | Paystack, Flutterwave |

### 1.11 Admin Features

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Admin Dashboard | `apps/admin/src/app/` | All services | All DBs | - |
| User Management | `apps/admin/src/app/users` | `auth-service/modules/users` | auth_db.users | - |
| Service Health | `apps/admin/src/app/services` | All services (health endpoints) | - | - |
| Platform Analytics | `apps/admin/src/app/analytics` | `analytics-service/modules/analytics` | analytics_db | - |
| Feature Flags | `apps/admin/src/app/feature-flags` | `packages/feature-flags` | - | Redis |

### 1.12 Employer Features

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Job Posting | `apps/employer/src/app/jobs/new` | `job-service/modules/employer` | job_db.jobs | - |
| Applicant Tracking | `apps/employer/src/app/jobs/[id]/applications` | `job-service/modules/employer` | job_db.applications | - |
| Candidate Search | `apps/employer/src/app/candidates` | `job-service/modules/employer` | resume_db.resumes | Elasticsearch |
| Company Profile | `apps/employer/src/app/company` | `job-service/modules/companies` | job_db.companies | - |

### 1.13 B2B/Multi-Tenant

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Tenant Setup | - (admin) | `user-service/modules/tenant` | user_db.tenants | - |
| White-Label | - (config) | `user-service/modules/tenant` | user_db.tenants | - |
| Cohort Management | - (tenant admin) | `user-service/modules/tenant` | user_db.cohorts | - |
| Placement Tracking | - (tenant admin) | `user-service/modules/tenant` | user_db.placements | - |
| SSO Integration | - (config) | `auth-service/modules/auth` | auth_db.users | SAML/OIDC providers |

### 1.14 Browser Extension

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Quick Apply | `apps/extension/src/popup/QuickApply` | `auto-apply-service/modules/applications` | autoapply_db.applications | - |
| Form Auto-Fill | `apps/extension/src/content/formFiller` | - (local processing) | - | - |
| Job Detection | `apps/extension/src/content/autofill/adapters/*` | - (local processing) | - | - |
| Resume Selector | `apps/extension/src/popup/ResumeSelector` | `resume-service/modules/resumes` | resume_db.resumes | - |

### 1.15 Mobile App

| Feature | Frontend Module | Backend Service | Database | External Services |
|---------|-----------------|-----------------|----------|-------------------|
| Dashboard | `apps/mobile/src/screens/DashboardScreen` | Multiple services | Multiple | - |
| Job Search | `apps/mobile/src/screens/JobListScreen` | `job-service/modules/jobs` | job_db.jobs | - |
| Applications | `apps/mobile/src/screens/ApplicationsScreen` | `auto-apply-service/modules/applications` | autoapply_db.applications | - |
| Push Notifications | `apps/mobile/src/services/notifications` | `notification-service/modules/push` | notification_db | FCM |

---

## 2. Frontend Components ↔ Backend Services Alignment

### 2.1 Web App Component Mapping

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx ──────────────► auth-service: POST /auth/login
│   │   ├── register/page.tsx ───────────► auth-service: POST /auth/register
│   │   ├── forgot-password/page.tsx ────► auth-service: POST /auth/forgot-password
│   │   ├── reset-password/page.tsx ─────► auth-service: POST /auth/reset-password
│   │   ├── verify-email/page.tsx ───────► auth-service: POST /auth/verify-email
│   │   └── oauth/callback/page.tsx ─────► auth-service: GET /auth/{provider}/callback
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   │   └── Components:
│   │   │       ├── StatsCards ──────────► analytics-service: GET /analytics/dashboard
│   │   │       ├── RecentActivity ──────► analytics-service: GET /analytics/activity
│   │   │       └── QuickActions ────────► Multiple services
│   │   │
│   │   ├── profile/page.tsx
│   │   │   └── Components:
│   │   │       ├── ProfileForm ─────────► user-service: GET/PUT /profile
│   │   │       ├── WorkExperienceForm ──► user-service: CRUD /career/work-experience
│   │   │       ├── EducationForm ───────► user-service: CRUD /career/education
│   │   │       └── SkillsForm ──────────► user-service: CRUD /skills
│   │   │
│   │   ├── jobs/page.tsx
│   │   │   └── Components:
│   │   │       ├── JobFilters ──────────► job-service: GET /jobs/search
│   │   │       ├── JobList ─────────────► job-service: GET /jobs/search
│   │   │       ├── JobCard ─────────────► job-service: GET /jobs/:id
│   │   │       └── RecommendedJobs ─────► job-service: GET /jobs/recommended
│   │   │
│   │   ├── jobs/[id]/page.tsx
│   │   │   └── Components:
│   │   │       ├── JobDetails ──────────► job-service: GET /jobs/:id
│   │   │       ├── MatchScore ──────────► job-service: GET /jobs/:id/match-score
│   │   │       ├── SimilarJobs ─────────► job-service: GET /jobs/similar/:id
│   │   │       └── ApplyButton ─────────► auto-apply-service: POST /applications
│   │   │
│   │   ├── applications/page.tsx
│   │   │   └── Components:
│   │   │       ├── ApplicationList ─────► auto-apply-service: GET /applications
│   │   │       └── ApplicationFilters ──► auto-apply-service: GET /applications
│   │   │
│   │   ├── resumes/page.tsx
│   │   │   └── Components:
│   │   │       ├── ResumeList ──────────► resume-service: GET /resumes
│   │   │       └── ResumeCard ──────────► resume-service: GET /resumes/:id
│   │   │
│   │   ├── auto-apply/page.tsx
│   │   │   └── Components:
│   │   │       ├── AutoApplyToggle ─────► auto-apply-service: PUT /auto-apply/settings
│   │   │       ├── AutoApplyStats ──────► auto-apply-service: GET /auto-apply/activity
│   │   │       └── AnswerLibrary ───────► auto-apply-service: CRUD /auto-apply/answers
│   │   │
│   │   ├── analytics/page.tsx
│   │   │   └── Components:
│   │   │       ├── ApplicationsChart ───► analytics-service: GET /analytics/applications
│   │   │       ├── ResponseRateChart ───► analytics-service: GET /analytics/dashboard
│   │   │       └── ExportButton ────────► analytics-service: GET /analytics/export
│   │   │
│   │   └── settings/page.tsx
│   │       └── Components:
│   │           ├── AccountSettings ─────► auth-service: GET /auth/me, PUT /auth/password/change
│   │           ├── PreferencesForm ─────► user-service: GET/PUT /preferences
│   │           ├── SubscriptionInfo ────► user-service: GET /subscription
│   │           └── ConnectedAccounts ───► auth-service: POST /auth/oauth/disconnect
│   │
│   ├── ai-tools/
│   │   ├── resume-builder/page.tsx ─────► ai-service: POST /generate/resume-summary
│   │   ├── resume-optimizer/page.tsx ───► ai-service: POST /optimize/resume
│   │   ├── cover-letter-generator/page.tsx ─► ai-service: POST /generate/cover-letter
│   │   ├── interview-prep/page.tsx ─────► ai-service: POST /interview-prep/questions
│   │   ├── salary-assistant/page.tsx ───► ai-service: POST /salary/predict
│   │   └── skills-gap/page.tsx ─────────► ai-service: POST /recommendations/skills-gap
│   │
│   └── (marketing)/
│       └── pricing/page.tsx
│           └── Components:
│               ├── PricingTable ────────► payment-service: GET subscription tiers
│               └── CheckoutForm ────────► payment-service: POST /subscriptions/checkout-session
│
├── components/
│   ├── auth/
│   │   ├── SocialLoginButtons.tsx ──────► auth-service: OAuth endpoints
│   │   ├── MfaVerification.tsx ─────────► auth-service: POST /auth/mfa/verify
│   │   └── EmailVerificationBanner.tsx ─► auth-service: POST /auth/resend-verification
│   │
│   ├── features/
│   │   ├── billing/
│   │   │   ├── PricingTable.tsx ────────► Static config + payment-service
│   │   │   └── CheckoutForm.tsx ────────► payment-service: Stripe checkout
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationCenter.tsx ──► notification-service: GET /notifications
│   │   │   └── NotificationList.tsx ────► notification-service: PATCH /notifications/:id/read
│   │   │
│   │   └── analytics/
│   │       ├── ApplicationsChart.tsx ───► analytics-service
│   │       ├── StatsCards.tsx ──────────► analytics-service
│   │       └── ExportButton.tsx ────────► analytics-service
│   │
│   └── forms/
│       ├── LoginForm.tsx ───────────────► auth-service: POST /auth/login
│       ├── RegisterForm.tsx ────────────► auth-service: POST /auth/register
│       ├── ProfileForm.tsx ─────────────► user-service: PUT /profile
│       └── ResetPasswordForm.tsx ───────► auth-service: POST /auth/reset-password
│
├── stores/
│   └── authStore.ts
│       ├── login() ─────────────────────► auth-service: POST /auth/login
│       ├── register() ──────────────────► auth-service: POST /auth/register
│       ├── logout() ────────────────────► auth-service: POST /auth/logout
│       ├── refreshAccessToken() ────────► auth-service: POST /auth/refresh
│       └── checkAuth() ─────────────────► auth-service: GET /auth/me
│
└── lib/api/
    ├── client.ts ───────────────────────► Axios instance with interceptors
    ├── auth.ts ─────────────────────────► auth-service API calls
    ├── user.ts ─────────────────────────► user-service API calls
    ├── jobs.ts ─────────────────────────► job-service API calls
    ├── resumes.ts ──────────────────────► resume-service API calls
    ├── applications.ts ─────────────────► auto-apply-service API calls
    ├── ai.ts ───────────────────────────► ai-service API calls
    ├── analytics.ts ────────────────────► analytics-service API calls
    └── notifications.ts ────────────────► notification-service API calls
```

### 2.2 State Management Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STATE MANAGEMENT FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Component  │────►│    Store     │────►│  API Client  │────►│  Backend │
│              │     │  (Zustand)   │     │   (Axios)    │     │  Service │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────┘
       ▲                    │                    │                    │
       │                    │                    │                    │
       │              ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
       │              │   State   │        │  Request  │        │  Process  │
       │              │  Update   │        │ Intercept │        │  Request  │
       │              └───────────┘        └───────────┘        └───────────┘
       │                    │                    │                    │
       │                    │                    │                    │
       └────────────────────┴────────────────────┴────────────────────┘
                                  Response Flow

STORES:
├── authStore ─────► Authentication state, tokens, user info
├── useJobs ───────► Job search results, filters (React Query)
├── useResumes ────► Resume list, active resume (React Query)
├── useApplications ► Application list, stats (React Query)
└── useNotifications ► Notification list, unread count (React Query)
```

### 2.3 API Client Architecture

```typescript
// apps/web/src/lib/api/client.ts

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      await authStore.getState().refreshAccessToken();
      // Retry original request
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 3. API Ownership per Feature

### 3.1 Service API Ownership Matrix

| Feature Domain | Primary Service | Supporting Services | API Base Path |
|----------------|-----------------|---------------------|---------------|
| **Authentication** | auth-service | - | `/auth/*` |
| **User Profiles** | user-service | auth-service | `/profile/*`, `/career/*`, `/skills/*` |
| **Preferences** | user-service | - | `/preferences/*` |
| **Subscriptions** | payment-service | user-service | `/subscriptions/*` |
| **Jobs** | job-service | ai-service | `/jobs/*` |
| **Companies** | job-service | - | `/companies/*` |
| **Job Alerts** | job-service | notification-service | `/jobs/alerts/*` |
| **Resumes** | resume-service | ai-service | `/resumes/*` |
| **Templates** | resume-service | - | `/resumes/templates/*` |
| **Cover Letters** | ai-service | resume-service | `/generate/cover-letter` |
| **Applications** | auto-apply-service | job-service, resume-service | `/applications/*` |
| **Auto-Apply** | auto-apply-service | ai-service | `/auto-apply/*` |
| **AI Features** | ai-service | - | `/match/*`, `/generate/*`, `/optimize/*` |
| **Notifications** | notification-service | - | `/notifications/*` |
| **Analytics** | analytics-service | - | `/analytics/*` |
| **SLA** | analytics-service | - | `/sla/*` |

### 3.2 API Gateway Routing

```yaml
# Kong Gateway routing configuration

services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - paths: ["/api/auth"]
        strip_path: true

  - name: user-service
    url: http://user-service:8002
    routes:
      - paths: ["/api/profile", "/api/career", "/api/skills", "/api/preferences", "/api/subscription"]
        strip_path: true

  - name: job-service
    url: http://job-service:4002
    routes:
      - paths: ["/api/jobs", "/api/companies"]
        strip_path: true

  - name: resume-service
    url: http://resume-service:8004
    routes:
      - paths: ["/api/resumes"]
        strip_path: true

  - name: auto-apply-service
    url: http://auto-apply-service:8006
    routes:
      - paths: ["/api/applications", "/api/auto-apply"]
        strip_path: true

  - name: notification-service
    url: http://notification-service:8005
    routes:
      - paths: ["/api/notifications"]
        strip_path: true

  - name: analytics-service
    url: http://analytics-service:8007
    routes:
      - paths: ["/api/analytics", "/api/sla"]
        strip_path: true

  - name: payment-service
    url: http://payment-service:8009
    routes:
      - paths: ["/api/subscriptions", "/api/billing"]
        strip_path: true

  - name: ai-service
    url: http://ai-service:8008
    routes:
      - paths: ["/api/ai"]
        strip_path: true
```

### 3.3 Inter-Service Communication

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTER-SERVICE COMMUNICATION                         │
└─────────────────────────────────────────────────────────────────────────┘

auth-service ────────────────────────────────────────────────────────────┐
     │                                                                   │
     │ User ID validation                                                │
     ▼                                                                   │
user-service ◄───────────────────────────────────────────────────────────┤
     │                                                                   │
     │ Profile data                        Subscription data             │
     ▼                                           │                       │
resume-service                                   ▼                       │
     │                                    payment-service                │
     │ Resume for matching                       │                       │
     ▼                                           │                       │
ai-service ◄─────────────────────────────────────┘                       │
     │                                                                   │
     │ Match scores, AI responses                                        │
     ▼                                                                   │
job-service ◄────────────────────────────────────────────────────────────┤
     │                                                                   │
     │ Job details                                                       │
     ▼                                                                   │
auto-apply-service                                                       │
     │                                                                   │
     │ Application events                                                │
     ▼                                                                   │
notification-service ◄───────────────────────────────────────────────────┤
     │                                                                   │
     │ Analytics events                                                  │
     ▼                                                                   │
analytics-service ◄──────────────────────────────────────────────────────┘

COMMUNICATION PROTOCOLS:
├── Synchronous: HTTP/REST (internal service URLs)
├── Asynchronous: RabbitMQ/Azure Service Bus (events)
└── Cache: Redis (shared state, rate limiting)
```

---

## 4. Infrastructure and Environment Dependencies

### 4.1 Service Infrastructure Requirements

| Service | Compute | Memory | Storage | Scaling |
|---------|---------|--------|---------|---------|
| auth-service | 0.5 CPU | 512Mi | - | 2-5 replicas |
| user-service | 0.5 CPU | 512Mi | S3 (photos) | 2-5 replicas |
| job-service | 1 CPU | 1Gi | - | 2-10 replicas |
| resume-service | 0.5 CPU | 512Mi | S3 (files) | 2-5 replicas |
| auto-apply-service | 2 CPU | 2Gi | - | 2-10 replicas |
| notification-service | 0.25 CPU | 256Mi | - | 2-3 replicas |
| analytics-service | 0.5 CPU | 512Mi | - | 2-5 replicas |
| payment-service | 0.25 CPU | 256Mi | - | 2-3 replicas |
| ai-service | 1 CPU | 1Gi | - | 2-5 replicas |
| orchestrator-service | 0.5 CPU | 512Mi | - | 2-3 replicas |
| web (Next.js) | 0.5 CPU | 512Mi | - | 2-10 replicas |

### 4.2 Database Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATABASE DEPENDENCIES                             │
└─────────────────────────────────────────────────────────────────────────┘

PostgreSQL Flexible Server (applyforus-postgres)
├── applyforus_auth ────────► auth-service
│   └── Tables: users, ai_generations
│
├── applyforus_user ────────► user-service
│   └── Tables: profiles, work_experiences, educations,
│               certifications, skills, subscriptions,
│               tenants, tenant_users, cohorts, placements
│
├── applyforus_job ─────────► job-service
│   └── Tables: jobs, companies, saved_jobs, job_alerts,
│               job_reports, raw_job_listings, normalized_jobs
│
├── applyforus_resume ──────► resume-service
│   └── Tables: resumes, resume_versions, templates,
│               cover_letters, aligned_resumes
│
├── applyforus_autoapply ───► auto-apply-service
│   └── Tables: applications, auto_apply_settings,
│               answer_library, form_mappings
│
├── applyforus_notification ► notification-service
│   └── Tables: notifications, preferences, device_tokens
│
├── applyforus_analytics ───► analytics-service
│   └── Tables: analytics_events, sla_contracts,
│               sla_progress, sla_violations
│
└── applyforus_payment ─────► payment-service
    └── Tables: subscriptions, invoices, transactions

Redis Cache (applyforus-redis)
├── Session storage ────────► auth-service
├── Token blacklist ────────► auth-service
├── API response cache ─────► all services
├── Rate limiting ──────────► API Gateway
├── Feature flags ──────────► all services
└── Job queues (Bull) ──────► auto-apply-service, notification-service
```

### 4.3 External Service Dependencies

| External Service | Purpose | Services Using | Fallback |
|------------------|---------|----------------|----------|
| **OpenAI API** | LLM, embeddings | ai-service | Anthropic Claude |
| **Anthropic API** | Alternative LLM | ai-service | OpenAI |
| **Pinecone** | Vector search | ai-service, job-service | PostgreSQL pgvector |
| **Stripe** | Payments (Global) | payment-service | - |
| **Paystack** | Payments (Africa) | payment-service | Flutterwave |
| **Flutterwave** | Payments (Africa) | payment-service | Paystack |
| **SendGrid** | Email | notification-service | SMTP |
| **Firebase FCM** | Mobile push | notification-service | APNS (iOS) |
| **AWS S3** | File storage | user-service, resume-service | Azure Blob |
| **Google OAuth** | Social login | auth-service | - |
| **LinkedIn OAuth** | Social login | auth-service | - |
| **GitHub OAuth** | Social login | auth-service | - |

### 4.4 Environment Configuration

#### Development Environment
```yaml
# docker-compose.yml services
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  elasticsearch:
    image: elasticsearch:8.11.0
    ports: ["9200:9200"]

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports: ["5672:5672", "15672:15672"]

  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]
```

#### Staging Environment (Azure)
- **AKS**: applyforus-aks (staging namespace)
- **PostgreSQL**: applyforus-postgres (staging DB)
- **Redis**: applyforus-redis
- **Service Bus**: applyforus-servicebus
- **Key Vault**: applyforus-kv
- **ACR**: applyforusacr.azurecr.io

#### Production Environment (Azure)
- **AKS**: applyforus-aks (production namespace)
- **PostgreSQL**: applyforus-postgres (prod DB, HA)
- **Redis**: applyforus-redis (Premium tier)
- **Service Bus**: applyforus-servicebus
- **Key Vault**: applyforus-kv
- **ACR**: applyforusacr.azurecr.io
- **Application Insights**: applyforus-appinsights
- **Front Door**: applyforus-frontdoor

### 4.5 Environment Variables by Service

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES BY SERVICE                      │
└─────────────────────────────────────────────────────────────────────────┘

COMMON (All Services):
├── NODE_ENV
├── PORT
├── DATABASE_URL
├── REDIS_URL
├── LOG_LEVEL
├── AZURE_APP_INSIGHTS_KEY
└── SERVICE_NAME

auth-service:
├── JWT_SECRET
├── JWT_REFRESH_SECRET
├── JWT_EXPIRY (15m)
├── JWT_REFRESH_EXPIRY (7d)
├── GOOGLE_CLIENT_ID
├── GOOGLE_CLIENT_SECRET
├── GOOGLE_CALLBACK_URL
├── LINKEDIN_CLIENT_ID
├── LINKEDIN_CLIENT_SECRET
├── LINKEDIN_CALLBACK_URL
├── GITHUB_CLIENT_ID
├── GITHUB_CLIENT_SECRET
└── GITHUB_CALLBACK_URL

user-service:
├── AWS_ACCESS_KEY_ID
├── AWS_SECRET_ACCESS_KEY
├── AWS_S3_BUCKET
└── AWS_REGION

job-service:
├── ELASTICSEARCH_URL
├── AI_SERVICE_URL
└── JOB_INGESTION_CRON

resume-service:
├── AWS_S3_BUCKET
├── AI_SERVICE_URL
└── OPENAI_API_KEY (for direct calls)

auto-apply-service:
├── PLAYWRIGHT_HEADLESS
├── PROXY_URL
├── AI_SERVICE_URL
├── JOB_SERVICE_URL
└── RESUME_SERVICE_URL

notification-service:
├── SMTP_HOST
├── SMTP_PORT
├── SMTP_USER
├── SMTP_PASSWORD
├── SENDGRID_API_KEY
├── FIREBASE_PROJECT_ID
├── FIREBASE_PRIVATE_KEY
└── FIREBASE_CLIENT_EMAIL

analytics-service:
└── (uses common only)

payment-service:
├── STRIPE_SECRET_KEY
├── STRIPE_WEBHOOK_SECRET
├── PAYSTACK_SECRET_KEY
├── FLUTTERWAVE_SECRET_KEY
└── FLUTTERWAVE_ENCRYPTION_KEY

ai-service:
├── OPENAI_API_KEY
├── OPENAI_ORG_ID
├── ANTHROPIC_API_KEY
├── PINECONE_API_KEY
├── PINECONE_ENVIRONMENT
└── PINECONE_INDEX_NAME
```

---

## 5. Build Order and Implementation Sequence

### 5.1 Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUILD DEPENDENCY GRAPH                            │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   packages/  │
                              │   (shared)   │
                              └──────┬───────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ @applyforus/    │       │ @applyforus/    │       │ @applyforus/    │
│ types           │       │ logging         │       │ telemetry       │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   ▼
                        ┌─────────────────┐
                        │ @applyforus/    │
                        │ shared          │
                        └────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────────┐
         │                       │                           │
         ▼                       ▼                           ▼
┌─────────────────┐   ┌─────────────────┐       ┌─────────────────┐
│ @applyforus/    │   │ @applyforus/    │       │ @applyforus/    │
│ security        │   │ feature-flags   │       │ ui              │
└────────┬────────┘   └────────┬────────┘       └────────┬────────┘
         │                     │                         │
         └─────────────────────┼─────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
    ▼                          ▼                          ▼
┌───────────┐           ┌───────────┐           ┌───────────┐
│ services/ │           │ services/ │           │ apps/     │
│ auth      │           │ user      │           │ web       │
└─────┬─────┘           └─────┬─────┘           └─────┬─────┘
      │                       │                       │
      │                       │                       │
      ▼                       ▼                       ▼
┌───────────┐           ┌───────────┐           ┌───────────┐
│ services/ │           │ services/ │           │ apps/     │
│ job       │           │ resume    │           │ mobile    │
└─────┬─────┘           └─────┬─────┘           └─────┬─────┘
      │                       │                       │
      └───────────────────────┼───────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ services/         │
                    │ auto-apply        │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ notification    │  │ analytics       │  │ payment         │
│ service         │  │ service         │  │ service         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ orchestrator      │
                    │ service           │
                    └───────────────────┘
```

### 5.2 Implementation Phases

#### Phase 1: Foundation (Weeks 1-4)
**Goal:** Core infrastructure and authentication

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 1.1 | Set up monorepo structure | DevOps | - | 1 day |
| 1.2 | Configure pnpm workspaces | DevOps | 1.1 | 1 day |
| 1.3 | Create shared packages (types, logging, telemetry) | Backend | 1.2 | 3 days |
| 1.4 | Set up PostgreSQL databases | DevOps | - | 1 day |
| 1.5 | Set up Redis cache | DevOps | - | 1 day |
| 1.6 | Implement auth-service | Backend | 1.3, 1.4, 1.5 | 5 days |
| 1.7 | Create web app shell (Next.js) | Frontend | 1.3 | 3 days |
| 1.8 | Implement login/register UI | Frontend | 1.7 | 3 days |
| 1.9 | OAuth integration (Google, LinkedIn) | Backend + Frontend | 1.6, 1.8 | 3 days |
| 1.10 | MFA implementation | Backend + Frontend | 1.6 | 2 days |

**Deliverables:**
- [ ] Users can register and login
- [ ] OAuth providers working
- [ ] MFA enabled
- [ ] Session management functional

---

#### Phase 2: User Profiles (Weeks 5-6)
**Goal:** Complete user profile management

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 2.1 | Implement user-service | Backend | Phase 1 | 4 days |
| 2.2 | Profile CRUD endpoints | Backend | 2.1 | 2 days |
| 2.3 | Work experience/education APIs | Backend | 2.1 | 2 days |
| 2.4 | S3 integration for file uploads | Backend | 2.1 | 1 day |
| 2.5 | Profile settings UI | Frontend | 2.2 | 3 days |
| 2.6 | Work experience form | Frontend | 2.3 | 2 days |
| 2.7 | Education form | Frontend | 2.3 | 2 days |
| 2.8 | Profile completeness calculation | Backend + Frontend | 2.2-2.7 | 1 day |

**Deliverables:**
- [ ] Complete profile management
- [ ] Photo upload working
- [ ] Work history editable
- [ ] Education editable

---

#### Phase 3: Resume System (Weeks 7-9)
**Goal:** Full resume management with AI features

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 3.1 | Implement resume-service | Backend | Phase 2 | 4 days |
| 3.2 | Resume parsing (PDF, DOCX) | Backend | 3.1 | 3 days |
| 3.3 | Set up ai-service (FastAPI) | Backend | - | 3 days |
| 3.4 | OpenAI integration | Backend | 3.3 | 2 days |
| 3.5 | Resume optimization API | Backend | 3.3, 3.4 | 2 days |
| 3.6 | ATS scoring algorithm | Backend | 3.5 | 2 days |
| 3.7 | Resume list/builder UI | Frontend | 3.1 | 4 days |
| 3.8 | Resume templates | Frontend + Backend | 3.1 | 2 days |
| 3.9 | PDF/DOCX export | Backend | 3.1 | 2 days |
| 3.10 | AI suggestions UI | Frontend | 3.5 | 2 days |

**Deliverables:**
- [ ] Resume upload and parsing
- [ ] AI-powered optimization
- [ ] Multiple templates
- [ ] Export functionality

---

#### Phase 4: Job System (Weeks 10-13)
**Goal:** Job search, matching, and recommendations

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 4.1 | Implement job-service | Backend | Phase 3 | 4 days |
| 4.2 | Job search endpoints | Backend | 4.1 | 3 days |
| 4.3 | Pinecone vector search setup | Backend | 3.3 | 2 days |
| 4.4 | Job matching algorithm | Backend | 4.3 | 4 days |
| 4.5 | Job ingestion adapters | Backend | 4.1 | 5 days |
| 4.6 | Job search UI | Frontend | 4.2 | 4 days |
| 4.7 | Job details page | Frontend | 4.2 | 2 days |
| 4.8 | Match score display | Frontend | 4.4 | 2 days |
| 4.9 | Saved jobs feature | Backend + Frontend | 4.1 | 2 days |
| 4.10 | Job alerts | Backend + Frontend | 4.1 | 3 days |

**Deliverables:**
- [ ] Job search with filters
- [ ] AI-powered matching
- [ ] Job recommendations
- [ ] Save and alert features

---

#### Phase 5: Application Tracking (Weeks 14-16)
**Goal:** Manual and automated application tracking

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 5.1 | Implement auto-apply-service | Backend | Phase 4 | 4 days |
| 5.2 | Application CRUD | Backend | 5.1 | 2 days |
| 5.3 | Playwright browser automation | Backend | 5.1 | 5 days |
| 5.4 | ATS adapters (Greenhouse, Lever) | Backend | 5.3 | 5 days |
| 5.5 | Answer library | Backend | 5.1 | 2 days |
| 5.6 | Applications list UI | Frontend | 5.2 | 3 days |
| 5.7 | Auto-apply settings UI | Frontend | 5.1 | 2 days |
| 5.8 | Activity log UI | Frontend | 5.1 | 2 days |
| 5.9 | Quick review panel | Frontend | 5.3 | 2 days |

**Deliverables:**
- [ ] Application tracking
- [ ] Auto-apply engine
- [ ] Multiple ATS support
- [ ] Activity monitoring

---

#### Phase 6: AI Tools (Weeks 17-18)
**Goal:** Advanced AI-powered features

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 6.1 | Cover letter generation | Backend | Phase 5 | 3 days |
| 6.2 | Interview prep API | Backend | 3.3 | 2 days |
| 6.3 | Salary prediction | Backend | 3.3 | 2 days |
| 6.4 | Skills gap analysis | Backend | 3.3 | 2 days |
| 6.5 | AI tools dashboard UI | Frontend | - | 2 days |
| 6.6 | Cover letter generator UI | Frontend | 6.1 | 2 days |
| 6.7 | Interview prep UI | Frontend | 6.2 | 2 days |
| 6.8 | Salary assistant UI | Frontend | 6.3 | 1 day |

**Deliverables:**
- [ ] Cover letter generation
- [ ] Interview preparation
- [ ] Salary insights
- [ ] Skills gap analysis

---

#### Phase 7: Notifications & Analytics (Weeks 19-20)
**Goal:** Communication and insights

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 7.1 | Implement notification-service | Backend | Phase 6 | 3 days |
| 7.2 | Email templates | Backend | 7.1 | 2 days |
| 7.3 | Push notifications (FCM) | Backend | 7.1 | 2 days |
| 7.4 | Implement analytics-service | Backend | - | 3 days |
| 7.5 | Analytics dashboard API | Backend | 7.4 | 2 days |
| 7.6 | Notification center UI | Frontend | 7.1 | 2 days |
| 7.7 | Analytics dashboard UI | Frontend | 7.5 | 3 days |
| 7.8 | Export functionality | Backend + Frontend | 7.5 | 1 day |

**Deliverables:**
- [ ] Multi-channel notifications
- [ ] Application analytics
- [ ] Dashboard insights
- [ ] Data export

---

#### Phase 8: Billing (Weeks 21-22)
**Goal:** Subscription and payment processing

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 8.1 | Implement payment-service | Backend | Phase 7 | 3 days |
| 8.2 | Stripe integration | Backend | 8.1 | 3 days |
| 8.3 | Paystack/Flutterwave integration | Backend | 8.1 | 3 days |
| 8.4 | Subscription tiers | Backend | 8.1 | 2 days |
| 8.5 | Usage tracking | Backend | 8.1 | 2 days |
| 8.6 | Pricing page UI | Frontend | 8.4 | 2 days |
| 8.7 | Checkout flow UI | Frontend | 8.2 | 2 days |
| 8.8 | Billing portal integration | Frontend | 8.2 | 1 day |

**Deliverables:**
- [ ] Subscription management
- [ ] Multiple payment providers
- [ ] Usage limits enforcement
- [ ] Self-service billing

---

#### Phase 9: Platform Expansion (Weeks 23-26)
**Goal:** Admin, employer, mobile, extension

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 9.1 | Admin dashboard | Frontend | Phase 8 | 5 days |
| 9.2 | Employer portal | Frontend | Phase 8 | 5 days |
| 9.3 | Mobile app (React Native) | Mobile | Phase 8 | 10 days |
| 9.4 | Browser extension | Frontend | Phase 8 | 7 days |
| 9.5 | B2B tenant system | Backend | Phase 8 | 5 days |

**Deliverables:**
- [ ] Admin functionality
- [ ] Employer features
- [ ] Mobile apps
- [ ] Chrome extension

---

#### Phase 10: Production Readiness (Weeks 27-30)
**Goal:** Security, performance, operations

| Task | Component | Owner | Dependencies | Duration |
|------|-----------|-------|--------------|----------|
| 10.1 | Security audit | Security | Phase 9 | 5 days |
| 10.2 | Performance optimization | All | Phase 9 | 5 days |
| 10.3 | Kubernetes deployment | DevOps | - | 5 days |
| 10.4 | CI/CD pipelines | DevOps | 10.3 | 3 days |
| 10.5 | Monitoring setup | DevOps | 10.3 | 3 days |
| 10.6 | Documentation | All | Phase 9 | 5 days |
| 10.7 | Load testing | QA | 10.2 | 3 days |
| 10.8 | UAT and bug fixes | All | 10.1-10.7 | 5 days |

**Deliverables:**
- [ ] Security certified
- [ ] Performance benchmarked
- [ ] Infrastructure deployed
- [ ] Documentation complete

---

### 5.3 Build Commands by Phase

```bash
# Phase 1: Foundation
pnpm --filter @applyforus/types build
pnpm --filter @applyforus/logging build
pnpm --filter @applyforus/telemetry build
pnpm --filter @applyforus/shared build
pnpm --filter auth-service build
pnpm --filter @jobpilot/web build

# Phase 2: User Profiles
pnpm --filter @applyforus/security build
pnpm --filter user-service build

# Phase 3: Resume System
pnpm --filter resume-service build
# ai-service: pip install -r requirements.txt

# Phase 4: Job System
pnpm --filter job-service build

# Phase 5: Application Tracking
pnpm --filter auto-apply-service build

# Phase 6-8: AI, Notifications, Analytics, Billing
pnpm --filter notification-service build
pnpm --filter analytics-service build
pnpm --filter payment-service build
pnpm --filter orchestrator-service build

# Phase 9: Platform Expansion
pnpm --filter @jobpilot/admin build
pnpm --filter @jobpilot/employer build
pnpm --filter @jobpilot/mobile build  # React Native
pnpm --filter @jobpilot/extension build

# Full build
pnpm build  # Uses Turborepo for dependency-aware parallel builds
```

---

## 6. Testing Strategy Mapped to Each Feature

### 6.1 Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ◄── 10% of tests
                    │   (Playwright)  │      Critical user flows
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │     Integration Tests       │  ◄── 30% of tests
              │   (Service interactions)    │      API contracts
              └──────────────┬──────────────┘
                             │
    ┌────────────────────────┴────────────────────────┐
    │                  Unit Tests                      │  ◄── 60% of tests
    │           (Jest, Pytest, React Testing Lib)     │      Business logic
    └─────────────────────────────────────────────────┘
```

### 6.2 Testing Matrix by Feature

#### Authentication

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | User registration validation | `services/auth-service/src/modules/auth/auth.service.spec.ts` | ✓ |
| Unit | Password hashing | `services/auth-service/src/modules/auth/auth.service.spec.ts` | ✓ |
| Unit | JWT token generation | `services/auth-service/src/modules/auth/auth.service.spec.ts` | ✓ |
| Unit | MFA TOTP generation | `services/auth-service/src/modules/auth/auth.service.spec.ts` | ✓ |
| Integration | Registration endpoint | `services/auth-service/test/auth.e2e-spec.ts` | ✓ |
| Integration | Login endpoint | `services/auth-service/test/auth.e2e-spec.ts` | ✓ |
| Integration | OAuth callback | `services/auth-service/test/auth.e2e-spec.ts` | ✓ |
| E2E | User registration flow | `e2e/specs/auth/registration.spec.ts` | ✓ |
| E2E | User login flow | `e2e/specs/auth/login.spec.ts` | ✓ |
| E2E | Password reset flow | `e2e/specs/auth/password-reset.spec.ts` | ✓ |

#### User Profiles

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | Profile completeness calc | `services/user-service/src/modules/profile/profile.service.spec.ts` | ✓ |
| Unit | S3 upload validation | `services/user-service/src/modules/storage/storage.service.spec.ts` | ✓ |
| Integration | Profile CRUD | `services/user-service/test/profile.e2e-spec.ts` | ✓ |
| Integration | Work experience CRUD | `services/user-service/test/career.e2e-spec.ts` | ✓ |
| E2E | Profile editing | `e2e/specs/profile/edit-profile.spec.ts` | ✓ |
| E2E | Photo upload | `e2e/specs/profile/photo-upload.spec.ts` | ✓ |

#### Resume System

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | Resume parsing (PDF) | `services/resume-service/src/modules/parser/parser.service.spec.ts` | ✓ |
| Unit | ATS scoring algorithm | `services/resume-service/src/modules/sections/sections.service.spec.ts` | ✓ |
| Unit | Template rendering | `services/resume-service/src/modules/templates/templates.service.spec.ts` | ✓ |
| Integration | Resume CRUD | `services/resume-service/test/resumes.e2e-spec.ts` | ✓ |
| Integration | AI optimization call | `services/resume-service/test/ai-integration.e2e-spec.ts` | ✓ |
| E2E | Resume upload flow | `e2e/specs/resume/upload.spec.ts` | ✓ |
| E2E | Resume builder | `e2e/specs/resume/builder.spec.ts` | ✓ |

#### Job Search

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | Search query building | `services/job-service/src/modules/jobs/jobs.service.spec.ts` | ✓ |
| Unit | Match score calculation | `services/job-service/src/modules/scoring/scoring.service.spec.ts` | ✓ |
| Unit | Job normalization | `services/job-service/src/modules/normalization/normalization.service.spec.ts` | ✓ |
| Integration | Search endpoint | `services/job-service/test/jobs.e2e-spec.ts` | ✓ |
| Integration | Recommendations | `services/job-service/test/recommendations.e2e-spec.ts` | ✓ |
| E2E | Job search flow | `e2e/specs/jobs/search.spec.ts` | ✓ |
| E2E | Save job flow | `e2e/specs/jobs/save.spec.ts` | ✓ |

#### Auto-Apply

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | Form field detection | `services/auto-apply-service/src/modules/autofill/autofill.service.spec.ts` | ✓ |
| Unit | ATS adapter (Greenhouse) | `services/auto-apply-service/src/modules/adapters/greenhouse.adapter.spec.ts` | ✓ |
| Unit | Answer library matching | `services/auto-apply-service/src/modules/answer-library/answer-library.service.spec.ts` | ✓ |
| Integration | Application submission | `services/auto-apply-service/test/applications.e2e-spec.ts` | ✓ |
| E2E | Auto-apply configuration | `e2e/specs/auto-apply/settings.spec.ts` | ✓ |

#### AI Tools

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | Cover letter generation | `services/ai-service/tests/test_generate.py` | ✓ |
| Unit | Interview questions | `services/ai-service/tests/test_interview.py` | ✓ |
| Unit | Salary prediction | `services/ai-service/tests/test_salary.py` | ✓ |
| Integration | OpenAI API mocking | `services/ai-service/tests/test_integration.py` | ✓ |
| E2E | Cover letter flow | `e2e/specs/ai-tools/cover-letter.spec.ts` | ✓ |

#### Notifications

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | Email template rendering | `services/notification-service/src/modules/email/email.service.spec.ts` | ✓ |
| Unit | Push notification formatting | `services/notification-service/src/modules/push/push.service.spec.ts` | ✓ |
| Integration | Notification delivery | `services/notification-service/test/notifications.e2e-spec.ts` | ✓ |
| E2E | Notification preferences | `e2e/specs/notifications/preferences.spec.ts` | ✓ |

#### Billing

| Test Type | Test Case | File Location | Coverage |
|-----------|-----------|---------------|----------|
| Unit | Subscription tier limits | `services/payment-service/src/modules/subscriptions/subscriptions.service.spec.ts` | ✓ |
| Unit | Usage tracking | `services/payment-service/src/modules/subscriptions/subscriptions.service.spec.ts` | ✓ |
| Integration | Stripe webhook handling | `services/payment-service/test/stripe.e2e-spec.ts` | ✓ |
| Integration | Paystack integration | `services/payment-service/test/paystack.e2e-spec.ts` | ✓ |
| E2E | Subscription purchase | `e2e/specs/billing/purchase.spec.ts` | ✓ |
| E2E | Upgrade flow | `e2e/specs/billing/upgrade.spec.ts` | ✓ |

### 6.3 Test Configuration

```typescript
// jest.config.js (services)
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
};

// playwright.config.ts (E2E)
export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### 6.4 CI/CD Test Pipeline

```yaml
# .github/workflows/ci.yml (simplified)
name: CI Pipeline

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check

  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, user, job, resume, auto-apply, notification, analytics, payment]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
      redis:
        image: redis:7
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ${{ matrix.service }}-service test:cov
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    steps:
      - uses: actions/checkout@v4
      - run: docker-compose -f docker-compose.test.yml up -d
      - run: pnpm test:integration
      - run: docker-compose -f docker-compose.test.yml down

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm build
      - run: pnpm e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 6.5 Test Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| Shared Packages | 90% | 95% |
| Auth Service | 85% | 90% |
| User Service | 80% | 85% |
| Job Service | 80% | 85% |
| Resume Service | 80% | 85% |
| Auto-Apply Service | 75% | 80% |
| AI Service (Python) | 75% | 80% |
| Notification Service | 80% | 85% |
| Analytics Service | 80% | 85% |
| Payment Service | 85% | 90% |
| Web App (Frontend) | 70% | 80% |
| Mobile App | 70% | 75% |
| Browser Extension | 70% | 75% |

---

## Appendices

### A. Quick Reference Commands

```bash
# Development
pnpm dev                    # Start all services in dev mode
pnpm dev:web                # Start web app only
pnpm dev:services           # Start all backend services

# Building
pnpm build                  # Build all packages and services
pnpm build:packages         # Build shared packages only
pnpm build:services         # Build services only
pnpm build:apps             # Build frontend apps only

# Testing
pnpm test                   # Run all tests
pnpm test:unit              # Run unit tests only
pnpm test:integration       # Run integration tests
pnpm e2e                    # Run E2E tests
pnpm test:cov               # Run tests with coverage

# Linting
pnpm lint                   # Lint all code
pnpm lint:fix               # Fix linting issues
pnpm format                 # Format code with Prettier

# Database
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed database
pnpm db:reset               # Reset database

# Docker
pnpm docker:up              # Start Docker services
pnpm docker:down            # Stop Docker services
pnpm docker:build           # Build Docker images
```

### B. Service Ports Reference

| Service | Development Port | Production (Internal) |
|---------|-----------------|----------------------|
| Web App | 3000 | 3000 |
| Admin App | 3001 | 3001 |
| Employer App | 3002 | 3002 |
| Auth Service | 3001 | 3001 |
| User Service | 8002 | 8002 |
| Job Service | 4002 | 4002 |
| Resume Service | 8004 | 8004 |
| Notification Service | 8005 | 8005 |
| Auto-Apply Service | 8006 | 8006 |
| Analytics Service | 8007 | 8007 |
| AI Service | 8008 | 8008 |
| Payment Service | 8009 | 8009 |
| Orchestrator Service | 8010 | 8010 |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |
| Elasticsearch | 9200 | 9200 |
| RabbitMQ | 5672 | 5672 |
| RabbitMQ Management | 15672 | - |
| MailHog | 1025/8025 | - |

### C. Environment URLs

| Environment | Web URL | API URL |
|-------------|---------|---------|
| Local | http://localhost:3000 | http://localhost:8000 |
| Development | https://dev.applyforus.com | https://api.dev.applyforus.com |
| Staging | https://staging.applyforus.com | https://api.staging.applyforus.com |
| Production | https://applyforus.com | https://api.applyforus.com |

---

*Document generated from codebase analysis on December 16, 2025*
