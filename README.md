# ApplyForUs - AI-Powered Job Application Platform

<div align="center">

![ApplyForUs Logo](https://applyforus.com/logo.png)

**Revolutionizing Job Search with AI-Powered Automation**

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/oks-citadel/Apply)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/oks-citadel/Apply/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Azure](https://img.shields.io/badge/Azure-AKS-0078D4.svg)](https://azure.microsoft.com/)

[Website](https://applyforus.com) | [Documentation](https://docs.applyforus.com) | [API Reference](https://api.applyforus.com/docs)

</div>

---

## Overview

**ApplyForUs** is a comprehensive AI-powered SaaS platform that revolutionizes the job search process. Built with enterprise-grade microservices architecture, it automates and optimizes job applications using cutting-edge AI technology, helping job seekers land their dream jobs faster.

### Key Highlights

- **500+ Job Sources** - Aggregates jobs from LinkedIn, Indeed, Glassdoor, and 500+ other platforms
- **AI-Powered Matching** - ML algorithms match you with relevant opportunities
- **Auto-Apply Technology** - Automated application submission to multiple platforms
- **Multi-Platform Support** - Web, Mobile (iOS/Android), Chrome Extension
- **Global Payment Support** - Stripe, Flutterwave, Paystack integration
- **GDPR Compliant** - Full data privacy and consent management

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Subscription Plans](#subscription-plans)
- [Virtual Coins System](#virtual-coins-system)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Security & Compliance](#security--compliance)
- [Monitoring & Observability](#monitoring--observability)
- [Contributing](#contributing)
- [Changelog](#changelog)

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **AI Resume Builder** | Create ATS-optimized resumes with AI assistance and 50+ templates |
| **Smart Job Matching** | ML-powered job recommendations based on skills and preferences |
| **Auto-Apply Engine** | Automated applications to LinkedIn, Indeed, Glassdoor, and more |
| **Job Aggregation** | Real-time aggregation from 500+ global job boards |
| **Analytics Dashboard** | Track applications, success rates, and performance insights |
| **Interview Preparation** | AI-generated questions based on job descriptions |
| **Salary Prediction** | ML-powered salary estimates by role, location, and experience |
| **Cover Letter AI** | Generate personalized cover letters for each application |
| **Real-Time Notifications** | Email, push, SMS, and in-app notifications |
| **Multi-Language Support** | Available in 12+ languages |

### Platform Support

| Platform | Status | Description |
|----------|--------|-------------|
| **Web App** | Production | Next.js 14 with App Router |
| **Admin Dashboard** | Production | Internal management portal |
| **Employer Portal** | Beta | Job posting and candidate management |
| **Mobile App** | Development | React Native (iOS/Android) |
| **Chrome Extension** | Development | Quick-apply browser extension |

### Payment Providers

| Provider | Markets | Currencies |
|----------|---------|------------|
| **Stripe** | Global | USD, EUR, GBP, CAD, AUD |
| **Flutterwave** | Africa | NGN, GHS, KES, ZAR, UGX, TZS |
| **Paystack** | Africa | NGN, GHS, ZAR, USD |

---

## Architecture

```
                                    ┌──────────────────────┐
                                    │   Azure Front Door   │
                                    │   (CDN + WAF + SSL)  │
                                    └──────────┬───────────┘
                                               │
                            ┌──────────────────┴──────────────────┐
                            │                                      │
                   ┌────────▼────────┐                  ┌─────────▼─────────┐
                   │    Web App      │                  │   API Gateway     │
                   │   (Next.js 14)  │                  │    (NestJS)       │
                   │   Port: 3000    │                  │   Port: 3500      │
                   └─────────────────┘                  └────────┬──────────┘
                                                                 │
    ┌────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┐
    │                                                            │                                                            │
    ▼                    ▼                    ▼                  ▼                    ▼                    ▼                  ▼
┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐
│  Auth  │          │  User  │          │  Job   │          │ Resume │          │   AI   │          │Payment │          │Orchestr│
│Service │          │Service │          │Service │          │Service │          │Service │          │Service │          │ ator   │
│ :8001  │          │ :8002  │          │ :8003  │          │ :8004  │          │ :8008  │          │ :8009  │          │ :8010  │
└────┬───┘          └────┬───┘          └────┬───┘          └────┬───┘          └────┬───┘          └────┬───┘          └────┬───┘
     │                   │                   │                   │                   │                   │                   │
     └───────────────────┴───────────────────┴───────────────────┴───────────────────┴───────────────────┴───────────────────┘
                                                                 │
                                             ┌───────────────────┼───────────────────┐
                                             │                   │                   │
                                     ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
                                     │  PostgreSQL   │   │    Redis      │   │   RabbitMQ    │
                                     │   (Primary)   │   │   (Cache)     │   │   (Queue)     │
                                     └───────────────┘   └───────────────┘   └───────────────┘
```

### Project Structure

```
ApplyForUs/
├── apps/                          # Frontend Applications
│   ├── web/                       # Main web app (Next.js 14)
│   ├── admin/                     # Admin dashboard
│   ├── employer/                  # Employer portal
│   ├── mobile/                    # React Native app
│   └── extension/                 # Chrome extension
│
├── services/                      # Backend Microservices
│   ├── auth-service/              # Authentication, OAuth, GDPR
│   ├── user-service/              # User profiles, preferences
│   ├── job-service/               # Job aggregation, search, alerts
│   ├── resume-service/            # Resume parsing, generation
│   ├── ai-service/                # ML models (Python FastAPI)
│   ├── notification-service/      # Multi-channel notifications
│   ├── auto-apply-service/        # Browser automation
│   ├── analytics-service/         # Metrics, reporting
│   ├── payment-service/           # Subscriptions, coins, webhooks
│   ├── orchestrator-service/      # Service coordination
│   └── api-gateway/               # Routing, rate limiting
│
├── packages/                      # Shared Libraries
│   ├── types/                     # TypeScript interfaces
│   ├── utils/                     # Common utilities
│   ├── logging/                   # Centralized logging
│   ├── telemetry/                 # Distributed tracing
│   ├── security/                  # RBAC, encryption
│   ├── config/                    # Environment management
│   ├── i18n/                      # Internationalization
│   ├── feature-flags/             # Feature toggles
│   └── ui/                        # Shared UI components
│
├── infrastructure/                # Infrastructure as Code
│   ├── terraform/                 # Azure infrastructure
│   │   ├── modules/               # Reusable modules
│   │   ├── environments/          # Dev, staging, prod
│   │   └── backend/               # State management
│   └── kubernetes/                # K8s manifests
│       ├── base/                  # Base configurations
│       ├── development/           # Dev overlays
│       ├── staging/               # Staging overlays
│       └── production/            # Production configs
│
├── .github/                       # GitHub Actions
│   └── workflows/
│       ├── ci.yml                 # Continuous Integration
│       ├── ci-cd.yml              # Full CI/CD pipeline
│       ├── docker-build.yml       # Container builds
│       ├── terraform.yml          # Infrastructure
│       └── rollback.yml           # Emergency rollback
│
├── ops/                           # Operations
│   └── docs/                      # Runbooks, architecture docs
│
└── tests/                         # Test Suites
    ├── integration/               # Integration tests
    ├── e2e/                       # End-to-end tests
    └── load/                      # Performance tests
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2+ | React framework with App Router |
| React | 18.3+ | UI library |
| TypeScript | 5.7+ | Type safety |
| TailwindCSS | 3.4+ | Utility-first CSS |
| Radix UI | Latest | Accessible components |
| Zustand | 4.5+ | State management |
| React Query | 5+ | Server state |
| React Hook Form | 7+ | Form handling |
| Zod | 3+ | Schema validation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.4+ | Microservices framework |
| FastAPI | 0.110+ | AI/ML service (Python) |
| TypeORM | 0.3+ | ORM for PostgreSQL |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching, sessions, pub/sub |
| RabbitMQ | 3.13+ | Message queue |
| Bull | 5+ | Job processing |
| Passport | 0.7+ | Authentication strategies |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Kubernetes | Container orchestration |
| Azure AKS | Managed Kubernetes |
| Azure ACR | Container registry |
| Azure Front Door | CDN, WAF, SSL |
| Azure PostgreSQL | Managed database |
| Azure Key Vault | Secrets management |
| Terraform | Infrastructure as Code |
| GitHub Actions | CI/CD pipelines |

### Observability

| Technology | Purpose |
|------------|---------|
| OpenTelemetry | Distributed tracing |
| Prometheus | Metrics collection |
| Grafana | Visualization |
| Winston | Structured logging |
| Azure Monitor | Cloud monitoring |

---

## Subscription Plans

### Pricing Tiers (2025)

| Tier | Monthly | Yearly (17% off) | Best For |
|------|---------|------------------|----------|
| **Freemium** | $0 | $0 | Try before you buy |
| **Starter** | $23.99 | $239.99 | Active job seekers |
| **Basic** | $49.99 | $499.99 | Serious applicants |
| **Professional** | $89.99 | $899.99 | Career changers |
| **Advanced Career** | $149.99 | $1,499.99 | Executives |
| **Executive Elite** | $299.99 | $2,999.99 | C-Suite & VIPs |

### Feature Comparison

| Feature | Freemium | Starter | Basic | Pro | Advanced | Elite |
|---------|----------|---------|-------|-----|----------|-------|
| Job Applications/mo | 5 | 30 | 75 | 200 | 500 | Unlimited |
| AI Cover Letters | 2 | 15 | 40 | 100 | 300 | Unlimited |
| Resume Templates | 2 | 5 | 10 | Unlimited | Unlimited | Unlimited |
| Saved Jobs | 10 | 50 | 150 | 500 | Unlimited | Unlimited |
| Virtual Coins/mo | 25 | 300 | 750 | 2,000 | 5,000 | Unlimited |
| Boost Visibility Slots | 0 | 2 | 5 | 15 | 30 | Unlimited |
| Auto-Apply | - | - | Yes | Yes | Yes | Yes |
| Salary Insights | - | - | Yes | Yes | Yes | Yes |
| Interview Prep | - | - | - | Yes | Yes | Yes |
| Company Insights | - | - | - | Yes | Yes | Yes |
| Advanced Analytics | - | - | - | Yes | Yes | Yes |
| Custom Branding | - | - | - | - | Yes | Yes |
| API Access | - | - | - | - | Yes | Yes |
| Priority Support | - | - | - | Yes | Yes | Yes |
| Dedicated Manager | - | - | - | - | - | Yes |

---

## Virtual Coins System

ApplyForUs features a virtual coins economy for premium features:

### Earning Coins

- **Subscription Allocation**: Monthly coins based on your tier
- **Bonus Coins**: Extra coins from package purchases
- **Referrals**: Earn coins when friends subscribe
- **Achievements**: Complete milestones for coin rewards

### Spending Coins

| Action | Cost | Description |
|--------|------|-------------|
| Basic Visibility Boost | 50 coins | 24-hour profile boost |
| Premium Visibility Boost | 150 coins | 72-hour profile boost |
| Featured Placement | 300 coins | 7-day featured status |
| Priority Application | 25 coins | Move to top of queue |
| Extra AI Cover Letter | 10 coins | Generate additional letter |

### Coin Packages

| Package | Coins | Price | Bonus |
|---------|-------|-------|-------|
| Starter | 100 | $0.99 | 0 |
| Popular | 500 | $4.49 | +50 |
| Value | 1,000 | $7.99 | +150 |
| Pro | 2,500 | $17.99 | +500 |
| Power | 5,000 | $32.99 | +1,250 |
| Ultimate | 10,000 | $59.99 | +3,000 |

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 9.x or higher
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Azure CLI (for deployment)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/oks-citadel/Apply.git
cd Apply

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services
docker compose up -d postgres redis rabbitmq

# Build shared packages
pnpm build:packages

# Run database migrations
pnpm db:migrate

# Start all services in development
pnpm dev
```

### Development Ports

| Service | Port | URL |
|---------|------|-----|
| Web App | 3000 | http://localhost:3000 |
| Admin Dashboard | 3001 | http://localhost:3001 |
| Employer Portal | 3002 | http://localhost:3002 |
| API Gateway | 3500 | http://localhost:3500 |
| Auth Service | 8001 | http://localhost:8001 |
| User Service | 8002 | http://localhost:8002 |
| Job Service | 8003 | http://localhost:8003 |
| Resume Service | 8004 | http://localhost:8004 |
| Notification Service | 8005 | http://localhost:8005 |
| Auto-Apply Service | 8006 | http://localhost:8006 |
| Analytics Service | 8007 | http://localhost:8007 |
| AI Service | 8008 | http://localhost:8008 |
| Payment Service | 8009 | http://localhost:8009 |
| Orchestrator Service | 8010 | http://localhost:8010 |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| RabbitMQ | 5672 | - |
| RabbitMQ UI | 15672 | http://localhost:15672 |

---

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all services
pnpm dev:web                # Start web app only
pnpm dev:services           # Start backend services

# Building
pnpm build                  # Build all packages and apps
pnpm build:packages         # Build shared packages
pnpm build:services         # Build all microservices

# Testing
pnpm test                   # Run all tests
pnpm test:unit              # Run unit tests
pnpm test:integration       # Run integration tests
pnpm test:e2e               # Run E2E tests
pnpm test:coverage          # Generate coverage report

# Code Quality
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix linting issues
pnpm format                 # Format with Prettier
pnpm type-check             # Run TypeScript checks

# Database
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed database
pnpm db:reset               # Reset database
```

### Environment Variables

```env
# Application
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:3500

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applyforus
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=applyforus

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# AI/ML
OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=

# Azure (Production)
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_SUBSCRIPTION_ID=
```

---

## Deployment

### Production Environment

**Live URL**: https://applyforus.com

**Infrastructure**:
- **Region**: Azure West US 2
- **Kubernetes**: Azure AKS (3-node cluster)
- **Container Registry**: applyforusacr.azurecr.io
- **Database**: Azure PostgreSQL Flexible Server
- **DNS**: Azure DNS Zone

### Docker Images

All production images are hosted in Azure Container Registry:

```
applyforusacr.azurecr.io/applyai-web:v2.1.0
applyforusacr.azurecr.io/applyai-auth-service:v2.0.1
applyforusacr.azurecr.io/applyai-user-service:v2.0.1
applyforusacr.azurecr.io/applyai-job-service:v2.0.0
applyforusacr.azurecr.io/applyai-resume-service:v2.0.0
applyforusacr.azurecr.io/applyai-notification-service:v2.0.0
applyforusacr.azurecr.io/applyai-auto-apply-service:v2.0.0
applyforusacr.azurecr.io/applyai-analytics-service:v2.0.0
applyforusacr.azurecr.io/applyai-ai-service:latest
applyforusacr.azurecr.io/applyai-orchestrator-service:v2.0.1
applyforusacr.azurecr.io/applyai-payment-service:v2.0.0
```

### Deployment Commands

```bash
# Azure Login
az login
az account set --subscription "Your-Subscription-ID"

# Get AKS Credentials
az aks get-credentials --resource-group applyforus-prod-rg --name applyforus-aks

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/production/

# Check Deployment Status
kubectl get pods -n applyforus
kubectl get services -n applyforus

# View Logs
kubectl logs -f deployment/web-app -n applyforus
```

### CI/CD Pipelines

| Pipeline | Trigger | Description |
|----------|---------|-------------|
| CI | Push to any branch | Lint, test, type-check |
| Docker Build | Push to main/develop | Build and push images |
| Deploy Dev | Push to develop | Auto-deploy to development |
| Deploy Prod | Tag release | Deploy to production |
| Terraform | Manual/PR | Infrastructure changes |
| Rollback | Manual | Emergency rollback |

---

## API Documentation

### Base URLs

| Environment | URL |
|-------------|-----|
| Development | http://localhost:3500/api |
| Production | https://api.applyforus.com |
| Documentation | https://api.applyforus.com/docs |

### Authentication

All API requests require authentication via JWT:

```http
Authorization: Bearer <access_token>
```

### Rate Limits

| Tier | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 30 | 1,000 |
| Starter | 60 | 5,000 |
| Basic | 120 | 15,000 |
| Pro+ | 300 | 50,000 |
| API Access | 1,000 | Unlimited |

### Core Endpoints

```http
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

# Users
GET    /api/users/profile
PATCH  /api/users/profile
GET    /api/users/preferences
PATCH  /api/users/preferences

# Jobs
GET    /api/jobs
GET    /api/jobs/:id
POST   /api/jobs/search
GET    /api/jobs/recommendations
POST   /api/jobs/:id/apply
GET    /api/jobs/saved
POST   /api/jobs/:id/save

# Resumes
GET    /api/resumes
POST   /api/resumes
GET    /api/resumes/:id
PATCH  /api/resumes/:id
DELETE /api/resumes/:id
POST   /api/resumes/:id/parse
POST   /api/resumes/:id/optimize

# Applications
GET    /api/applications
GET    /api/applications/:id
POST   /api/applications
PATCH  /api/applications/:id/status

# Subscriptions
GET    /api/subscriptions/plans
GET    /api/subscriptions/current
POST   /api/subscriptions/checkout
POST   /api/subscriptions/cancel
```

---

## Security & Compliance

### Authentication Methods

- **JWT Tokens**: Access and refresh tokens
- **OAuth 2.0**: Google, GitHub, LinkedIn
- **Multi-Factor Auth**: TOTP-based 2FA
- **Session Management**: Redis-backed sessions

### Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with salt rounds |
| Token Encryption | AES-256-GCM |
| API Rate Limiting | Express rate limiter |
| Input Validation | Zod schemas |
| XSS Protection | DOMPurify, CSP headers |
| CSRF Protection | Double-submit cookies |
| SQL Injection | Parameterized queries |
| Audit Logging | Comprehensive activity logs |

### GDPR Compliance

The platform includes a comprehensive GDPR module:

- **Consent Management**: Granular consent tracking
- **Data Export**: Export all user data (JSON/CSV)
- **Right to Erasure**: Complete data deletion
- **Data Portability**: Machine-readable exports
- **Breach Notification**: Automated breach alerts
- **DPO Support**: Data Protection Officer tools

### SOC 2 Controls

- Access control policies
- Encryption at rest and in transit
- Audit logging and monitoring
- Incident response procedures
- Business continuity planning

---

## Monitoring & Observability

### Health Endpoints

Each service exposes health checks:

```http
GET /health          # Overall health
GET /health/live     # Liveness probe
GET /health/ready    # Readiness probe
```

### Metrics

Prometheus metrics available at `/metrics`:

- HTTP request latency
- Request count by status
- Active connections
- Memory usage
- CPU usage
- Custom business metrics

### Tracing

OpenTelemetry distributed tracing:

- Request correlation across services
- Performance bottleneck identification
- Error tracking and debugging

### Alerting

Configured alerts for:

- Service downtime
- High error rates (>1%)
- Latency spikes (p99 > 2s)
- Resource exhaustion
- Failed deployments

---

## Changelog

### v2.1.0 (December 2025)

**New Features**
- GDPR compliance module with consent management
- Virtual coins system for premium features
- Visibility boost feature for profiles
- Executive Elite subscription tier
- Multi-language support (12 languages)

**Improvements**
- Upgraded to Next.js 14.2 with App Router
- Enhanced AI cover letter generation
- Improved job matching algorithm
- Better mobile responsiveness

**Infrastructure**
- Migrated to Azure AKS production cluster
- Implemented Azure Front Door CDN
- Added distributed tracing with OpenTelemetry
- Enhanced CI/CD with GitHub Actions

### v2.0.0 (November 2025)

**Major Release**
- Complete architecture redesign
- Microservices implementation
- New subscription tiers
- Payment provider integrations (Stripe, Flutterwave, Paystack)
- Real-time notifications

### v1.0.0 (August 2025)

**Initial Release**
- Core job search functionality
- Basic resume builder
- User authentication
- Job applications tracking

---

## Scope of Work Completed

### Phase 1: Foundation (Completed)
- [x] Monorepo setup with pnpm workspaces
- [x] Shared packages (types, utils, logging, security)
- [x] Authentication service with OAuth
- [x] User management service
- [x] Basic web application

### Phase 2: Core Features (Completed)
- [x] Job aggregation service
- [x] Resume parsing and generation
- [x] AI-powered job matching
- [x] Application tracking
- [x] Analytics dashboard

### Phase 3: Monetization (Completed)
- [x] Subscription management
- [x] Payment integration (Stripe, Flutterwave, Paystack)
- [x] Virtual coins system
- [x] Usage limits and quotas

### Phase 4: Advanced Features (Completed)
- [x] Auto-apply automation
- [x] Interview preparation AI
- [x] Salary prediction ML
- [x] Real-time notifications
- [x] GDPR compliance

### Phase 5: Production (In Progress)
- [x] Azure AKS deployment
- [x] Container registry setup
- [x] CI/CD pipelines
- [ ] DNS and SSL configuration
- [ ] Load testing
- [ ] Security audit

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style (formatting, etc.)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks
```

---

## Support

- **Documentation**: https://docs.applyforus.com
- **Email**: support@applyforus.com
- **Discord**: https://discord.gg/applyforus
- **Issues**: https://github.com/oks-citadel/Apply/issues

---

## License

Copyright 2025 ApplyForUs. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.

---

<div align="center">

**Built with passion by the ApplyForUs Team**

[Website](https://applyforus.com) | [Twitter](https://twitter.com/applyforus) | [LinkedIn](https://linkedin.com/company/applyforus)

</div>
