# JOBPILOT AI
## Project Structure Documentation

**Version 2.0.0 | Monorepo Architecture**  
*Comprehensive Directory & File Organization Guide*

---

## 1. Project Overview

JobPilot AI is built using a modern monorepo architecture managed with pnpm workspaces and Turborepo for efficient build orchestration. The project structure separates concerns across deployable applications, shared libraries, backend microservices, and infrastructure configurations.

### 1.1 Architecture Principles

- **Monorepo Design:** Single repository containing all applications, services, and packages
- **Microservices Backend:** Independently deployable services with clear domain boundaries
- **Shared Libraries:** Common code extracted into reusable packages
- **Infrastructure as Code:** Terraform and Kubernetes manifests for reproducible deployments
- **Event-Driven Communication:** Services communicate via message queues for loose coupling

---

## 2. Root Directory Structure

| Directory/File | Description |
|----------------|-------------|
| `apps/` | Deployable client applications (web, mobile, extension) |
| `packages/` | Shared libraries, UI components, types, and utilities |
| `services/` | Backend microservices (AI, Auto-Apply, Auth, etc.) |
| `infrastructure/` | Terraform, Kubernetes, and Docker configurations |
| `docs/` | Documentation, API specs, architecture guides |
| `scripts/` | Utility scripts for setup, deployment, migrations |
| `.github/` | GitHub Actions CI/CD workflows and templates |
| `package.json` | Root workspace configuration |
| `pnpm-workspace.yaml` | pnpm workspace definition |
| `turbo.json` | Turborepo pipeline configuration |

---

## 3. Applications (apps/)

The apps directory contains all deployable client-facing applications.

### 3.1 Web Application (apps/web/)

**Technology:** Next.js 14 with App Router, TypeScript, Tailwind CSS

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and layouts |
| `src/app/(auth)/` | Authentication routes (login, register, forgot-password) |
| `src/app/(dashboard)/` | Protected dashboard routes (resumes, jobs, applications) |
| `src/app/(marketing)/` | Public pages (home, pricing, features, blog) |
| `src/app/api/` | Next.js API routes for BFF pattern |
| `src/components/` | React components (ui/, forms/, dashboard/, resume/) |
| `src/hooks/` | Custom React hooks |
| `src/stores/` | Zustand state stores (auth, ui, resume, settings) |
| `src/lib/` | Utilities, API clients, helpers |
| `src/styles/` | Global CSS and Tailwind configuration |

### 3.2 Mobile Application (apps/mobile/)

**Technology:** React Native with Expo SDK 51, TypeScript

| Path | Purpose |
|------|---------|
| `src/screens/` | Screen components organized by feature |
| `src/screens/auth/` | Login, Register, ForgotPassword screens |
| `src/screens/dashboard/` | Home, Notifications screens |
| `src/screens/jobs/` | JobSearch, JobDetail, SavedJobs screens |
| `src/navigation/` | React Navigation setup with stacks and tabs |
| `src/components/` | Reusable mobile components |
| `src/services/` | API service layer |
| `assets/` | Images, fonts, and static assets |

### 3.3 Browser Extension (apps/extension/)

**Technology:** Manifest V3, React, TypeScript

| Path | Purpose |
|------|---------|
| `src/background/` | Service worker (autofill engine, job scraper, messaging) |
| `src/content/` | Content scripts (form detector, value injector, DOM observer) |
| `src/popup/` | Extension popup UI (React application) |
| `src/options/` | Options/settings page |
| `src/shared/` | Shared utilities across extension components |
| `manifest.json` | Extension manifest (Manifest V3) |

---

## 4. Shared Packages (packages/)

Reusable code shared across applications and services.

| Package | Description |
|---------|-------------|
| `ui/` | Design system with components, tokens, and themes |
| `types/` | Shared TypeScript types (API, models, utilities) |
| `config/` | Shared configurations (ESLint, TypeScript, Tailwind) |
| `utils/` | Common utilities (validation, formatting, crypto) |
| `ai-client/` | AI Service SDK for resume, jobs, and analytics methods |

---

## 5. Backend Services (services/)

Microservices handling specific business domains. Each service is independently deployable.

### 5.1 AI Service (services/ai-service/)

**Technology:** Python FastAPI, OpenAI/Anthropic APIs, ML Models

- `app/api/routes/` — API endpoint handlers
- `app/ml/resume/` — Resume generation models
- `app/ml/matching/` — Job matching algorithms
- `app/ml/scoring/` — ATS scoring logic
- `app/services/` — OpenAI, Anthropic, embeddings integrations

### 5.2 Auto-Apply Service (services/auto-apply-service/)

**Technology:** Python, Playwright/Selenium, RabbitMQ

- `app/engine/browser.py` — Headless browser management
- `app/engine/form_filler.py` — Form completion logic
- `app/engine/captcha.py` — CAPTCHA handling integration
- `app/adapters/` — ATS-specific adapters (Workday, Greenhouse, Lever, etc.)
- `app/queue/` — Job queue processing

### 5.3 Other Services

| Service | Technology | Responsibilities |
|---------|------------|------------------|
| `auth-service/` | Node.js/NestJS | Authentication, OAuth, MFA, sessions |
| `resume-service/` | Node.js/NestJS | Resume CRUD, templates, versioning, export |
| `job-service/` | Node.js/NestJS | Job aggregation, deduplication, search |
| `analytics-service/` | Python FastAPI | Metrics, reports, A/B analysis, predictions |
| `notification-service/` | Node.js/NestJS | Email, SMS, push, in-app notifications |

---

## 6. Infrastructure (infrastructure/)

