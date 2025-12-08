# ApplyPlatform/ApplyForUs - Complete System Architecture

**Version:** 2.0
**Date:** December 2025
**Status:** Target Architecture Definition

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [High-Level Architecture](#high-level-architecture)
4. [Client Applications](#client-applications)
5. [Backend Services](#backend-services)
6. [Data Architecture](#data-architecture)
7. [External Integrations](#external-integrations)
8. [Security Architecture](#security-architecture)
9. [API Contracts](#api-contracts)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

ApplyPlatform (also known as ApplyForUs or JobPilot AI) is an enterprise-grade, AI-powered job application automation platform built on a modern microservices architecture. The platform serves three primary user personas:

1. **Job Seekers** - Search, apply, and track job applications with AI assistance
2. **Employers** - Post jobs, screen candidates, and manage hiring workflows
3. **Platform Administrators** - Monitor platform health, manage users, and configure system settings

### Design Principles

- **Microservices Architecture**: Independent, scalable services organized by business domain
- **API-First Design**: All functionality exposed via RESTful APIs
- **Event-Driven**: Asynchronous communication via message queues
- **Cloud-Native**: Containerized with Kubernetes orchestration
- **Security-First**: Enterprise-grade security with encryption, OAuth, MFA
- **AI-Powered**: Integrated AI/ML for resume optimization, job matching, and automation

---

## System Overview

### Technology Stack

**Frontend:**
- Next.js 14+ (Web Application)
- React Native (Mobile Application - iOS/Android)
- Chrome Extension API (Browser Extension)
- Next.js (Admin Portal)
- TypeScript, TailwindCSS, shadcn/ui

**Backend:**
- Node.js 20+ / NestJS (Microservices)
- Python 3.11+ / FastAPI (AI Service)
- TypeScript
- TypeORM / Prisma (ORM)

**Data Layer:**
- PostgreSQL 15+ (Primary Database)
- Redis 7+ (Cache & Sessions)
- Elasticsearch 8+ (Search Engine)
- RabbitMQ 3.12+ (Message Queue)
- Azure Blob Storage (File Storage)
- Pinecone (Vector Database for AI)

**Infrastructure:**
- Docker & Docker Compose
- Kubernetes (AKS/EKS/GKE)
- Terraform (Infrastructure as Code)
- GitHub Actions / Azure Pipelines (CI/CD)

**External Services:**
- OpenAI GPT-4 / Anthropic Claude (AI)
- SendGrid (Email)
- Stripe (Payments)
- Firebase Cloud Messaging (Push Notifications)
- OAuth Providers (Google, LinkedIn, GitHub)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT LAYER                                   │
├──────────────────┬──────────────────┬──────────────────┬───────────────────┤
│   Web App        │   Mobile App     │   Admin Portal   │  Chrome Extension │
│   (Next.js)      │  (React Native)  │    (Next.js)     │   (Manifest V3)   │
│   Port: 3000     │   iOS/Android    │   Port: 3001     │   Browser Plugin  │
└──────────────────┴──────────────────┴──────────────────┴───────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                             │
│                   (NGINX / Kong / Azure App Gateway)                         │
│  • Request Routing         • Rate Limiting          • SSL Termination       │
│  • Load Balancing          • Authentication         • Request Logging       │
│  • API Versioning          • CORS Handling          • Circuit Breaker       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATION LAYER                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Orchestrator Service (Port: 8008)                   │  │
│  │  • Workflow Coordination    • Saga Pattern         • Service Health   │  │
│  │  • Circuit Breaker          • Distributed Tracing  • Retry Logic      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MICROSERVICES LAYER                                 │
├────────────────┬────────────────┬────────────────┬────────────────┬─────────┤
│ Auth Service   │ User Service   │ Job Service    │ Resume Service │ App Svc │
│   Port: 4000   │   Port: 4004   │   Port: 4002   │   Port: 4001   │ 4003    │
│                │                │                │                │         │
│ • Registration │ • User Profile │ • Job Listings │ • Resume CRUD  │ • Apply │
│ • Login/Logout │ • Preferences  │ • Job Search   │ • Parsing      │ • Track │
│ • JWT Tokens   │ • Skills Mgmt  │ • Matching     │ • Optimization │ • Status│
│ • OAuth (G/L)  │ • Subscriptions│ • Saved Jobs   │ • Templates    │ • Auto  │
│ • MFA/2FA      │ • Settings     │ • Alerts       │ • Versions     │ • Apply │
│ • Pwd Reset    │ • Storage      │ • Companies    │ • Export       │         │
├────────────────┼────────────────┼────────────────┼────────────────┼─────────┤
│ Notification   │ Analytics      │ AI Service     │ Employer Svc   │         │
│   Port: 4005   │   Port: 4006   │   Port: 5000   │   (MISSING)    │         │
│                │                │   (Python)     │                │         │
│ • Email (SMTP) │ • Metrics      │ • Job Match    │ • Post Jobs    │         │
│ • Push (FCM)   │ • Dashboards   │ • Resume Opt   │ • Candidate    │         │
│ • In-App       │ • Reports      │ • Cover Letter │   Search       │         │
│ • Templates    │ • Tracking     │ • Salary Pred  │ • Screening    │         │
│ • Preferences  │ • Events       │ • Interview Q  │ • Shortlist    │         │
│ • Queues       │ • Insights     │ • Embeddings   │ • Analytics    │         │
└────────────────┴────────────────┴────────────────┴────────────────┴─────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MESSAGE QUEUE LAYER                                  │
│  ┌────────────────────────────┐          ┌────────────────────────────┐     │
│  │      RabbitMQ Broker       │          │     Redis Pub/Sub          │     │
│  │      Port: 5672/15672      │          │      Port: 6379            │     │
│  │  • Application Queue       │          │  • Real-time Events        │     │
│  │  • Notification Queue      │          │  • WebSocket Support       │     │
│  │  • Analytics Queue         │          │  • Cache Invalidation      │     │
│  │  • Resume Processing       │          │  • Session Management      │     │
│  │  • Job Aggregation         │          │                            │     │
│  │  • Dead Letter Queue       │          │                            │     │
│  └────────────────────────────┘          └────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ PostgreSQL   │ Redis        │ Elasticsearch│ Pinecone     │ Azure Blob     │
│   :5432      │   :6379      │   :9200      │ (Cloud)      │ (Cloud)        │
│              │              │              │              │                │
│ • Users      │ • Sessions   │ • Jobs Index │ • Resume     │ • Resume Files │
│ • Profiles   │ • Cache      │ • Full-Text  │   Embeddings │ • Avatars      │
│ • Resumes    │ • Rate Limit │ • Faceted    │ • Job        │ • Cover Letter │
│ • Jobs       │ • Job Queue  │   Search     │   Embeddings │ • Exports      │
│ • Apps       │ • Analytics  │ • Geo Search │ • Similarity │ • User Uploads │
│ • Companies  │ • Locks      │ • Suggest    │   Search     │ • Backups      │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ OpenAI       │ SendGrid     │ Stripe       │ LinkedIn API │ Indeed API     │
│ GPT-4/3.5    │ Email        │ Payments     │ OAuth/Jobs   │ Job Scraping   │
├──────────────┼──────────────┼──────────────┼──────────────┼────────────────┤
│ Anthropic    │ Firebase     │ Google OAuth │ GitHub OAuth │ Job Board APIs │
│ Claude       │ Push Notify  │ SSO          │ SSO          │ Aggregation    │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY                                │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ Prometheus   │ Grafana      │ Jaeger       │ ELK Stack    │ Azure Monitor  │
│ Metrics      │ Dashboards   │ Tracing      │ Logging      │ App Insights   │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## Client Applications

### 1. Web Application (Next.js)

**Purpose:** Primary interface for job seekers
**Port:** 3000
**Tech Stack:** Next.js 14+, React 18, TypeScript, TailwindCSS

**Key Features:**
- User authentication (login, register, OAuth, MFA)
- Job search and filtering
- Application tracking
- Resume builder and management
- AI-powered tools (resume optimizer, cover letter generator, interview prep)
- Auto-apply configuration
- Analytics dashboard
- Profile management
- Notifications center

**Routes:**
```
/                          # Landing page
/(auth)
  /login                   # User login
  /register                # User registration
  /forgot-password         # Password reset
  /verify-email            # Email verification
  /oauth/callback          # OAuth callback
/(dashboard)
  /dashboard               # Main dashboard
  /jobs                    # Job search
  /jobs/[id]              # Job details
  /jobs/alerts             # Job alerts
  /applications            # Applications tracking
  /resumes                 # Resume management
  /resumes/[id]           # Resume editor
  /ai-tools                # AI tools hub
    /resume-optimizer      # Resume optimization
    /cover-letter-generator # Cover letter AI
    /interview-prep        # Interview preparation
    /salary-assistant      # Salary insights
    /skills-gap            # Skills gap analysis
  /auto-apply              # Auto-apply settings
    /settings              # Configure auto-apply
    /activity              # Auto-apply activity
  /analytics               # Analytics dashboard
  /profile                 # User profile
  /notifications           # Notifications
  /settings                # User settings
```

### 2. Admin Portal (Next.js)

**Purpose:** Platform administration interface
**Port:** 3001
**Tech Stack:** Next.js 14+, React 18, TypeScript, TailwindCSS

**Key Features:**
- User management (view, edit, suspend, delete users)
- Job moderation (review, approve, reject job postings)
- Content moderation (job reports, spam detection)
- Platform analytics and metrics
- System configuration
- Audit logs
- Financial reports
- Support ticket management

**Routes:**
```
/admin
  /dashboard               # Admin overview
  /users                   # User management
  /jobs                    # Job management
  /job-reports             # Reported jobs
  /applications            # Application monitoring
  /analytics               # Platform analytics
  /settings                # System configuration
  /audit-logs              # Activity logs
  /support                 # Support tickets
```

### 3. Employer Dashboard (MISSING - TO BE BUILT)

**Purpose:** Interface for companies to post jobs and manage candidates
**Port:** 3002 (Proposed)
**Tech Stack:** Next.js 14+, React 18, TypeScript, TailwindCSS

**Key Features (Proposed):**
- Company profile management
- Job posting creation and management
- Candidate search and filtering
- AI-powered candidate screening
- Application tracking
- Interview scheduling
- Analytics and hiring metrics
- Team collaboration
- Employer branding page builder

### 4. Mobile Application (React Native)

**Purpose:** Mobile interface for job seekers (iOS/Android)
**Status:** Scaffolded, needs implementation
**Tech Stack:** React Native, Expo, TypeScript

**Key Features:**
- Job search on-the-go
- Quick apply functionality
- Push notifications
- Resume upload and management
- Application status tracking
- Saved jobs

### 5. Chrome Extension

**Purpose:** Quick apply from job boards
**Status:** Scaffolded, needs implementation
**Tech Stack:** Chrome Manifest V3, TypeScript

**Key Features:**
- Detect job postings on external sites
- One-click apply with saved resume
- Auto-fill application forms
- Save jobs to platform
- Application tracking

---

## Backend Services

### 1. Auth Service (Port: 4000)

**Technology:** Node.js, NestJS, TypeScript
**Database:** PostgreSQL, Redis
**Status:** ✅ IMPLEMENTED

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Refresh token management
- OAuth integration (Google, LinkedIn, GitHub)
- Multi-factor authentication (TOTP)
- Password reset and email verification
- Session management
- Rate limiting and brute force protection

**API Endpoints:**
```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # User login
POST   /api/v1/auth/logout            # User logout
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password with token
POST   /api/v1/auth/verify-email      # Verify email address
POST   /api/v1/auth/resend-verification # Resend verification email
GET    /api/v1/auth/oauth/:provider   # OAuth login (Google, LinkedIn, GitHub)
GET    /api/v1/auth/oauth/callback    # OAuth callback
POST   /api/v1/auth/mfa/enable        # Enable MFA
POST   /api/v1/auth/mfa/verify        # Verify MFA code
POST   /api/v1/auth/mfa/disable       # Disable MFA
GET    /api/v1/auth/me                # Get current user
```

**Database Tables:**
- `users` - User authentication data
- `sessions` - Active user sessions
- `refresh_tokens` - Refresh tokens
- `oauth_connections` - OAuth provider connections
- `mfa_secrets` - MFA TOTP secrets
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification tokens

### 2. User Service (Port: 4004)

**Technology:** Node.js, NestJS, TypeScript
**Database:** PostgreSQL, Redis, Azure Blob Storage
**Status:** ✅ IMPLEMENTED

**Responsibilities:**
- User profile management
- Skills and experience management
- Education and certifications
- Preferences and settings
- Subscription management
- Profile photo upload
- Storage service integration (Azure Blob)

**API Endpoints:**
```
GET    /api/v1/users/:id              # Get user profile
PATCH  /api/v1/users/:id              # Update user profile
DELETE /api/v1/users/:id              # Delete user account
GET    /api/v1/users/:id/skills       # Get user skills
POST   /api/v1/users/:id/skills       # Add skills
DELETE /api/v1/users/:id/skills/:skillId # Remove skill
GET    /api/v1/users/:id/experience   # Get work experience
POST   /api/v1/users/:id/experience   # Add experience
PATCH  /api/v1/users/:id/experience/:expId # Update experience
DELETE /api/v1/users/:id/experience/:expId # Delete experience
GET    /api/v1/users/:id/education    # Get education
POST   /api/v1/users/:id/education    # Add education
GET    /api/v1/users/:id/preferences  # Get preferences
PATCH  /api/v1/users/:id/preferences  # Update preferences
POST   /api/v1/users/:id/photo        # Upload profile photo
GET    /api/v1/users/:id/subscription # Get subscription
PATCH  /api/v1/users/:id/subscription # Update subscription
```

**Database Tables:**
- `user_profiles` - User profile information
- `skills` - User skills
- `work_experiences` - Work history
- `educations` - Educational background
- `certifications` - Professional certifications
- `preferences` - User preferences and job alerts
- `subscriptions` - Subscription tiers and status

### 3. Job Service (Port: 4002)

**Technology:** Node.js, NestJS, TypeScript
**Database:** PostgreSQL, Redis, Elasticsearch
**Status:** ✅ IMPLEMENTED (Partial)

**Responsibilities:**
- Job listing management
- Job search and filtering (Elasticsearch)
- Job recommendations and matching
- Saved jobs
- Job alerts
- Company information
- Job scraping and aggregation
- Interview question generation
- Job reporting and moderation

**API Endpoints:**
```
GET    /api/v1/jobs                   # Search jobs
POST   /api/v1/jobs                   # Create job (employer/admin)
GET    /api/v1/jobs/:id               # Get job details
PATCH  /api/v1/jobs/:id               # Update job
DELETE /api/v1/jobs/:id               # Delete job
POST   /api/v1/jobs/:id/save          # Save job
DELETE /api/v1/jobs/:id/save          # Unsave job
GET    /api/v1/jobs/:id/match-score   # Get match score
POST   /api/v1/jobs/:id/report        # Report job
GET    /api/v1/jobs/recommendations   # Get job recommendations
GET    /api/v1/jobs/saved             # Get saved jobs
GET    /api/v1/jobs/alerts            # Get job alerts
POST   /api/v1/jobs/alerts            # Create job alert
PATCH  /api/v1/jobs/alerts/:id        # Update job alert
DELETE /api/v1/jobs/alerts/:id        # Delete job alert
GET    /api/v1/companies              # List companies
GET    /api/v1/companies/:id          # Get company details
GET    /api/v1/reports                # Get job reports (admin)
PATCH  /api/v1/reports/:id            # Update report status
```

**Database Tables:**
- `jobs` - Job listings
- `companies` - Company information
- `company_reviews` - Company reviews
- `saved_jobs` - User saved jobs
- `job_alerts` - Job alert configurations
- `job_views` - Job view tracking
- `job_reports` - Reported jobs
- `job_categories` - Job categories/tags

### 4. Resume Service (Port: 4001)

**Technology:** Node.js, NestJS, TypeScript
**Database:** PostgreSQL, Redis, Azure Blob Storage
**Status:** ✅ IMPLEMENTED

**Responsibilities:**
- Resume CRUD operations
- Resume parsing (PDF, DOCX to structured data)
- Resume templates
- Multiple resume versions
- AI-powered resume optimization
- Resume export (PDF, DOCX, TXT)
- Resume sharing and public links
- ATS compatibility checking

**API Endpoints:**
```
POST   /api/v1/resumes                # Create resume
GET    /api/v1/resumes                # List user resumes
GET    /api/v1/resumes/:id            # Get resume
PATCH  /api/v1/resumes/:id            # Update resume
DELETE /api/v1/resumes/:id            # Delete resume
POST   /api/v1/resumes/parse          # Parse uploaded resume
POST   /api/v1/resumes/:id/optimize   # AI optimize resume
GET    /api/v1/resumes/:id/export     # Export resume (PDF/DOCX)
POST   /api/v1/resumes/:id/duplicate  # Duplicate resume
GET    /api/v1/resumes/:id/versions   # Get resume versions
POST   /api/v1/resumes/:id/share      # Generate share link
GET    /api/v1/templates              # Get resume templates
GET    /api/v1/templates/:id          # Get template details
```

**Database Tables:**
- `resumes` - Resume metadata
- `resume_versions` - Version history
- `resume_sections` - Resume sections (work, education, skills)
- `resume_templates` - Resume templates
- `resume_shares` - Shared resume links

### 5. Auto-Apply Service (Port: 4003)

**Technology:** Node.js, NestJS, TypeScript, Playwright
**Database:** PostgreSQL, Redis, RabbitMQ
**Status:** ✅ IMPLEMENTED (Partial)

**Responsibilities:**
- Automated job application submission
- Browser automation (Playwright)
- Application tracking and status updates
- Auto-apply settings and preferences
- Application history and analytics
- Rate limiting per platform
- CAPTCHA handling
- Multi-platform support (LinkedIn, Indeed, etc.)

**API Endpoints:**
```
POST   /api/v1/applications           # Submit application
GET    /api/v1/applications           # List applications
GET    /api/v1/applications/:id       # Get application status
PATCH  /api/v1/applications/:id       # Update application
DELETE /api/v1/applications/:id       # Withdraw application
GET    /api/v1/auto-apply/settings    # Get auto-apply settings
PATCH  /api/v1/auto-apply/settings    # Update auto-apply settings
POST   /api/v1/auto-apply/start       # Start auto-apply
POST   /api/v1/auto-apply/stop        # Stop auto-apply
GET    /api/v1/auto-apply/status      # Get auto-apply status
GET    /api/v1/auto-apply/activity    # Get auto-apply activity
```

**Database Tables:**
- `applications` - Application records
- `application_history` - Application status changes
- `auto_apply_settings` - User auto-apply configurations
- `platform_credentials` - Encrypted platform credentials
- `auto_apply_sessions` - Active auto-apply sessions
- `application_logs` - Detailed application logs

### 6. Notification Service (Port: 4005)

**Technology:** Node.js, NestJS, TypeScript
**Database:** PostgreSQL, Redis, RabbitMQ
**Status:** ✅ IMPLEMENTED

**Responsibilities:**
- Email notifications (SendGrid)
- Push notifications (Firebase Cloud Messaging)
- In-app notifications
- Notification preferences management
- Email templates
- Batch notifications
- Notification scheduling
- Notification history

**API Endpoints:**
```
POST   /api/v1/notifications/send     # Send notification
GET    /api/v1/notifications          # List notifications
GET    /api/v1/notifications/:id      # Get notification
PATCH  /api/v1/notifications/:id/read # Mark as read
DELETE /api/v1/notifications/:id      # Delete notification
GET    /api/v1/notifications/preferences # Get preferences
PATCH  /api/v1/notifications/preferences # Update preferences
POST   /api/v1/notifications/subscribe # Subscribe to push
DELETE /api/v1/notifications/subscribe # Unsubscribe from push
POST   /api/v1/notifications/test     # Send test notification
```

**Database Tables:**
- `notifications` - Notification records
- `notification_preferences` - User notification preferences
- `device_tokens` - Push notification device tokens
- `email_templates` - Email templates
- `notification_queue` - Pending notifications

### 7. Analytics Service (Port: 4006)

**Technology:** Node.js, NestJS, TypeScript
**Database:** PostgreSQL, Redis
**Status:** ✅ IMPLEMENTED

**Responsibilities:**
- Application success rate tracking
- User engagement metrics
- Job market analytics
- Performance dashboards
- Custom reports and exports
- A/B testing analytics
- User behavior tracking
- Event tracking

**API Endpoints:**
```
GET    /api/v1/analytics/dashboard    # Get dashboard data
GET    /api/v1/analytics/applications # Application metrics
GET    /api/v1/analytics/jobs         # Job market analytics
GET    /api/v1/analytics/users        # User engagement metrics
POST   /api/v1/analytics/track        # Track custom event
GET    /api/v1/analytics/reports      # Get reports
POST   /api/v1/analytics/reports      # Generate report
GET    /api/v1/analytics/export       # Export analytics data
```

**Database Tables:**
- `events` - User events
- `metrics` - Aggregated metrics
- `reports` - Generated reports
- `dashboards` - Custom dashboards
- `ab_tests` - A/B test configurations

### 8. AI Service (Port: 5000)

**Technology:** Python 3.11+, FastAPI
**Database:** Redis, Pinecone (Vector DB)
**Status:** ✅ IMPLEMENTED

**Responsibilities:**
- Resume parsing and analysis
- Job matching algorithm (semantic search)
- Resume optimization suggestions
- Cover letter generation (OpenAI GPT-4)
- Salary prediction
- Interview question generation
- Skills gap analysis
- Vector embeddings (OpenAI)
- RAG (Retrieval-Augmented Generation)

**API Endpoints:**
```
POST   /api/ai/parse-resume           # Parse resume
POST   /api/ai/match-jobs             # Match jobs to resume
POST   /api/ai/optimize-resume        # Optimize resume
POST   /api/ai/generate-cover-letter  # Generate cover letter
POST   /api/ai/predict-salary         # Predict salary
POST   /api/ai/generate-questions     # Generate interview questions
POST   /api/ai/analyze-skills-gap     # Analyze skills gap
POST   /api/ai/embeddings             # Generate embeddings
GET    /api/ai/health                 # Health check
```

**Key AI Features:**
- LLM Gateway (multi-provider: OpenAI, Anthropic)
- Prompt Management
- Vector Search (Pinecone)
- Model Cache (Redis)
- RAG Engine

### 9. Orchestrator Service (Port: 8008)

**Technology:** Node.js, NestJS, TypeScript
**Database:** PostgreSQL, Redis
**Status:** ✅ IMPLEMENTED (Partial)

**Responsibilities:**
- Multi-service workflow coordination
- Saga pattern implementation
- Distributed transaction management
- Service health monitoring
- Circuit breaker implementation
- Retry logic and fallback strategies
- Service discovery

**API Endpoints:**
```
POST   /api/v1/workflows              # Create workflow
GET    /api/v1/workflows/:id          # Get workflow status
POST   /api/v1/workflows/:id/cancel   # Cancel workflow
GET    /api/v1/health/services        # Get service health
GET    /api/v1/health/dependencies    # Get dependency health
```

### 10. Employer Service (NOT IMPLEMENTED - MISSING)

**Technology:** Node.js, NestJS, TypeScript (Proposed)
**Database:** PostgreSQL, Redis (Proposed)
**Status:** ❌ NOT IMPLEMENTED - CRITICAL GAP

**Proposed Responsibilities:**
- Employer profile management
- Job posting creation and management
- Candidate search and filtering
- AI-powered candidate screening
- Candidate shortlisting
- Interview scheduling
- Hiring analytics
- Employer branding page builder
- Team collaboration
- Diversity & Inclusion (D&I) analysis

**Proposed API Endpoints:**
```
POST   /api/v1/employer/register      # Employer registration
GET    /api/v1/employer/profile       # Get employer profile
PATCH  /api/v1/employer/profile       # Update employer profile
POST   /api/v1/employer/jobs          # Post job
GET    /api/v1/employer/jobs          # List employer jobs
GET    /api/v1/employer/jobs/:id      # Get job details
PATCH  /api/v1/employer/jobs/:id      # Update job
DELETE /api/v1/employer/jobs/:id      # Delete job
GET    /api/v1/employer/candidates    # Search candidates
GET    /api/v1/employer/applications  # View applications
POST   /api/v1/employer/screen        # AI screen candidates
POST   /api/v1/employer/shortlist     # Create shortlist
GET    /api/v1/employer/analytics     # Hiring analytics
POST   /api/v1/employer/branding      # Build branding page
POST   /api/v1/employer/team          # Add team member
```

**Proposed Database Tables:**
- `employer_profiles` - Employer company profiles
- `employer_teams` - Team members
- `employer_jobs` - Employer-posted jobs
- `candidate_searches` - Saved candidate searches
- `shortlists` - Candidate shortlists
- `interview_schedules` - Scheduled interviews
- `employer_analytics` - Hiring metrics
- `branding_pages` - Custom employer branding pages

---

## Data Architecture

### Database Design

#### PostgreSQL - Primary Database

**Schema Organization:**
- Each service has its own schema (database-per-service pattern)
- Shared reference data in common schema
- Connection pooling with PgBouncer

**Core Tables:**

**Auth Service Schema:**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
  role VARCHAR(50) DEFAULT 'user', -- user, employer, admin
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OAuth connections
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL, -- google, linkedin, github
  provider_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);
```

**User Service Schema:**
```sql
-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  location VARCHAR(255),
  headline VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50), -- beginner, intermediate, advanced, expert
  years_experience DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work experience
CREATE TABLE work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Education
CREATE TABLE educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field VARCHAR(255),
  start_date DATE,
  end_date DATE,
  grade VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Preferences
CREATE TABLE preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  job_types TEXT[], -- full-time, part-time, contract, remote
  locations TEXT[],
  min_salary INTEGER,
  max_salary INTEGER,
  preferred_industries TEXT[],
  job_alert_frequency VARCHAR(50), -- daily, weekly, instant
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active, canceled, expired
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Job Service Schema:**
```sql
-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  location VARCHAR(255),
  job_type VARCHAR(50), -- full-time, part-time, contract, remote
  experience_level VARCHAR(50), -- entry, mid, senior, lead
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'USD',
  benefits TEXT[],
  skills_required TEXT[],
  external_url TEXT,
  source VARCHAR(100), -- indeed, linkedin, direct
  status VARCHAR(50) DEFAULT 'active', -- active, filled, closed
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  posted_by UUID, -- employer user ID
  posted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  size VARCHAR(50), -- 1-10, 11-50, 51-200, 201-500, 501+
  website TEXT,
  logo_url TEXT,
  location VARCHAR(255),
  founded_year INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved jobs
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Job alerts
CREATE TABLE job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  keywords TEXT[],
  location VARCHAR(255),
  job_types TEXT[],
  min_salary INTEGER,
  frequency VARCHAR(50), -- daily, weekly, instant
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Job reports
CREATE TABLE job_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  user_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL, -- spam, duplicate, misleading, other
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Resume Service Schema:**
```sql
-- Resumes
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_id UUID,
  is_default BOOLEAN DEFAULT FALSE,
  file_url TEXT,
  preview_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published
  ats_score DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resume sections
CREATE TABLE resume_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- header, summary, experience, education, skills
  content JSONB NOT NULL,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resume templates
CREATE TABLE resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  category VARCHAR(100),
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resume versions
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Auto-Apply Service Schema:**
```sql
-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,
  resume_id UUID NOT NULL,
  cover_letter_id UUID,
  platform VARCHAR(100), -- linkedin, indeed, direct
  external_application_id TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, viewed, rejected, interview
  applied_at TIMESTAMP DEFAULT NOW(),
  last_status_update TIMESTAMP DEFAULT NOW(),
  auto_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Application history
CREATE TABLE application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auto-apply settings
CREATE TABLE auto_apply_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  resume_id UUID,
  job_types TEXT[],
  locations TEXT[],
  keywords TEXT[],
  min_salary INTEGER,
  max_applications_per_day INTEGER DEFAULT 50,
  platforms TEXT[], -- linkedin, indeed, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Notification Service Schema:**
```sql
-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, push, in_app
  category VARCHAR(50), -- application_update, job_alert, system
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  job_alerts BOOLEAN DEFAULT TRUE,
  application_updates BOOLEAN DEFAULT TRUE,
  marketing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Device tokens
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  device_type VARCHAR(50), -- ios, android, web
  device_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Caching Strategy (Redis)

**Use Cases:**
1. **Session Storage**: User sessions and JWT tokens (TTL: 24h)
2. **API Response Caching**: Frequently accessed data (TTL: 5-15 min)
3. **Rate Limiting**: Request counting per user/IP
4. **Job Listings Cache**: Recent job listings (TTL: 1 hour)
5. **User Profile Cache**: Active user profiles (TTL: 30 min)
6. **Analytics Aggregation**: Real-time metrics
7. **Queue Management**: Bull queues for background jobs

**Cache Keys:**
```
session:{userId}                    # User session
user:profile:{userId}               # User profile
job:listing:{jobId}                 # Job details
jobs:search:{hash}                  # Search results
ratelimit:{ip}:{endpoint}           # Rate limiting
queue:applications:*                # Application queue
cache:ai:embeddings:{hash}          # AI embeddings
```

### Search Engine (Elasticsearch)

**Indexed Data:**
- Job listings (full-text search, faceted filtering)
- Resume content (keyword matching)
- Company information
- Skills taxonomy

**Indices:**
```
jobs                 # Job listings index
resumes              # Resume search index
companies            # Company index
skills               # Skills taxonomy
```

### Message Queue (RabbitMQ)

**Queue Structure:**
1. **applications.queue** - Auto-apply job processing
2. **notifications.email** - Email notifications
3. **notifications.push** - Push notifications
4. **analytics.events** - Event processing
5. **resume.processing** - Resume parsing
6. **jobs.aggregation** - Job scraping
7. **dead-letter** - Failed messages

**Exchanges:**
```
applications.exchange (topic)
notifications.exchange (fanout)
analytics.exchange (topic)
```

### File Storage (Azure Blob Storage)

**Containers:**
- `resumes` - Resume PDF/DOCX files
- `avatars` - User profile photos
- `cover-letters` - Generated cover letters
- `exports` - Exported documents
- `backups` - Database backups
- `uploads` - Miscellaneous user uploads

---

## External Integrations

### 1. AI/ML Providers

**OpenAI (Primary):**
- GPT-4 Turbo: Resume optimization, cover letter generation
- GPT-3.5 Turbo: Job matching, interview questions
- text-embedding-3-large: Semantic search embeddings

**Anthropic Claude (Secondary):**
- Claude 3 Opus: Complex reasoning tasks
- Failover provider for OpenAI

**Pinecone (Vector Database):**
- Store resume and job embeddings
- Semantic similarity search
- Hybrid search (keyword + vector)

### 2. Authentication Providers

**OAuth Providers:**
- **Google OAuth 2.0**: Social login, Gmail integration
- **LinkedIn OAuth 2.0**: Social login, profile import, job postings
- **GitHub OAuth 2.0**: Social login, developer profiles

### 3. Communication Services

**SendGrid (Email):**
- Transactional emails (verification, password reset)
- Marketing emails (job alerts, newsletters)
- Email templates
- Bounce and unsubscribe handling

**Firebase Cloud Messaging (Push):**
- iOS push notifications
- Android push notifications
- Web push notifications

### 4. Payment Processing

**Stripe:**
- Subscription management
- Payment processing
- Invoice generation
- Webhook handling

### 5. Job Board APIs

**LinkedIn Jobs API:**
- Job posting
- Job search
- Profile import

**Indeed API:**
- Job aggregation
- Job search
- Sponsored jobs

**Other Job Boards:**
- Glassdoor API
- ZipRecruiter API
- Monster API
- CareerBuilder API

### 6. Monitoring & Analytics

**Application Insights (Azure):**
- Application performance monitoring
- Distributed tracing
- Error tracking

**Google Analytics:**
- User behavior tracking
- Conversion tracking
- Traffic analysis

---

## Security Architecture

### Authentication Flow

```
┌─────────┐                                                          ┌──────────┐
│  Client │                                                          │   Auth   │
│   App   │                                                          │  Service │
└────┬────┘                                                          └─────┬────┘
     │                                                                     │
     │  1. POST /auth/login                                               │
     │    { email, password }                                             │
     ├────────────────────────────────────────────────────────────────────>│
     │                                                                     │
     │                                            2. Validate credentials  │
     │                                               (bcrypt, PostgreSQL)  │
     │                                                                     │
     │                                            3. Generate JWT tokens   │
     │                                               (access + refresh)    │
     │                                                                     │
     │  4. Return tokens + user data                                      │
     │<────────────────────────────────────────────────────────────────────┤
     │  { accessToken, refreshToken, user }                               │
     │                                                                     │
     │  5. Store tokens (secure storage)                                  │
     │                                                                     │
     │  6. Subsequent requests                                            │
     │  GET /api/v1/jobs                                  ┌──────────┐    │
     │  Authorization: Bearer <accessToken>               │   Job    │    │
     ├────────────────────────────────────────────────────> Service │    │
     │                                                    └────┬─────┘    │
     │                                          7. Validate token         │
     │                                             (JWT verify)            │
     │                                                  │                  │
     │                                                  ├──────────────────>│
     │                                                  │ Verify signature │
     │                                                  │<─────────────────┤
     │                                                  │ Token valid      │
     │  8. Return data                                  │                  │
     │<─────────────────────────────────────────────────┤                  │
     │                                                                     │
     │  9. Access token expired (401)                                     │
     │<─────────────────────────────────────────────────┤                  │
     │                                                                     │
     │  10. POST /auth/refresh                                            │
     │      { refreshToken }                                              │
     ├────────────────────────────────────────────────────────────────────>│
     │                                                                     │
     │                                            11. Validate refresh     │
     │                                                token (Redis)        │
     │                                                                     │
     │  12. Return new access token                                       │
     │<────────────────────────────────────────────────────────────────────┤
     │  { accessToken, expiresIn }                                        │
     │                                                                     │
```

### Security Features

**Authentication & Authorization:**
- JWT-based authentication (access + refresh tokens)
- OAuth 2.0 integration (Google, LinkedIn, GitHub)
- Multi-factor authentication (TOTP)
- Role-based access control (RBAC)
- API key authentication for service-to-service

**Data Security:**
- Encryption at rest (AES-256 for databases, Azure Blob)
- Encryption in transit (TLS 1.3)
- Password hashing (bcrypt, 10 rounds)
- Sensitive data encryption (platform credentials)
- PII data masking in logs

**Network Security:**
- Microservices in private subnet
- API Gateway as single entry point
- Rate limiting (per IP, per user)
- DDoS protection
- CORS policy
- Content Security Policy (CSP)

**Application Security:**
- Input validation (class-validator, Zod)
- SQL injection prevention (parameterized queries, ORM)
- XSS prevention (output encoding, CSP)
- CSRF protection (tokens, SameSite cookies)
- Security headers (HSTS, X-Frame-Options)
- Dependency scanning (Snyk, npm audit)

**Compliance:**
- GDPR compliance (data portability, right to deletion)
- CCPA compliance
- SOC 2 Type II (in progress)
- Regular security audits
- Penetration testing

---

## API Contracts

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2025-12-08T12:00:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "field": "fieldName" // for validation errors
  },
  "statusCode": 400,
  "timestamp": "2025-12-08T12:00:00Z"
}
```

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
  },
  "timestamp": "2025-12-08T12:00:00Z"
}
```

### Common Headers

**Request Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-Request-ID: <uuid>
X-CSRF-Token: <csrf-token>
```

**Response Headers:**
```http
X-Request-ID: <uuid>
X-Process-Time: <ms>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640000000
```

### HTTP Status Codes

- `200 OK` - Successful GET/PATCH request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## Data Flow Diagrams

### Job Application Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Search jobs
     ├──────────────────────────> ┌─────────────┐
     │                             │ Job Service │
     │                             └──────┬──────┘
     │                                    │
     │                                    │ 2. Query Elasticsearch
     │                                    ├──────────────────> ┌────────────────┐
     │                                    │                    │ Elasticsearch  │
     │                                    │<───────────────────┤                │
     │ 3. Return job listings             │                    └────────────────┘
     │<────────────────────────            │
     │                                    │
     │ 4. Select job                      │
     │                                    │
     │ 5. View job details                │
     ├────────────────────────────────────>│
     │                                    │
     │ 6. Click "Apply"                   │
     │                                    │
     │ 7. Select resume                   │
     │                   ┌────────────────┴────────────┐
     │                   │                             │
     │                   ▼                             ▼
     │         ┌──────────────────┐         ┌──────────────────┐
     │         │ Resume Service   │         │   AI Service     │
     │         └─────────┬────────┘         └─────────┬────────┘
     │                   │                            │
     │ 8. Get resume     │                            │
     │<──────────────────┤                            │
     │                   │                            │
     │ 9. Generate cover letter (optional)            │
     ├────────────────────────────────────────────────>│
     │                   │                            │
     │<────────────────────────────────────────────────┤
     │ 10. Cover letter  │                            │
     │                   │                            │
     │ 11. Submit application                         │
     ├───────────────────────────────────> ┌──────────────────┐
     │                                      │ Auto-Apply Svc   │
     │                                      └─────────┬────────┘
     │                                                │
     │                                                │ 12. Create application record
     │                                                │
     │                                                │ 13. Queue application job
     │                                                ├──────────────> ┌───────────┐
     │                                                │                 │ RabbitMQ  │
     │                                                │                 └─────┬─────┘
     │                                                │                       │
     │                                                │ 14. Process job       │
     │                                                │<──────────────────────┤
     │                                                │                       │
     │                                                │ 15. Submit to platform│
     │                                                │ (LinkedIn/Indeed/etc) │
     │                                                │                       │
     │ 16. Confirmation                               │                       │
     │<───────────────────────────────────────────────┤                       │
     │                                                │                       │
     │                                                │ 17. Send notification │
     │                                                ├──────────────> ┌──────────────────┐
     │                                                │                 │ Notification Svc │
     │<───────────────────────────────────────────────┴─────────────────┤                  │
     │ 18. Email/Push notification                                     └──────────────────┘
     │
```

### Resume Optimization Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Upload resume (PDF/DOCX)
     ├──────────────────────────> ┌──────────────────┐
     │                             │ Resume Service   │
     │                             └─────────┬────────┘
     │                                       │
     │                                       │ 2. Store file
     │                                       ├─────────────> ┌────────────────┐
     │                                       │                │ Azure Blob     │
     │                                       │<──────────────┤                │
     │                                       │ 3. File URL    └────────────────┘
     │                                       │
     │                                       │ 4. Parse resume
     │                                       ├─────────────> ┌────────────────┐
     │                                       │                │   AI Service   │
     │                                       │                └────────┬───────┘
     │                                       │                         │
     │                                       │                         │ 5. Extract text
     │                                       │                         │ (pdf-parse)
     │                                       │                         │
     │                                       │                         │ 6. Parse structure
     │                                       │                         │ (OpenAI GPT-4)
     │                                       │                         │
     │                                       │<────────────────────────┤
     │                                       │ 7. Parsed data          │
     │                                       │                         │
     │                                       │ 8. Save to DB           │
     │                                       │                         │
     │ 9. Resume parsed                      │                         │
     │<──────────────────────────────────────┤                         │
     │                                       │                         │
     │ 10. Request optimization              │                         │
     ├───────────────────────────────────────>│                         │
     │                                       │                         │
     │                                       │ 11. Get resume          │
     │                                       │                         │
     │                                       │ 12. Send for optimization
     │                                       ├─────────────────────────>│
     │                                       │                         │
     │                                       │                         │ 13. Generate embeddings
     │                                       │                         │ (OpenAI embeddings)
     │                                       │                         │
     │                                       │                         │ 14. Analyze content
     │                                       │                         │ (GPT-4)
     │                                       │                         │
     │                                       │                         │ 15. Generate suggestions
     │                                       │                         │
     │                                       │<────────────────────────┤
     │                                       │ 16. Optimization tips   │
     │                                       │                         │
     │ 17. Return suggestions                │                         │
     │<──────────────────────────────────────┤                         │
     │  - ATS score                          │                         │
     │  - Keyword suggestions                │                         │
     │  - Formatting tips                    │                         │
     │  - Content improvements               │                         │
     │                                       │                         │
```

---

## Deployment Architecture

### Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster (AKS/EKS/GKE)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    Ingress Controller                       │    │
│  │         (NGINX Ingress / Azure App Gateway / ALB)          │    │
│  │  • SSL Termination (cert-manager / Let's Encrypt)          │    │
│  │  • Path-based Routing                                      │    │
│  │  • Load Balancing                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                            │                                        │
│  ┌─────────────────────────┼────────────────────────────────────┐  │
│  │                    Namespace: production                     │  │
│  │  ┌──────────────────────┼───────────────────────────────┐   │  │
│  │  │              Service Layer                            │   │  │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐     │   │  │
│  │  │  │  Web   │  │ Auth   │  │  User  │  │  Job   │     │   │  │
│  │  │  │  Svc   │  │  Svc   │  │  Svc   │  │  Svc   │     │   │  │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘     │   │  │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐     │   │  │
│  │  │  │ Resume │  │ Auto-  │  │ Notify │  │   AI   │     │   │  │
│  │  │  │  Svc   │  │ Apply  │  │  Svc   │  │  Svc   │     │   │  │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘     │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  │                            │                              │  │
│  │  ┌─────────────────────────┼───────────────────────────┐ │  │
│  │  │              Deployment Layer                        │ │  │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌─────────┐  │ │  │
│  │  │  │ Deployment   │   │ Deployment   │   │   HPA   │  │ │  │
│  │  │  │ (Replicas: 3)│   │ (Replicas: 2)│   │ (Auto)  │  │ │  │
│  │  │  └──────────────┘   └──────────────┘   └─────────┘  │ │  │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌─────────┐  │ │  │
│  │  │  │   Pod 1      │   │   Pod 2      │   │  Pod 3  │  │ │  │
│  │  │  │ [Container]  │   │ [Container]  │   │[Contain]│  │ │  │
│  │  │  └──────────────┘   └──────────────┘   └─────────┘  │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                            │                              │  │
│  │  ┌─────────────────────────┼───────────────────────────┐ │  │
│  │  │              StatefulSet Layer                       │ │  │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌─────────┐  │ │  │
│  │  │  │ PostgreSQL   │   │    Redis     │   │RabbitMQ │  │ │  │
│  │  │  │ StatefulSet  │   │ StatefulSet  │   │Stateful │  │ │  │
│  │  │  │ (Replicas: 3)│   │ (Replicas: 3)│   │Set      │  │ │  │
│  │  │  └──────────────┘   └──────────────┘   └─────────┘  │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                            │                              │  │
│  │  ┌─────────────────────────┼───────────────────────────┐ │  │
│  │  │         Persistent Volumes (Azure Disk / EBS)        │ │  │
│  │  │  ┌─────────┐   ┌─────────┐   ┌─────────┐            │ │  │
│  │  │  │   PVC   │   │   PVC   │   │   PVC   │            │ │  │
│  │  │  └─────────┘   └─────────┘   └─────────┘            │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Monitoring Namespace                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐    │   │
│  │  │ Prometheus  │  │   Grafana   │  │    Jaeger    │    │   │
│  │  └─────────────┘  └─────────────┘  └──────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Cloud Infrastructure (Terraform)

**Azure Resources:**
- Azure Kubernetes Service (AKS)
- Azure Database for PostgreSQL (Flexible Server)
- Azure Cache for Redis
- Azure Blob Storage
- Azure Application Gateway
- Azure Container Registry (ACR)
- Azure Monitor & Application Insights
- Azure Key Vault (secrets management)

**Resource Organization:**
```
Resource Group: jobpilot-prod
├── AKS Cluster (Standard_D4s_v3)
├── PostgreSQL (General Purpose, 4 vCores)
├── Redis Cache (Premium P1)
├── Storage Account (Standard_LRS)
├── Application Gateway (WAF_v2)
├── Container Registry (Premium)
├── Key Vault (Standard)
└── Application Insights
```

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Install dependencies
      - Run linters
      - Run unit tests
      - Run integration tests
      - Generate coverage report

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build Docker images
      - Tag images
      - Push to Azure Container Registry

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    steps:
      - Deploy to staging AKS cluster
      - Run smoke tests
      - Notify team

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - Deploy to production AKS cluster
      - Blue-green deployment
      - Run smoke tests
      - Rollback on failure
      - Notify team
```

---

## Conclusion

This architecture document provides a comprehensive overview of the ApplyPlatform/ApplyForUs system. The platform is built on solid foundations with modern microservices architecture, cloud-native deployment, and enterprise-grade security.

### Key Strengths

1. **Modular Architecture**: Independent, scalable microservices
2. **Cloud-Native**: Containerized with Kubernetes orchestration
3. **AI-Powered**: Integrated AI for resume optimization and job matching
4. **Security-First**: Enterprise-grade security with OAuth, MFA, encryption
5. **Scalable**: Horizontal scaling with auto-scaling capabilities
6. **Observable**: Comprehensive monitoring and logging

### Critical Gaps (See Gap Analysis)

1. **Employer Service** - Missing critical service for employer features
2. **Employer Dashboard** - No interface for companies
3. **Mobile App** - Scaffolded but not implemented
4. **Chrome Extension** - Scaffolded but not implemented
5. **Advanced AI Features** - Many AI features from 50-feature roadmap missing

### Next Steps

1. Implement Employer Service and Dashboard (MVP Priority 1)
2. Complete Mobile App and Chrome Extension (MVP Priority 2)
3. Implement advanced AI features (Phase 2)
4. Enhance analytics and reporting (Phase 3)
5. SOC 2 compliance certification (Security Priority)

---

**Document Version:** 2.0
**Last Updated:** December 8, 2025
**Maintained By:** Platform Architecture Team
