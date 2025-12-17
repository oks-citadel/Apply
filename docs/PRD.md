# ApplyForUs AI Platform - Project Requirements Document (PRD)

**Version:** 2.0.0
**Last Updated:** December 16, 2025
**Status:** Production
**Document Owner:** Engineering Team

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [API & Integration Requirements](#4-api--integration-requirements)
5. [Data & Storage Requirements](#5-data--storage-requirements)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Expanded Implementation Steps](#7-expanded-implementation-steps)

---

## 1. System Overview

### 1.1 Purpose and Scope

**ApplyForUs** is an AI-powered job application automation platform designed to streamline and optimize the job search process for candidates while providing powerful tools for employers and recruiters.

#### Core Value Propositions

1. **For Job Seekers:**
   - AI-powered resume building and optimization
   - Automated job application submission
   - Smart job matching algorithms
   - Interview preparation assistance
   - Application tracking and analytics

2. **For Employers:**
   - Access to pre-qualified candidate pool
   - Job posting and applicant tracking
   - Hiring analytics and insights

3. **For Institutions (B2B):**
   - White-label career services platform
   - Placement tracking and reporting
   - Cohort management for universities/bootcamps

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────┬─────────────────┬──────────────┬─────────────┬────────────┤
│   Web App       │   Mobile App    │   Admin      │  Employer   │  Browser   │
│   (Next.js 14)  │ (React Native)  │  Dashboard   │   Portal    │  Extension │
│   Port: 3000    │   iOS/Android   │  Port: 3001  │  Port: 3002 │  Chrome    │
└────────┬────────┴────────┬────────┴──────┬───────┴──────┬──────┴─────┬──────┘
         │                 │               │              │            │
         └─────────────────┴───────────────┼──────────────┴────────────┘
                                           │
                    ┌──────────────────────▼──────────────────────┐
                    │              API GATEWAY (Kong)             │
                    │           Rate Limiting | Auth | Routing    │
                    └──────────────────────┬──────────────────────┘
                                           │
    ┌──────────────────────────────────────┼──────────────────────────────────┐
    │                          MICROSERVICES LAYER                             │
    ├─────────────┬─────────────┬──────────┴────┬─────────────┬───────────────┤
    │ Auth        │ User        │ Job           │ Resume      │ Auto-Apply    │
    │ Service     │ Service     │ Service       │ Service     │ Service       │
    │ (NestJS)    │ (NestJS)    │ (NestJS)      │ (NestJS)    │ (NestJS)      │
    │ Port: 3001  │ Port: 8002  │ Port: 4002    │ Port: 8004  │ Port: 8006    │
    ├─────────────┼─────────────┼───────────────┼─────────────┼───────────────┤
    │ Notification│ Analytics   │ Payment       │ Orchestrator│ AI Service    │
    │ Service     │ Service     │ Service       │ Service     │ (FastAPI)     │
    │ (NestJS)    │ (NestJS)    │ (NestJS)      │ (NestJS)    │ Python 3.11   │
    │ Port: 8005  │ Port: 8007  │ Port: 8009    │ Port: 8010  │ Port: 8008    │
    └─────────────┴─────────────┴───────────────┴─────────────┴───────────────┘
                                           │
    ┌──────────────────────────────────────┼──────────────────────────────────┐
    │                           DATA LAYER                                     │
    ├─────────────┬─────────────┬──────────┴────┬─────────────┬───────────────┤
    │ PostgreSQL  │ Redis       │ Elasticsearch │ RabbitMQ/   │ Azure Blob    │
    │ (Primary DB)│ (Cache)     │ (Search)      │ Service Bus │ Storage       │
    │ Port: 5432  │ Port: 6379  │ Port: 9200    │ Port: 5672  │               │
    └─────────────┴─────────────┴───────────────┴─────────────┴───────────────┘
                                           │
    ┌──────────────────────────────────────┼──────────────────────────────────┐
    │                      EXTERNAL INTEGRATIONS                               │
    ├─────────────┬─────────────┬──────────┴────┬─────────────┬───────────────┤
    │ Stripe      │ OpenAI/     │ Job Boards    │ OAuth       │ SendGrid/     │
    │ Paystack    │ Anthropic   │ (Indeed,      │ (Google,    │ Email         │
    │ Flutterwave │ Pinecone    │ LinkedIn...)  │ LinkedIn)   │               │
    └─────────────┴─────────────┴───────────────┴─────────────┴───────────────┘
```

### 1.3 Major Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Application** | Next.js 14, React 18, TailwindCSS | Primary user interface |
| **Mobile Application** | React Native 0.73 | iOS/Android native apps |
| **Browser Extension** | Chrome Extension (Manifest V3) | Auto-fill and quick apply |
| **Admin Dashboard** | Next.js 14 | Platform administration |
| **Employer Portal** | Next.js 14 | Employer job management |
| **Auth Service** | NestJS, TypeORM, Passport | Authentication & authorization |
| **User Service** | NestJS, TypeORM | User profiles & preferences |
| **Job Service** | NestJS, TypeORM | Job listings & matching |
| **Resume Service** | NestJS, TypeORM | Resume management & parsing |
| **Auto-Apply Service** | NestJS, Playwright | Automated job applications |
| **Notification Service** | NestJS, Nodemailer, FCM | Multi-channel notifications |
| **Analytics Service** | NestJS, TypeORM | Event tracking & reporting |
| **Payment Service** | NestJS, Stripe SDK | Subscription management |
| **AI Service** | FastAPI, OpenAI, Pinecone | AI/ML capabilities |
| **Orchestrator Service** | NestJS | Workflow coordination |

### 1.4 Key Assumptions and Constraints

#### Assumptions
1. Users have reliable internet connectivity
2. Job boards provide stable APIs or scrapeable content
3. Users consent to automated job applications on their behalf
4. AI models maintain accuracy for resume/job matching
5. Payment providers maintain stable service availability

#### Constraints
1. **Technical Constraints:**
   - ATS platforms have varying APIs and anti-automation measures
   - Rate limits on external job board APIs
   - AI API costs scale with usage
   - Browser automation subject to detection

2. **Business Constraints:**
   - Compliance with employment laws across jurisdictions
   - Data privacy regulations (GDPR, CCPA, LGPD)
   - Platform usage terms of job boards
   - Payment processing regulations

3. **Resource Constraints:**
   - Azure cloud infrastructure costs
   - AI token consumption limits
   - Storage limits for resume files
   - Concurrent browser automation capacity

---

## 2. Functional Requirements

### 2.1 Authentication & User Management

#### FR-AUTH-001: User Registration
**Description:** Allow new users to create accounts with email/password or social login.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | auth-service |
| **Endpoints** | `POST /auth/register`, OAuth callbacks |

**Preconditions:**
- Valid email address
- Password meets complexity requirements (8+ chars, uppercase, lowercase, number)
- User accepts terms of service

**Postconditions:**
- User account created in database
- Email verification sent
- Welcome notification triggered
- Default free subscription assigned

**Dependencies:**
- Email service (Nodemailer/SendGrid)
- User service (profile creation)

---

#### FR-AUTH-002: User Login
**Description:** Authenticate users via email/password with optional MFA.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | auth-service |
| **Endpoints** | `POST /auth/login`, `POST /auth/mfa/verify` |

**Preconditions:**
- User account exists and is active
- Account not locked due to failed attempts

**Postconditions:**
- JWT access token issued (15min expiry)
- Refresh token issued (7 days expiry)
- Last login timestamp updated
- Login attempt counter reset

**Dependencies:**
- MFA service (if enabled)
- Token blacklist (Redis)

---

#### FR-AUTH-003: Social Login (OAuth)
**Description:** Enable login via Google, LinkedIn, and GitHub.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | auth-service |
| **Endpoints** | `GET /auth/{provider}`, `GET /auth/{provider}/callback` |

**Supported Providers:**
- Google OAuth 2.0 (email, profile scopes)
- LinkedIn OAuth 2.0 (r_emailaddress, r_liteprofile scopes)
- GitHub OAuth (user:email scope)

**Preconditions:**
- Valid OAuth configuration
- User grants permission to provider

**Postconditions:**
- User account created or linked
- Profile populated from provider data
- Session established

**Dependencies:**
- OAuth provider availability
- User service for profile sync

---

#### FR-AUTH-004: Multi-Factor Authentication (MFA)
**Description:** TOTP-based two-factor authentication for enhanced security.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | auth-service |
| **Endpoints** | `POST /auth/mfa/setup`, `POST /auth/mfa/verify`, `POST /auth/mfa/disable` |

**Features:**
- TOTP generation (Google Authenticator compatible)
- QR code for easy setup
- Backup codes generation
- MFA enforcement for sensitive operations

**Preconditions:**
- User authenticated
- Authenticator app installed

**Postconditions:**
- MFA secret stored securely
- Backup codes generated
- MFA required for future logins

---

#### FR-AUTH-005: Password Management
**Description:** Forgot password and reset functionality.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | auth-service |
| **Endpoints** | `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/password/change` |

**Preconditions:**
- Valid email for reset request
- Valid reset token (not expired)

**Postconditions:**
- Reset email sent with secure token
- Password updated on successful reset
- All existing sessions invalidated

---

#### FR-AUTH-006: Email Verification
**Description:** Verify user email addresses after registration.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | auth-service |
| **Endpoints** | `POST /auth/verify-email`, `POST /auth/resend-verification` |

**Preconditions:**
- User registered but not verified
- Valid verification token

**Postconditions:**
- Email marked as verified
- Full platform access granted
- Verification banner removed

---

### 2.2 User Profile Management

#### FR-PROFILE-001: Profile CRUD
**Description:** Create, read, update user profile information.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | user-service |
| **Endpoints** | `GET /profile`, `POST /profile`, `PUT /profile` |

**Profile Fields:**
- Full name, headline, bio
- Phone number, location
- LinkedIn URL, GitHub URL, Portfolio URL
- Profile photo (S3 storage)

**Preconditions:**
- User authenticated
- Valid profile data

**Postconditions:**
- Profile data persisted
- Completeness score recalculated
- Changes reflected in search indexes

---

#### FR-PROFILE-002: Work Experience Management
**Description:** Manage employment history.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | user-service |
| **Endpoints** | `GET/POST/PUT/DELETE /career/work-experience` |

**Fields:**
- Company name, job title
- Start/end dates, is_current flag
- Location, description
- Achievements (array)

**Dependencies:**
- Resume service (auto-sync to resumes)
- AI service (skill extraction)

---

#### FR-PROFILE-003: Education Management
**Description:** Manage educational background.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | user-service |
| **Endpoints** | `GET/POST/PUT/DELETE /career/education` |

**Fields:**
- Institution name, degree, field of study
- Start/end dates, GPA
- Activities and achievements

---

#### FR-PROFILE-004: Skills Management
**Description:** Track and manage professional skills.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | user-service |
| **Endpoints** | `GET/POST/DELETE /skills`, `POST /skills/extract` |

**Features:**
- Manual skill entry
- AI-based skill extraction from resume
- Skill proficiency levels
- Skill categorization (technical, soft, domain)

---

#### FR-PROFILE-005: Job Preferences
**Description:** Configure job search preferences.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | user-service |
| **Endpoints** | `GET /preferences`, `PUT /preferences` |

**Preferences:**
- Job types (full-time, contract, etc.)
- Remote preferences (onsite, remote, hybrid)
- Salary expectations (min/max, currency)
- Preferred locations (array)
- Benefits preferences

---

### 2.3 Resume Management

#### FR-RESUME-001: Resume CRUD
**Description:** Create, view, edit, and delete resumes.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | resume-service |
| **Endpoints** | `GET/POST/PUT/DELETE /resumes`, `GET /resumes/:id` |

**Features:**
- Multiple resumes per user
- Primary resume designation
- Version history
- Soft delete support

---

#### FR-RESUME-002: Resume Parsing
**Description:** Extract data from uploaded resume files.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | resume-service |
| **Endpoints** | `POST /resumes/upload`, `POST /resumes/parse` |

**Supported Formats:**
- PDF (via pdf-parse)
- DOCX (via mammoth)
- DOC (limited support)

**Extracted Data:**
- Personal information
- Work experience
- Education
- Skills
- Certifications

**Dependencies:**
- AI service (intelligent extraction)
- Storage service (file upload)

---

#### FR-RESUME-003: Resume Templates
**Description:** Pre-designed resume templates.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | resume-service |
| **Endpoints** | `GET /resumes/templates`, `POST /resumes/from-template` |

**Template Categories:**
- Professional
- Modern
- Creative
- ATS-optimized
- Industry-specific

---

#### FR-RESUME-004: ATS Optimization
**Description:** Score and optimize resume for ATS systems.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | resume-service, ai-service |
| **Endpoints** | `GET /resumes/:id/ats-score`, `POST /resumes/:id/optimize` |

**Features:**
- ATS compatibility score (0-100)
- Keyword optimization
- Formatting recommendations
- Section completeness check

**Dependencies:**
- AI service (scoring algorithm)

---

#### FR-RESUME-005: Resume Export
**Description:** Export resumes to PDF or DOCX.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | resume-service |
| **Endpoints** | `GET /resumes/:id/export/:format` |

**Export Formats:**
- PDF (via pdfkit/puppeteer)
- DOCX (via docx library)

---

#### FR-RESUME-006: Job-Specific Resume Customization
**Description:** Tailor resume for specific job postings.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | resume-service, ai-service |
| **Endpoints** | `POST /resumes/:id/customize/:jobId` |

**Features:**
- Keyword alignment
- Experience highlighting
- Skills prioritization
- Summary customization

**Dependencies:**
- Job service (job details)
- AI service (customization logic)

---

### 2.4 Job Search & Discovery

#### FR-JOB-001: Job Search
**Description:** Search and filter job listings.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | job-service |
| **Endpoints** | `GET /jobs/search` |

**Search Parameters:**
- Keywords (title, description)
- Location (city, state, country)
- Remote type (onsite, remote, hybrid)
- Experience level (entry to executive)
- Employment type (full-time, contract, etc.)
- Salary range
- Company
- Date posted

**Features:**
- Full-text search
- Faceted filtering
- Pagination
- Sorting (relevance, date, salary)

---

#### FR-JOB-002: Job Details
**Description:** View complete job posting information.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | job-service |
| **Endpoints** | `GET /jobs/:id` |

**Displayed Information:**
- Job title, company, location
- Description, requirements, benefits
- Salary information
- Application URL
- Posted date, expiration date
- Company information

---

#### FR-JOB-003: Job Recommendations
**Description:** AI-powered personalized job recommendations.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | job-service, ai-service |
| **Endpoints** | `GET /jobs/recommended` |

**Algorithm Factors:**
- Profile completeness
- Skills match
- Experience alignment
- Location preferences
- Application history
- Save/view behavior

**Dependencies:**
- AI service (recommendation engine)
- User service (preferences)

---

#### FR-JOB-004: Job Match Score
**Description:** Calculate compatibility between resume and job.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | job-service, ai-service |
| **Endpoints** | `GET /jobs/:id/match-score`, `POST /jobs/:id/calculate-match` |

**Score Components:**
- Skills match percentage
- Experience alignment
- Education requirements
- Location compatibility
- Overall match score (0-100)

---

#### FR-JOB-005: Save Jobs
**Description:** Bookmark jobs for later review.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | job-service |
| **Endpoints** | `POST /jobs/:id/save`, `DELETE /jobs/:id/unsave`, `GET /jobs/saved` |

**Features:**
- Add notes to saved jobs
- Track application status
- Organize with tags/folders

---

#### FR-JOB-006: Job Alerts
**Description:** Automated notifications for matching jobs.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | job-service, notification-service |
| **Endpoints** | `GET/POST/PUT/DELETE /jobs/alerts` |

**Alert Configuration:**
- Search criteria (same as job search)
- Frequency (instant, daily, weekly)
- Delivery method (email, push, in-app)

---

#### FR-JOB-007: Similar Jobs
**Description:** Find jobs similar to a given listing.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | job-service |
| **Endpoints** | `GET /jobs/similar/:id` |

**Similarity Factors:**
- Title similarity
- Required skills overlap
- Company/industry
- Location proximity
- Salary range

---

#### FR-JOB-008: Job Reporting
**Description:** Report inappropriate or fraudulent job postings.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | job-service |
| **Endpoints** | `POST /jobs/:id/report` |

**Report Categories:**
- Scam/fraud
- Discrimination
- Misleading information
- Duplicate posting
- Expired position

---

### 2.5 Application Management

#### FR-APP-001: Track Applications
**Description:** View and manage submitted applications.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | auto-apply-service |
| **Endpoints** | `GET /applications`, `GET /applications/:id` |

**Application Status:**
- PENDING - Queued for submission
- APPLIED - Successfully submitted
- VIEWED - Employer viewed application
- PHONE_SCREEN - Scheduled for phone screen
- INTERVIEWING - In interview process
- OFFERED - Received job offer
- REJECTED - Application rejected
- WITHDRAWN - Candidate withdrew

---

#### FR-APP-002: Manual Application Tracking
**Description:** Record manually submitted applications.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | auto-apply-service |
| **Endpoints** | `POST /applications`, `PUT /applications/:id` |

**Tracked Information:**
- Job details (link or manual entry)
- Application date
- Status updates
- Notes and follow-ups

---

#### FR-APP-003: Application Analytics
**Description:** Dashboard of application statistics.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | analytics-service |
| **Endpoints** | `GET /analytics/applications`, `GET /analytics/dashboard` |

**Metrics:**
- Total applications (by period)
- Response rate
- Interview conversion rate
- Application sources breakdown
- Top applied companies
- Status distribution

---

### 2.6 Auto-Apply System

#### FR-AUTO-001: Auto-Apply Configuration
**Description:** Configure automated job application settings.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | auto-apply-service |
| **Endpoints** | `GET/PUT /auto-apply/settings` |

**Configuration Options:**
- Enable/disable auto-apply
- Daily application limit
- Job matching criteria
- Blacklisted companies
- Required match score threshold
- Cover letter preference

---

#### FR-AUTO-002: Automated Application Submission
**Description:** Automatically submit job applications via browser automation.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | auto-apply-service |
| **Endpoints** | Internal queue processing |

**Supported ATS Platforms:**
- Greenhouse
- Lever
- Workday
- iCIMS
- LinkedIn Easy Apply
- Indeed Apply
- Generic forms

**Features:**
- Intelligent form detection
- Field mapping
- File upload handling
- Custom question answering
- Human-like interaction simulation
- Anti-detection measures

**Dependencies:**
- Resume service (resume data)
- AI service (question answering)
- Job service (job details)

---

#### FR-AUTO-003: Answer Library
**Description:** Pre-saved answers for common application questions.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | auto-apply-service |
| **Endpoints** | `GET/POST/PUT/DELETE /auto-apply/answers` |

**Question Categories:**
- Work authorization
- Salary expectations
- Start date availability
- Relocation willingness
- Years of experience
- Technical questions

---

#### FR-AUTO-004: Quick Review Panel
**Description:** Review and approve auto-filled applications before submission.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | auto-apply-service, web app |

**Features:**
- Preview filled form
- Edit answers
- Approve/reject application
- Skip specific jobs

---

### 2.7 AI Tools

#### FR-AI-001: AI Resume Builder
**Description:** AI-assisted resume creation.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | ai-service, resume-service |
| **Endpoints** | `POST /generate/resume-summary`, `POST /optimize/resume` |

**Features:**
- Summary generation
- Bullet point optimization
- Achievement quantification
- Keyword suggestions

---

#### FR-AI-002: Cover Letter Generator
**Description:** Generate job-specific cover letters.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | ai-service |
| **Endpoints** | `POST /generate/cover-letter` |

**Input:**
- Resume content
- Job description
- Company information
- Tone preference

**Output:**
- Personalized cover letter
- Multiple variations

---

#### FR-AI-003: Interview Preparation
**Description:** AI-generated interview questions and guidance.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | ai-service |
| **Endpoints** | `POST /interview-prep/questions`, `POST /interview-prep/answers` |

**Features:**
- Common questions for role
- STAR method answer suggestions
- Company research summary
- Technical question preparation

---

#### FR-AI-004: Salary Assistant
**Description:** Salary insights and negotiation guidance.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | ai-service |
| **Endpoints** | `POST /salary/predict` |

**Features:**
- Salary range prediction
- Market comparison
- Negotiation tips
- Location adjustments

---

#### FR-AI-005: Skills Gap Analysis
**Description:** Identify skill gaps for target roles.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | ai-service |
| **Endpoints** | `POST /recommendations/skills-gap` |

**Features:**
- Current skills assessment
- Required skills for target roles
- Learning recommendations
- Course suggestions

---

### 2.8 Notifications

#### FR-NOTIFY-001: Multi-Channel Notifications
**Description:** Deliver notifications via multiple channels.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | notification-service |
| **Endpoints** | `POST /notifications`, `GET /notifications` |

**Channels:**
- Email (Nodemailer/SendGrid)
- Push (FCM for mobile, Web Push)
- SMS (planned)
- In-app

**Notification Types:**
- Application status updates
- Job alerts
- Interview reminders
- System announcements
- Weekly digest

---

#### FR-NOTIFY-002: Notification Preferences
**Description:** Configure notification delivery preferences.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | notification-service |
| **Endpoints** | `GET/PUT /notifications/preferences` |

**Options:**
- Channel preferences per type
- Frequency (immediate, digest)
- Quiet hours
- Unsubscribe options

---

### 2.9 Subscription & Billing

#### FR-BILLING-001: Subscription Tiers
**Description:** Multi-tier subscription system.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | payment-service |

**Tier Structure:**

| Tier | Price/Month | Applications | AI Credits | Key Features |
|------|-------------|--------------|------------|--------------|
| **Freemium** | $0 | 5/month | 2 cover letters | Basic search, 1 resume |
| **Starter** | $23.99 | 30/month | 10/month | Email alerts, 3 resumes |
| **Basic** | $47.99 | 100/month | 25/month | Advanced analytics, unlimited resumes |
| **Professional** | $97.99 | Unlimited | 50/month | Auto-apply, priority support |
| **Advanced Career** | $197.99 | Unlimited | 100/month | Dedicated manager, API access |
| **Executive Elite** | $497.99 | Unlimited | Unlimited | White-glove service, custom integrations |

---

#### FR-BILLING-002: Payment Processing
**Description:** Handle subscription payments.

| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | Implemented |
| **Service** | payment-service |
| **Endpoints** | `POST /subscriptions/checkout-session`, billing portal |

**Payment Providers:**
- Stripe (Global - primary)
- Paystack (Africa)
- Flutterwave (Africa)

**Features:**
- Credit card payments
- Subscription management
- Automatic renewal
- Invoice generation
- Refund handling

---

#### FR-BILLING-003: Usage Tracking
**Description:** Track feature usage against subscription limits.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | payment-service, user-service |
| **Endpoints** | `GET /subscriptions/user/:userId/limits`, `POST /subscriptions/user/:userId/check-usage` |

**Tracked Metrics:**
- Applications this month
- AI generations used
- Resumes created
- Storage used

---

### 2.10 Employer Features

#### FR-EMPLOYER-001: Job Posting
**Description:** Create and manage job postings.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | job-service, employer-app |

**Features:**
- Rich text job description
- Salary range configuration
- Application requirements
- Preview mode
- Multi-platform publishing

---

#### FR-EMPLOYER-002: Applicant Tracking
**Description:** View and manage job applicants.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | job-service, employer-app |

**Features:**
- Application pipeline view
- Candidate profiles
- Status management
- Notes and ratings
- Bulk actions

---

#### FR-EMPLOYER-003: Candidate Search
**Description:** Search resume database for candidates.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | job-service, employer-app |

**Search Criteria:**
- Skills
- Experience level
- Location
- Education
- Availability

---

### 2.11 Admin Features

#### FR-ADMIN-001: User Management
**Description:** Administrative user management.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | auth-service, admin-app |

**Features:**
- View all users
- Suspend/activate accounts
- Reset passwords
- View activity logs

---

#### FR-ADMIN-002: Platform Analytics
**Description:** Platform-wide analytics dashboard.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | analytics-service, admin-app |

**Metrics:**
- Total users (active/inactive)
- Applications submitted
- Revenue (MRR, churn)
- Service health

---

#### FR-ADMIN-003: Service Health Monitoring
**Description:** Monitor microservice health.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | All services, admin-app |

**Monitored:**
- Service status (online/offline)
- Response times
- Error rates
- Resource usage

---

### 2.12 B2B/Multi-Tenant Features

#### FR-TENANT-001: White-Label Platform
**Description:** Customizable platform for institutions.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | user-service |

**Customization Options:**
- Custom branding (logo, colors)
- Custom domain
- SSO integration
- Feature toggles

---

#### FR-TENANT-002: Cohort Management
**Description:** Manage student/trainee cohorts.

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | Implemented |
| **Service** | user-service |

**Features:**
- Create cohorts
- Bulk user import
- Progress tracking
- Placement reporting

---

### 2.13 Browser Extension Features

#### FR-EXT-001: Quick Apply
**Description:** One-click job application from any job site.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | extension |

**Features:**
- Detect job pages
- Auto-fill application forms
- Track applications
- Sync with main platform

---

#### FR-EXT-002: Form Auto-Fill
**Description:** Automatically populate job application forms.

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | Implemented |
| **Service** | extension |

**Supported Platforms:**
- LinkedIn
- Indeed
- Greenhouse
- Lever
- Workday
- iCIMS
- Generic forms

---

---

## 3. Non-Functional Requirements

### 3.1 Security Requirements

#### NFR-SEC-001: Authentication Security
- JWT tokens with RS256 signing
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry with rotation
- Password hashing: bcrypt with 12 rounds
- Account lockout after 5 failed attempts (30-minute lockout)
- Session invalidation on password change

#### NFR-SEC-002: Authorization
- Role-Based Access Control (RBAC)
- 60+ granular permissions
- API key authentication for service-to-service
- Scope-limited tokens for external integrations

#### NFR-SEC-003: Data Protection
- TLS 1.3 for all communications
- Field-level encryption for sensitive data (PII)
- Data encryption at rest (AES-256)
- Azure Key Vault for secrets management
- No sensitive data in logs

#### NFR-SEC-004: Input Validation
- Server-side validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization, CSP headers)
- CSRF protection (tokens on state-changing requests)
- Rate limiting on all public endpoints

#### NFR-SEC-005: Compliance
- GDPR compliance (EU)
- CCPA/CPRA compliance (California)
- PIPEDA compliance (Canada)
- Data retention policies
- Right to deletion (RTBF)
- Data portability

### 3.2 Performance Requirements

#### NFR-PERF-001: Response Times
| Endpoint Type | Target | Maximum |
|--------------|--------|---------|
| Static assets | < 50ms | 200ms |
| API reads | < 100ms | 500ms |
| API writes | < 200ms | 1s |
| Search queries | < 300ms | 2s |
| AI operations | < 5s | 30s |
| File uploads | < 2s | 10s |

#### NFR-PERF-002: Throughput
- API Gateway: 10,000 requests/second
- Individual services: 1,000 requests/second
- Database: 5,000 queries/second
- Background jobs: 100 jobs/minute

#### NFR-PERF-003: Resource Limits
- Max request body: 10MB
- Max file upload: 50MB
- Max concurrent connections: 10,000
- Connection timeout: 30 seconds
- Query timeout: 10 seconds

### 3.3 Scalability Requirements

#### NFR-SCALE-001: Horizontal Scaling
- All services stateless and horizontally scalable
- Kubernetes HPA for auto-scaling
- Scale triggers: CPU > 70%, Memory > 80%
- Minimum 2 replicas per service (HA)
- Maximum 10 replicas per service

#### NFR-SCALE-002: Database Scaling
- PostgreSQL read replicas for read-heavy operations
- Connection pooling (max 100 connections per service)
- Query optimization and indexing
- Partitioning for large tables (analytics events)

#### NFR-SCALE-003: Caching Strategy
- Redis for session and token caching
- API response caching (5-minute TTL)
- Database query caching
- CDN for static assets

### 3.4 Availability Requirements

#### NFR-AVAIL-001: Uptime Target
- Production SLA: 99.9% uptime
- Planned maintenance windows: < 4 hours/month
- Maximum unplanned downtime: 8.76 hours/year

#### NFR-AVAIL-002: High Availability
- Multi-zone deployment (Azure Availability Zones)
- Database failover (< 30 seconds)
- Load balancer health checks
- Circuit breaker patterns

#### NFR-AVAIL-003: Disaster Recovery
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Daily automated backups (30-day retention)
- Cross-region backup replication
- Documented recovery procedures

### 3.5 Logging & Monitoring

#### NFR-LOG-001: Logging Standards
- Structured JSON logging (Pino/Winston)
- Correlation IDs across requests
- Log levels: ERROR, WARN, INFO, DEBUG
- Sensitive data redaction
- 30-day log retention

#### NFR-LOG-002: Metrics Collection
- Prometheus metrics on all services
- Custom business metrics
- RED metrics (Rate, Errors, Duration)
- Resource utilization metrics

#### NFR-LOG-003: Distributed Tracing
- OpenTelemetry instrumentation
- Azure Application Insights integration
- W3C Trace Context propagation
- End-to-end request tracing

#### NFR-LOG-004: Alerting
- PagerDuty/Slack integration
- Error rate thresholds (> 1% = warning, > 5% = critical)
- Latency thresholds (p99 > 2s = warning)
- Service health alerts

### 3.6 Error Handling

#### NFR-ERR-001: Error Response Format
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2025-12-16T10:00:00Z",
  "path": "/api/users",
  "requestId": "abc-123-def"
}
```

#### NFR-ERR-002: Error Recovery
- Automatic retry for transient failures (3 attempts, exponential backoff)
- Circuit breaker for failing dependencies
- Graceful degradation (cached data when service unavailable)
- Dead letter queues for failed async operations

---

## 4. API & Integration Requirements

### 4.1 Backend APIs Overview

#### Auth Service APIs (Port 3001)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | User registration | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/refresh` | Refresh access token | Public (refresh token) |
| POST | `/auth/logout` | User logout | JWT |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public (reset token) |
| POST | `/auth/verify-email` | Verify email | Public (verification token) |
| POST | `/auth/resend-verification` | Resend verification email | JWT |
| GET | `/auth/google` | Google OAuth initiate | Public |
| GET | `/auth/google/callback` | Google OAuth callback | Public |
| GET | `/auth/linkedin` | LinkedIn OAuth initiate | Public |
| GET | `/auth/linkedin/callback` | LinkedIn OAuth callback | Public |
| GET | `/auth/github` | GitHub OAuth initiate | Public |
| GET | `/auth/github/callback` | GitHub OAuth callback | Public |
| POST | `/auth/mfa/setup` | Setup MFA | JWT |
| POST | `/auth/mfa/verify` | Verify MFA token | JWT |
| POST | `/auth/mfa/disable` | Disable MFA | JWT |
| POST | `/auth/password/change` | Change password | JWT |
| GET | `/auth/me` | Get current user | JWT |
| POST | `/auth/oauth/disconnect` | Disconnect OAuth | JWT |

#### User Service APIs (Port 8002)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/profile` | Get user profile | JWT |
| POST | `/profile` | Create profile | JWT |
| PUT | `/profile` | Update profile | JWT |
| GET | `/profile/completeness` | Get completeness score | JWT |
| POST | `/profile/photo` | Upload profile photo | JWT |
| GET | `/career/work-experience` | List work experiences | JWT |
| POST | `/career/work-experience` | Add work experience | JWT |
| PUT | `/career/work-experience/:id` | Update work experience | JWT |
| DELETE | `/career/work-experience/:id` | Delete work experience | JWT |
| GET | `/career/education` | List education | JWT |
| POST | `/career/education` | Add education | JWT |
| PUT | `/career/education/:id` | Update education | JWT |
| DELETE | `/career/education/:id` | Delete education | JWT |
| GET | `/skills` | List skills | JWT |
| POST | `/skills` | Add skill | JWT |
| DELETE | `/skills/:id` | Remove skill | JWT |
| POST | `/skills/extract` | Extract skills from resume | JWT |
| GET | `/preferences` | Get job preferences | JWT |
| PUT | `/preferences` | Update preferences | JWT |
| GET | `/subscription` | Get subscription | JWT |
| POST | `/subscription/upgrade` | Upgrade tier | JWT |
| POST | `/subscription/cancel` | Cancel subscription | JWT |

#### Job Service APIs (Port 4002)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/jobs/search` | Search jobs | JWT |
| GET | `/jobs/:id` | Get job details | JWT |
| GET | `/jobs/recommended` | Get recommendations | JWT |
| GET | `/jobs/similar/:id` | Get similar jobs | JWT |
| POST | `/jobs/:id/save` | Save job | JWT |
| DELETE | `/jobs/:id/unsave` | Unsave job | JWT |
| GET | `/jobs/saved` | Get saved jobs | JWT |
| PATCH | `/jobs/:id/saved` | Update saved job | JWT |
| GET | `/jobs/:id/match-score` | Get match score | JWT |
| POST | `/jobs/:id/calculate-match` | Calculate match | JWT |
| GET | `/jobs/:id/interview-questions` | Get interview questions | JWT |
| POST | `/jobs/salary/predict` | Predict salary | JWT |
| POST | `/jobs/:id/track-application` | Track application | JWT |
| POST | `/jobs/:id/report` | Report job | JWT |
| GET | `/jobs/alerts` | List job alerts | JWT |
| POST | `/jobs/alerts` | Create alert | JWT |
| PUT | `/jobs/alerts/:id` | Update alert | JWT |
| DELETE | `/jobs/alerts/:id` | Delete alert | JWT |

#### Resume Service APIs (Port 8004)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/resumes` | List resumes | JWT |
| GET | `/resumes/:id` | Get resume | JWT |
| POST | `/resumes` | Create resume | JWT |
| PUT | `/resumes/:id` | Update resume | JWT |
| DELETE | `/resumes/:id` | Delete resume | JWT |
| POST | `/resumes/upload` | Upload resume file | JWT |
| POST | `/resumes/parse` | Parse uploaded resume | JWT |
| GET | `/resumes/templates` | List templates | JWT |
| POST | `/resumes/from-template` | Create from template | JWT |
| GET | `/resumes/:id/ats-score` | Get ATS score | JWT |
| POST | `/resumes/:id/optimize` | Optimize resume | JWT |
| GET | `/resumes/:id/export/:format` | Export resume | JWT |
| POST | `/resumes/:id/customize/:jobId` | Customize for job | JWT |

#### Auto-Apply Service APIs (Port 8006)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/applications` | List applications | JWT |
| GET | `/applications/:id` | Get application | JWT |
| POST | `/applications` | Track application | JWT |
| PUT | `/applications/:id` | Update application | JWT |
| DELETE | `/applications/:id` | Delete application | JWT |
| GET | `/auto-apply/settings` | Get auto-apply settings | JWT |
| PUT | `/auto-apply/settings` | Update settings | JWT |
| GET | `/auto-apply/answers` | List saved answers | JWT |
| POST | `/auto-apply/answers` | Add answer | JWT |
| PUT | `/auto-apply/answers/:id` | Update answer | JWT |
| DELETE | `/auto-apply/answers/:id` | Delete answer | JWT |
| GET | `/auto-apply/activity` | Get activity log | JWT |

#### Notification Service APIs (Port 8005)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications` | List notifications | JWT |
| GET | `/notifications/:id` | Get notification | JWT |
| POST | `/notifications` | Create notification | JWT (Admin) |
| PATCH | `/notifications/:id/read` | Mark as read | JWT |
| PATCH | `/notifications/read-all` | Mark all read | JWT |
| DELETE | `/notifications/:id` | Delete notification | JWT |
| GET | `/notifications/preferences` | Get preferences | JWT |
| PUT | `/notifications/preferences` | Update preferences | JWT |
| POST | `/notifications/push/register-device` | Register device | JWT |

#### Analytics Service APIs (Port 8007)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/analytics/events` | Track event | JWT |
| GET | `/analytics/activity` | Get recent activity | JWT |
| GET | `/analytics/dashboard` | Get dashboard metrics | JWT |
| GET | `/analytics/applications` | Get application funnel | JWT |
| GET | `/analytics/export` | Export analytics | JWT |
| POST | `/sla/contracts` | Create SLA contract | JWT |
| GET | `/sla/contracts/:id` | Get SLA contract | JWT |
| POST | `/sla/track-progress` | Track SLA progress | JWT |
| GET | `/sla/violations` | Get SLA violations | JWT |

#### Payment Service APIs (Port 8009)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/subscriptions` | List subscriptions | JWT (Admin) |
| GET | `/subscriptions/:id` | Get subscription | JWT |
| GET | `/subscriptions/user/:userId` | Get user subscription | JWT |
| POST | `/subscriptions` | Create subscription | JWT |
| PATCH | `/subscriptions/:id` | Update subscription | JWT |
| DELETE | `/subscriptions/:id` | Delete subscription | JWT (Admin) |
| POST | `/subscriptions/:id/cancel` | Cancel subscription | JWT |
| POST | `/subscriptions/:id/reactivate` | Reactivate | JWT |
| POST | `/subscriptions/:id/upgrade` | Upgrade tier | JWT |
| GET | `/subscriptions/user/:userId/limits` | Get limits | JWT |
| POST | `/subscriptions/user/:userId/check-feature` | Check feature | JWT |
| POST | `/subscriptions/checkout-session` | Create checkout | JWT |
| POST | `/subscriptions/:id/billing-portal` | Billing portal | JWT |

#### AI Service APIs (Port 8008)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/match/resume-job` | Calculate match score | API Key |
| POST | `/match/probability` | Interview probability | API Key |
| POST | `/generate/cover-letter` | Generate cover letter | API Key |
| POST | `/generate/resume-summary` | Generate summary | API Key |
| POST | `/interview-prep/questions` | Generate questions | API Key |
| POST | `/interview-prep/answers` | Generate answers | API Key |
| POST | `/optimize/resume` | Optimize resume | API Key |
| POST | `/optimize/keywords` | Suggest keywords | API Key |
| POST | `/salary/predict` | Predict salary | API Key |
| POST | `/recommendations/jobs` | Job recommendations | API Key |

### 4.2 Authentication & Authorization Flows

#### JWT Authentication Flow
```
1. User submits credentials
2. Auth service validates credentials
3. If MFA enabled, return temp token, require MFA verification
4. Generate JWT access token (15min) + refresh token (7 days)
5. Client stores tokens securely
6. Client includes access token in Authorization header
7. API Gateway validates token
8. Service processes request
9. Before expiry, client uses refresh token to get new access token
```

#### OAuth 2.0 Flow
```
1. User clicks "Login with Google/LinkedIn/GitHub"
2. Redirect to provider authorization endpoint
3. User grants permission
4. Provider redirects to callback with authorization code
5. Auth service exchanges code for provider tokens
6. Auth service retrieves user profile from provider
7. Auth service creates/links local user account
8. Auth service issues JWT tokens
9. Redirect to frontend with tokens
```

### 4.3 External Services & Third-Party Integrations

#### Payment Providers

**Stripe (Global)**
- Purpose: Primary payment processing
- Integration: Stripe SDK v17.x
- Webhooks: Subscription events, payment events
- Environment: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

**Paystack (Africa)**
- Purpose: African market payments
- Integration: REST API
- Supported: NGN, GHS, ZAR, KES
- Webhooks: Transaction events

**Flutterwave (Africa)**
- Purpose: Alternative African payments
- Integration: REST API
- Supported: NGN, GHS, ZAR, KES, USD
- Webhooks: Transaction events

#### AI/ML Services

**OpenAI**
- Models: GPT-4-turbo, text-embedding-ada-002
- Use: Content generation, embeddings
- Rate Limits: Configured per tier

**Anthropic Claude**
- Models: Claude 3 Opus
- Use: Alternative LLM provider

**Pinecone**
- Purpose: Vector similarity search
- Index: Job/resume embeddings
- Dimension: 1536

#### Job Boards

| Platform | Integration Type | Features |
|----------|-----------------|----------|
| Indeed | API + Scraping | Job search, apply |
| LinkedIn | API + OAuth | Jobs, Easy Apply |
| Greenhouse | API | ATS integration |
| Lever | API | ATS integration |
| Workday | Web automation | Form filling |
| Glassdoor | API | Jobs, reviews |

#### Communication Services

**Email**
- Development: MailHog (localhost:1025)
- Production: SendGrid or SMTP

**Push Notifications**
- Mobile: Firebase Cloud Messaging
- Web: Web Push API

#### Storage

**AWS S3**
- Buckets: Resumes, profile photos, exports
- Features: Signed URLs, lifecycle policies

**Azure Blob Storage (Alternative)**
- Container: Documents, backups

---

## 5. Data & Storage Requirements

### 5.1 Core Data Entities

#### User Entity (auth-service)
```typescript
interface User {
  id: UUID;                    // Primary key
  email: string;               // Unique, indexed
  username?: string;           // Unique
  password: string;            // bcrypt hashed
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;     // S3 URL
  role: UserRole;              // ADMIN, USER, RECRUITER, MODERATOR
  status: UserStatus;          // ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION
  authProvider: AuthProvider;  // LOCAL, GOOGLE, LINKEDIN, GITHUB
  providerId?: string;         // OAuth provider ID
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  mfaSecret?: string;          // Encrypted
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;       // Hashed
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockedUntil?: Date;
  metadata?: object;           // JSONB
  createdAt: Date;
  updatedAt: Date;
}
```

#### Profile Entity (user-service)
```typescript
interface Profile {
  id: UUID;
  userId: UUID;                // Unique, FK to User
  fullName?: string;
  headline?: string;           // Professional headline
  bio?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  profilePhotoUrl?: string;
  completenessScore: number;   // 0-100
  createdAt: Date;
  updatedAt: Date;
}
```

#### Job Entity (job-service)
```typescript
interface Job {
  id: UUID;
  externalId?: string;         // Source system ID
  source: JobSource;           // INDEED, LINKEDIN, DIRECT, etc.
  title: string;               // Indexed
  companyId?: UUID;            // FK to Company
  companyName: string;
  companyLogoUrl?: string;
  location: string;            // Indexed
  city?: string;
  state?: string;
  country?: string;
  remoteType: RemoteType;      // ONSITE, REMOTE, HYBRID
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;       // HOURLY, YEARLY
  description: string;
  requirements?: string[];
  benefits?: string[];
  skills?: string[];           // GIN indexed
  experienceLevel: ExperienceLevel;
  experienceYearsMin?: number;
  experienceYearsMax?: number;
  employmentType: EmploymentType;
  applicationUrl: string;
  atsPlatform?: string;
  atsMetadata?: object;        // JSONB
  tags?: string[];
  viewCount: number;
  applicationCount: number;
  saveCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  postedAt: Date;
  expiresAt?: Date;
  embedding?: number[];        // Vector for semantic search
  createdAt: Date;
  updatedAt: Date;
}
```

#### Resume Entity (resume-service)
```typescript
interface Resume {
  id: UUID;
  userId: UUID;                // FK to User
  title: string;
  templateId?: UUID;           // FK to Template
  content: ResumeContent;      // JSONB
  atsScore?: number;           // 0-100
  version: number;
  isPrimary: boolean;
  filePath?: string;           // S3 path
  originalFilename?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;            // Soft delete
}

interface ResumeContent {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications?: Certification[];
  projects?: Project[];
  languages?: Language[];
  customSections?: CustomSection[];
}
```

#### Application Entity (auto-apply-service)
```typescript
interface Application {
  id: UUID;
  userId: UUID;
  jobId: UUID;
  resumeId?: UUID;
  coverLetterId?: UUID;
  status: ApplicationStatus;   // APPLIED, INTERVIEWING, OFFERED, etc.
  source: ApplicationSource;   // MANUAL, AUTO_APPLY, QUICK_APPLY
  atsPlatform?: string;
  applicationReferenceId?: string;
  matchScore?: number;
  formResponses?: object;      // JSONB
  errorLog?: object;           // JSONB
  screenshotUrl?: string;
  appliedAt?: Date;
  responseReceivedAt?: Date;
  retryCount: number;
  queueStatus?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Subscription Entity (payment-service)
```typescript
interface Subscription {
  id: UUID;
  userId: UUID;                // Unique
  tier: SubscriptionTier;      // FREEMIUM to ULTIMATE
  status: SubscriptionStatus;  // ACTIVE, CANCELED, etc.
  stripeCustomerId?: string;   // Unique
  stripeSubscriptionId?: string; // Unique
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ENTITY RELATIONSHIPS                            │
└─────────────────────────────────────────────────────────────────────────┘

User (auth-service)
  │
  ├── 1:1 ──► Profile (user-service)
  │             ├── 1:N ──► WorkExperience
  │             ├── 1:N ──► Education
  │             └── 1:N ──► Certification
  │
  ├── 1:1 ──► Subscription (user-service/payment-service)
  │             └── 1:N ──► Invoice
  │
  ├── 1:N ──► Resume (resume-service)
  │             └── 1:N ──► ResumeVersion
  │
  ├── 1:N ──► Application (auto-apply-service)
  │             ├── N:1 ──► Job
  │             └── N:1 ──► Resume
  │
  ├── 1:N ──► SavedJob (job-service)
  │             └── N:1 ──► Job
  │
  ├── 1:N ──► JobAlert (job-service)
  │
  ├── 1:N ──► Notification (notification-service)
  │
  ├── 1:N ──► AnalyticsEvent (analytics-service)
  │
  └── 1:N ──► SLAContract (analytics-service)
                └── 1:N ──► SLAProgress

Job (job-service)
  │
  ├── N:1 ──► Company
  │
  ├── 1:1 ──► NormalizedJob
  │
  └── 1:N ──► JobReport

Company (job-service)
  │
  └── 1:N ──► CompanyReview
```

### 5.3 Data Persistence Rules

#### Retention Policies
| Data Type | Retention | Archive | Deletion |
|-----------|-----------|---------|----------|
| User accounts | Active + 2 years | After 2 years inactive | On request (GDPR) |
| Applications | 3 years | After 3 years | Anonymize |
| Analytics events | 1 year | Archive to cold storage | After 3 years |
| Audit logs | 7 years | Required | Never |
| Job postings | 90 days after expiry | Archive | After 1 year |
| Sessions | 7 days | None | Automatic |
| Backups | 30 days | Cross-region | Rolling |

#### Caching Strategy
| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| User session | Redis | 7 days | On logout |
| API responses | Redis | 5 min | On data change |
| Job search | Redis | 2 min | On new jobs |
| User preferences | Redis | 30 min | On update |
| Feature flags | Redis | 5 min | On admin change |
| Rate limits | Redis | Variable | Sliding window |

### 5.4 Database Schemas by Service

#### Auth Service Database
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  profile_picture TEXT,
  role VARCHAR(20) DEFAULT 'USER',
  status VARCHAR(30) DEFAULT 'PENDING_VERIFICATION',
  auth_provider VARCHAR(20) DEFAULT 'LOCAL',
  provider_id VARCHAR(255),
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  refresh_token TEXT,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

#### Job Service Database
```sql
-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255),
  source VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  company_id UUID REFERENCES companies(id),
  company_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  remote_type VARCHAR(20),
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  description TEXT,
  requirements TEXT[],
  skills TEXT[],
  experience_level VARCHAR(30),
  employment_type VARCHAR(30),
  application_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  posted_at TIMESTAMP,
  expires_at TIMESTAMP,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_title ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_jobs_skills ON jobs USING gin(skills);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);
CREATE UNIQUE INDEX idx_jobs_source_external ON jobs(source, external_id);
```

---

## 6. User Roles & Permissions

### 6.1 Role Definitions

#### USER (Default Role)
- Standard job seeker account
- Access to all candidate features
- Limited by subscription tier

#### RECRUITER
- Extended permissions for recruiting functions
- Can view candidate profiles (with consent)
- Can post jobs (employer portal)

#### MODERATOR
- Content moderation capabilities
- Can review reported jobs
- Can flag suspicious accounts

#### ADMIN
- Full platform administration
- User management
- System configuration

#### SUPER_ADMIN
- All admin permissions
- Billing and financial access
- Infrastructure access

### 6.2 Permission Matrix

| Permission | USER | RECRUITER | MODERATOR | ADMIN | SUPER_ADMIN |
|------------|------|-----------|-----------|-------|-------------|
| **Profile** |
| profile:read | ✓ | ✓ | ✓ | ✓ | ✓ |
| profile:write | ✓ (own) | ✓ (own) | ✓ (own) | ✓ | ✓ |
| profile:delete | ✓ (own) | ✓ (own) | ✓ (own) | ✓ | ✓ |
| **Resume** |
| resume:read | ✓ (own) | ✓ (consented) | ✓ | ✓ | ✓ |
| resume:write | ✓ (own) | ✓ (own) | ✓ | ✓ | ✓ |
| resume:delete | ✓ (own) | ✓ (own) | ✓ | ✓ | ✓ |
| **Jobs** |
| job:read | ✓ | ✓ | ✓ | ✓ | ✓ |
| job:write | ✗ | ✓ | ✗ | ✓ | ✓ |
| job:delete | ✗ | ✓ (own) | ✓ | ✓ | ✓ |
| job:moderate | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Applications** |
| application:read | ✓ (own) | ✓ (assigned) | ✗ | ✓ | ✓ |
| application:write | ✓ (own) | ✓ (own) | ✗ | ✓ | ✓ |
| auto-apply:use | Tier-limited | ✗ | ✗ | ✓ | ✓ |
| **Analytics** |
| analytics:read | ✓ (own) | ✓ (own) | ✗ | ✓ | ✓ |
| analytics:platform | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Users** |
| user:list | ✗ | ✗ | ✓ | ✓ | ✓ |
| user:manage | ✗ | ✗ | ✗ | ✓ | ✓ |
| user:suspend | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Billing** |
| billing:read | ✓ (own) | ✓ (own) | ✗ | ✓ | ✓ |
| billing:manage | ✗ | ✗ | ✗ | ✗ | ✓ |
| **System** |
| system:config | ✗ | ✗ | ✗ | ✓ | ✓ |
| system:logs | ✗ | ✗ | ✗ | ✓ | ✓ |
| system:infrastructure | ✗ | ✗ | ✗ | ✗ | ✓ |

### 6.3 Access Enforcement Rules

1. **Authentication Required**: All non-public endpoints require valid JWT
2. **Role Verification**: Middleware checks user role before permission check
3. **Resource Ownership**: Users can only access their own resources unless elevated permissions
4. **Subscription Limits**: Features gated by subscription tier in addition to role
5. **Tenant Isolation**: B2B users isolated within their tenant
6. **Audit Logging**: All permission denials logged for security review

---

## 7. Expanded Implementation Steps

### 7.1 Authentication System Implementation

#### Step 1: Auth Service Setup
**Category:** Backend
**Priority:** P0 (Critical)

**Tasks:**
1. Initialize NestJS project with TypeORM
2. Configure PostgreSQL connection
3. Create User entity with all fields
4. Implement password hashing utility (bcrypt)
5. Set up JWT module with RS256 signing

**Acceptance Criteria:**
- [ ] Database migration creates users table
- [ ] Password hashing verified (bcrypt 12 rounds)
- [ ] JWT tokens generated and validated
- [ ] Unit tests pass (>80% coverage)

---

#### Step 2: Registration Flow
**Category:** Backend + Frontend

**Backend Tasks:**
1. Create RegisterDto with validation
2. Implement registration endpoint
3. Generate email verification token
4. Send verification email
5. Create email templates

**Frontend Tasks:**
1. Create registration form component
2. Implement form validation (Zod)
3. Handle API response/errors
4. Create success/verification page

**Acceptance Criteria:**
- [ ] Registration creates user in pending_verification status
- [ ] Verification email sent within 5 seconds
- [ ] Duplicate email returns 409 Conflict
- [ ] Password validation enforced (8+ chars, complexity)

---

#### Step 3: Login Flow
**Category:** Backend + Frontend

**Backend Tasks:**
1. Create LoginDto
2. Implement login endpoint
3. Validate credentials
4. Check account status/lockout
5. Issue JWT tokens
6. Track login attempts

**Frontend Tasks:**
1. Create login form component
2. Implement token storage (secure)
3. Set up axios interceptors
4. Handle MFA redirect

**Acceptance Criteria:**
- [ ] Successful login returns access + refresh tokens
- [ ] Invalid credentials return 401
- [ ] Locked account returns 423
- [ ] Login attempts tracked and limited

---

#### Step 4: OAuth Integration
**Category:** Backend + Frontend

**Backend Tasks:**
1. Configure Passport strategies (Google, LinkedIn, GitHub)
2. Implement OAuth callback handlers
3. Create/link user accounts from OAuth data
4. Handle token generation post-OAuth

**Frontend Tasks:**
1. Create social login buttons
2. Handle OAuth redirect flow
3. Process callback tokens

**Acceptance Criteria:**
- [ ] Google OAuth working end-to-end
- [ ] LinkedIn OAuth working end-to-end
- [ ] GitHub OAuth working end-to-end
- [ ] Existing account linking works

---

#### Step 5: MFA Implementation
**Category:** Backend + Frontend

**Backend Tasks:**
1. Install speakeasy and qrcode packages
2. Implement MFA setup endpoint (generate secret)
3. Implement MFA verification endpoint
4. Generate backup codes
5. Implement MFA disable with verification

**Frontend Tasks:**
1. Create MFA setup flow
2. Display QR code for authenticator
3. Create MFA verification modal
4. Display and manage backup codes

**Acceptance Criteria:**
- [ ] QR code scannable by authenticator apps
- [ ] TOTP codes validated correctly
- [ ] Backup codes work once each
- [ ] MFA can be disabled securely

---

### 7.2 User Profile Implementation

#### Step 6: Profile Service Setup
**Category:** Backend

**Tasks:**
1. Create Profile, WorkExperience, Education entities
2. Implement CRUD endpoints for each
3. Calculate completeness score
4. Set up S3 integration for photo upload

**Acceptance Criteria:**
- [ ] Profile CRUD working
- [ ] Photo upload to S3 working
- [ ] Completeness score calculates correctly
- [ ] Data validation enforced

---

#### Step 7: Profile Frontend
**Category:** Frontend

**Tasks:**
1. Create profile settings page
2. Create work experience form
3. Create education form
4. Create skills management component
5. Implement profile photo upload

**Acceptance Criteria:**
- [ ] All profile fields editable
- [ ] Form validation working
- [ ] Photo upload with preview
- [ ] Progress indicator shows completeness

---

### 7.3 Resume System Implementation

#### Step 8: Resume Service Setup
**Category:** Backend

**Tasks:**
1. Create Resume, ResumeVersion, Template entities
2. Implement resume CRUD endpoints
3. Integrate pdf-parse and mammoth for parsing
4. Set up S3 for resume file storage
5. Implement version control

**Acceptance Criteria:**
- [ ] Resume CRUD working
- [ ] PDF parsing extracts data correctly
- [ ] DOCX parsing extracts data correctly
- [ ] Version history maintained

---

#### Step 9: AI Resume Features
**Category:** Backend (AI Service)

**Tasks:**
1. Set up FastAPI project
2. Configure OpenAI integration
3. Implement resume optimization endpoint
4. Implement ATS scoring algorithm
5. Implement keyword extraction

**Acceptance Criteria:**
- [ ] Resume optimization returns actionable suggestions
- [ ] ATS score correlates with real ATS systems
- [ ] Keywords extracted accurately
- [ ] Response times < 5 seconds

---

#### Step 10: Resume Frontend
**Category:** Frontend

**Tasks:**
1. Create resume list page
2. Create resume editor (builder)
3. Create template selector
4. Create ATS score display
5. Implement export functionality

**Acceptance Criteria:**
- [ ] Resume builder intuitive and complete
- [ ] Templates render correctly
- [ ] ATS suggestions actionable
- [ ] PDF/DOCX export working

---

### 7.4 Job System Implementation

#### Step 11: Job Service Setup
**Category:** Backend

**Tasks:**
1. Create Job, Company, SavedJob entities
2. Implement search endpoint with filters
3. Set up job ingestion system
4. Create job adapters for each source
5. Implement normalization pipeline

**Acceptance Criteria:**
- [ ] Job search returns relevant results
- [ ] Filters work correctly
- [ ] Ingestion fetches from job boards
- [ ] Normalization standardizes data

---

#### Step 12: Job Matching
**Category:** Backend (AI Service)

**Tasks:**
1. Implement embedding generation for jobs
2. Set up Pinecone integration
3. Implement match score calculation
4. Create recommendation algorithm

**Acceptance Criteria:**
- [ ] Match scores correlate with actual fit
- [ ] Recommendations improve with usage
- [ ] Vector search returns similar jobs
- [ ] Performance meets requirements

---

#### Step 13: Job Frontend
**Category:** Frontend

**Tasks:**
1. Create job search page with filters
2. Create job details page
3. Create saved jobs management
4. Create job alerts configuration
5. Display match scores

**Acceptance Criteria:**
- [ ] Search responsive and fast
- [ ] Filters apply correctly
- [ ] Job details complete
- [ ] Alerts create and trigger

---

### 7.5 Auto-Apply System Implementation

#### Step 14: Auto-Apply Service Setup
**Category:** Backend

**Tasks:**
1. Create Application entity
2. Set up Playwright browser automation
3. Implement ATS adapters (Greenhouse, Lever, etc.)
4. Create queue system with Bull
5. Implement anti-detection measures

**Acceptance Criteria:**
- [ ] Automated applications submit successfully
- [ ] Multiple ATS platforms supported
- [ ] Queue processes applications reliably
- [ ] Detection rate < 5%

---

#### Step 15: Auto-Apply Frontend
**Category:** Frontend

**Tasks:**
1. Create auto-apply settings page
2. Create answer library management
3. Create activity log view
4. Create quick review panel

**Acceptance Criteria:**
- [ ] Settings configure auto-apply behavior
- [ ] Answer library covers common questions
- [ ] Activity log shows all applications
- [ ] Quick review allows pre-submission editing

---

### 7.6 Payment System Implementation

#### Step 16: Payment Service Setup
**Category:** Backend

**Tasks:**
1. Create Subscription, Invoice entities
2. Integrate Stripe SDK
3. Implement checkout session creation
4. Set up webhook handling
5. Implement usage tracking

**Acceptance Criteria:**
- [ ] Checkout flow completes purchase
- [ ] Webhooks update subscription status
- [ ] Usage limits enforced
- [ ] Invoices generated correctly

---

#### Step 17: African Payment Integration
**Category:** Backend

**Tasks:**
1. Integrate Paystack SDK
2. Integrate Flutterwave SDK
3. Implement transaction verification
4. Set up webhook handling

**Acceptance Criteria:**
- [ ] Paystack payments work in Nigeria
- [ ] Flutterwave payments work across Africa
- [ ] Webhooks process correctly
- [ ] Currency conversion accurate

---

### 7.7 Infrastructure Implementation

#### Step 18: Kubernetes Deployment
**Category:** DevOps

**Tasks:**
1. Create Kubernetes manifests for all services
2. Configure ingress controller
3. Set up ConfigMaps and Secrets
4. Configure HPA for auto-scaling
5. Implement health probes

**Acceptance Criteria:**
- [ ] All services deploy to AKS
- [ ] Ingress routes traffic correctly
- [ ] Secrets managed via Key Vault
- [ ] Auto-scaling triggers appropriately

---

#### Step 19: CI/CD Pipeline
**Category:** DevOps

**Tasks:**
1. Configure GitHub Actions workflows
2. Implement build and test pipeline
3. Configure container scanning
4. Set up staging and production deployments
5. Implement rollback capability

**Acceptance Criteria:**
- [ ] CI runs on every PR
- [ ] CD deploys to staging automatically
- [ ] Production requires approval
- [ ] Rollback executes in < 5 minutes

---

#### Step 20: Monitoring Setup
**Category:** DevOps

**Tasks:**
1. Configure Azure Application Insights
2. Set up Prometheus metrics
3. Create Grafana dashboards
4. Configure alerts
5. Implement distributed tracing

**Acceptance Criteria:**
- [ ] All services emit metrics
- [ ] Dashboards show service health
- [ ] Alerts fire on anomalies
- [ ] Traces span across services

---

### 7.8 Testing Strategy

#### Unit Testing
- Jest for JavaScript/TypeScript
- Pytest for Python
- Minimum 80% coverage
- Run on every commit

#### Integration Testing
- Test service interactions
- Test database operations
- Test external API mocks
- Run on PR merge

#### End-to-End Testing
- Playwright for web application
- Test critical user flows
- Run nightly and before release

#### Performance Testing
- Load testing with k6
- Target: 1000 concurrent users
- API response times < 200ms p95
- Run weekly

---

## Appendices

### A. Glossary
- **ATS**: Applicant Tracking System
- **JWT**: JSON Web Token
- **MFA**: Multi-Factor Authentication
- **TOTP**: Time-based One-Time Password
- **RBAC**: Role-Based Access Control
- **SLA**: Service Level Agreement

### B. References
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Azure AKS Documentation](https://docs.microsoft.com/azure/aks/)

### C. Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-01-15 | Engineering | Initial PRD |
| 2.0.0 | 2025-12-16 | Engineering | Complete rewrite, comprehensive documentation |

---

*Document generated from codebase analysis on December 16, 2025*