### 6.1 Terraform (infrastructure/terraform/)

- `modules/` — Reusable Terraform modules (VPC, EKS, RDS, ElastiCache, S3)
- `environments/dev/` — Development environment configuration
- `environments/staging/` — Staging environment configuration
- `environments/prod/` — Production environment configuration

### 6.2 Kubernetes (infrastructure/kubernetes/)

- `base/` — Base Kubernetes manifests
- `overlays/` — Kustomize overlays for dev, staging, production
- `helm/jobpilot/` — Helm chart for full platform deployment

### 6.3 Docker (infrastructure/docker/)

- `docker-compose.yml` — Local development stack
- `docker-compose.prod.yml` — Production compose configuration
- `dockerfiles/` — Service-specific Dockerfiles

---

## 7. CI/CD Workflows (.github/)

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Continuous integration (lint, type-check, test) |
| `cd.yml` | Continuous deployment to staging/production |
| `release.yml` | Semantic versioning and release creation |
| `security.yml` | Security scanning and dependency audits |

---

## 8. Utility Scripts (scripts/)

- `setup.sh` — Initial project setup and dependency installation
- `deploy.sh` — Deployment automation script
- `migrate.sh` — Database migration runner
- `seed.sh` — Database seeding for development/testing

---

## 9. Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace scripts and dependencies |
| `pnpm-workspace.yaml` | Workspace package locations |
| `turbo.json` | Turborepo build pipeline configuration |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore rules |
| `README.md` | Project documentation and quick start |
| `LICENSE` | MIT License file |

---

## 10. Complete Directory Tree

```
jobpilot-ai/
├── apps/
│   ├── web/                          # Next.js 14 Web Application
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages & layouts
│   │   │   │   ├── (auth)/           # Auth routes group
│   │   │   │   ├── (dashboard)/      # Protected dashboard routes
│   │   │   │   ├── (marketing)/      # Public marketing pages
│   │   │   │   └── api/              # API routes
│   │   │   ├── components/           # React components
│   │   │   │   ├── ui/               # Base UI components
│   │   │   │   ├── forms/            # Form components
│   │   │   │   ├── dashboard/        # Dashboard widgets
│   │   │   │   └── resume/           # Resume builder components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── stores/               # Zustand state stores
│   │   │   ├── lib/                  # Utilities & helpers
│   │   │   └── styles/               # Global styles
│   │   ├── public/                   # Static assets
│   │   └── tests/                    # Web app tests
│   │
│   ├── mobile/                       # React Native Mobile App
│   │   ├── src/
│   │   │   ├── screens/              # Screen components
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── jobs/
│   │   │   │   ├── applications/
│   │   │   │   └── settings/
│   │   │   ├── components/           # Reusable components
│   │   │   ├── navigation/           # React Navigation setup
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── stores/               # State management
│   │   │   ├── services/             # API services
│   │   │   └── utils/                # Utilities
│   │   ├── assets/                   # Images, fonts
│   │   └── app.json                  # Expo configuration
│   │
│   └── extension/                    # Browser Extension
│       ├── src/
│       │   ├── background/           # Service worker
│       │   ├── content/              # Content scripts
│       │   ├── popup/                # Extension popup UI
│       │   ├── options/              # Options page
│       │   └── shared/               # Shared utilities
│       ├── manifest.json             # Extension manifest v3
│       └── tests/                    # Extension tests
│
├── packages/
│   ├── ui/                           # Design System
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── tokens/
│   │   │   └── themes/
│   │   └── package.json
│   │
│   ├── types/                        # Shared TypeScript Types
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── config/                       # Shared Configurations
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   │
│   ├── utils/                        # Shared Utilities
│   │   ├── src/
│   │   │   ├── validation/
│   │   │   ├── formatting/
│   │   │   └── crypto/
│   │   └── package.json
│   │
│   └── ai-client/                    # AI Service SDK
│       ├── src/
│       │   ├── client.ts
│       │   ├── resume.ts
│       │   ├── jobs.ts
│       │   └── analytics.ts
│       └── package.json
│
├── services/
│   ├── ai-service/                   # Python FastAPI - AI/ML
│   │   ├── app/
│   │   │   ├── api/routes/
│   │   │   ├── core/
│   │   │   ├── ml/
│   │   │   │   ├── resume/
│   │   │   │   ├── matching/
│   │   │   │   ├── scoring/
│   │   │   │   └── analytics/
│   │   │   ├── services/
│   │   │   └── models/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── auto-apply-service/           # Browser Automation
│   │   ├── app/
│   │   │   ├── engine/
│   │   │   ├── adapters/
│   │   │   └── queue/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── auth-service/                 # Authentication
│   ├── resume-service/               # Resume Management
│   ├── job-service/                  # Job Aggregation
│   ├── analytics-service/            # Analytics & Reporting
│   └── notification-service/         # Notifications
│
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   ├── rds/
│   │   │   ├── elasticache/
│   │   │   └── s3/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── main.tf
│   │
│   ├── kubernetes/
│   │   ├── base/
│   │   ├── overlays/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── helm/
│   │       └── jobpilot/
│   │
│   └── docker/
│       ├── docker-compose.yml
│       ├── docker-compose.prod.yml
│       └── dockerfiles/
│
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── guides/
│   └── contributing/
│
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   ├── migrate.sh
│   └── seed.sh
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   ├── release.yml
│   │   └── security.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## Document Information

| Property | Value |
|----------|-------|
| Version | 2.0.0 |
| Last Updated | 2025 |
| Maintainer | JobPilot AI Engineering Team |

---

*JobPilot AI — Project Structure Documentation v2.0.0*
