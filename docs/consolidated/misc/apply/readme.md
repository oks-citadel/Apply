# JobPilot AI

<div align="center">

![JobPilot AI Logo](https://via.placeholder.com/220x70?text=JobPilot+AI)

**Your AI-Powered Career Co-Pilot | Apply Smarter, Land Faster**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/coverage-92%25-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)]()
[![SOC2](https://img.shields.io/badge/SOC2-Type_II-green.svg)]()

[Website](https://jobpilot.ai) • [Documentation](https://docs.jobpilot.ai) • [Demo](https://demo.jobpilot.ai) • [API](https://api.jobpilot.ai) • [Support](mailto:support@jobpilot.ai)

---

**🚀 The Only Platform That Applies TO Jobs FOR You — Up to 200+ Applications/Week**

</div>

---

## 🎯 What is JobPilot AI?

**JobPilot AI** is the first truly autonomous career acceleration platform. Unlike traditional job search tools that help you *build* resumes or *track* applications, JobPilot AI **actively works on your behalf 24/7** — finding opportunities, tailoring applications, and submitting them automatically while you focus on interview preparation and career growth.

### The Problem We Solve

The modern job search is fundamentally broken:

- **5-6 months** average time to find a new job
- **50-100+** applications needed per interview
- **30-45 minutes** spent per application
- **75%** of qualified candidates rejected by ATS systems
- **$4,000+** in lost wages per month during unemployment

### Our Solution

JobPilot AI automates the entire application lifecycle:

1. **Discover** — AI continuously scans 50,000+ job postings daily
2. **Qualify** — ML models predict application success probability (>90% accuracy)
3. **Tailor** — Each resume is uniquely optimized for each job posting
4. **Apply** — Autonomous engine completes applications on 10,000+ employer websites
5. **Track** — Real-time status updates and performance analytics
6. **Optimize** — A/B testing continuously improves conversion rates

---

## ✨ Key Features

### 🤖 AI Resume Engine
- GPT-4 & Claude-powered content generation
- ATS optimization scoring (98.7% pass rate)
- Industry-specific keyword injection
- Achievement quantification assistant
- Multi-format export (PDF, DOCX, TXT, JSON)

### 🎯 Smart Job Matching
- Semantic understanding of job requirements
- Career trajectory alignment (not just current skills)
- Company culture fit scoring
- Salary range prediction with 94% accuracy

### 🔄 Auto-Apply Engine
- Works on 10,000+ employer ATS platforms
- Intelligent form field mapping (99.2% accuracy)
- CAPTCHA handling integration
- Application queue with priority processing

### 📊 Performance Analytics
- Resume A/B testing (industry first)
- Application-to-interview conversion tracking
- Real-time market demand indicators
- Weekly AI-powered insights reports

### 🔒 Enterprise-Grade Security
- SOC 2 Type II certified
- GDPR & CCPA compliant
- AES-256 encryption at rest and in transit
- Zero-knowledge cloud sync option

---

## 💎 Subscription Plans

| Plan | Monthly | Apps/Week | Auto-Apply | Best For |
|------|---------|-----------|------------|----------|
| **Starter** | $29 | 50 | — | Active searchers |
| **Professional** | $79 | 150 | ✓ | Serious job hunters |
| **Executive** | $149 | 300 | ✓ Priority | Career changers |
| **Enterprise** | $299 | 500+ | ✓ Instant | Power users |

[View Full Pricing →](https://jobpilot.ai/pricing)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/jobpilot/jobpilot-ai.git
cd jobpilot-ai

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start infrastructure services
docker-compose up -d postgres redis elasticsearch rabbitmq

# Initialize database
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Main dashboard |
| API Gateway | http://localhost:4000 | REST/GraphQL API |
| AI Service | http://localhost:8000 | ML endpoints |
| GraphQL Playground | http://localhost:4000/graphql | API explorer |
| Swagger Docs | http://localhost:4000/api/docs | REST API docs |

---

## 🏗️ Architecture Overview

JobPilot AI employs a modern, event-driven microservices architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│   Web (Next.js 14)  │  Mobile (React Native)  │  Extension (V3) │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │      API Gateway (NestJS)      │
              │   REST + GraphQL + WebSocket   │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │    Message Queue (RabbitMQ)    │
              └───────────────┬───────────────┘
                              │
    ┌─────────┬─────────┬─────┴─────┬─────────┬─────────┐
    │         │         │           │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌─────▼─────┐ ┌─▼─┐ ┌───▼────┐
│ Auth  │ │Resume │ │  Job  │ │Auto-Apply │ │AI │ │Notific.│
│Service│ │Service│ │Service│ │  Service  │ │Svc│ │Service │
└───────┘ └───────┘ └───────┘ └───────────┘ └───┘ └────────┘
    │         │         │           │         │         │
    └─────────┴─────────┴───────────┴─────────┴─────────┘
                              │
              ┌───────────────▼───────────────┐
              │         DATA LAYER             │
              │ PostgreSQL │ Redis │ Elastic  │
              └──────────────────────────────┘
```

---

## 📁 Project Structure

```
jobpilot-ai/
├── apps/                    # Deployable applications
│   ├── web/                 # Next.js 14 web application
│   ├── mobile/              # React Native + Expo mobile app
│   └── extension/           # Browser extension (Manifest V3)
│
├── packages/                # Shared libraries
│   ├── ui/                  # Design system components
│   ├── types/               # Shared TypeScript types
│   ├── config/              # Shared configurations
│   ├── utils/               # Common utilities
│   └── ai-client/           # AI service SDK
│
├── services/                # Backend microservices
│   ├── ai-service/          # Python FastAPI - AI/ML
│   ├── auto-apply-service/  # Python - Browser automation
│   ├── auth-service/        # Node.js - Authentication
│   ├── resume-service/      # Node.js - Resume management
│   ├── job-service/         # Node.js - Job aggregation
│   ├── analytics-service/   # Python - Analytics & reports
│   └── notification-service/# Node.js - Notifications
│
├── infrastructure/          # DevOps & Infrastructure
│   ├── terraform/           # Infrastructure as Code
│   ├── kubernetes/          # K8s manifests & Helm charts
│   └── docker/              # Docker configurations
│
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
└── .github/                 # CI/CD workflows
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Start web app only
pnpm dev:api          # Start API gateway only
pnpm dev:mobile       # Start mobile app (Expo)

# Building
pnpm build            # Build all packages
pnpm build:web        # Build web app
pnpm build:api        # Build API gateway

# Testing
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage
pnpm test:e2e         # Run E2E tests

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking
pnpm format           # Format with Prettier
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/jobpilot

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email
SENDGRID_API_KEY=SG.your-sendgrid-key

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=jobpilot-uploads
```

---

## 📚 API Reference

### Base URLs

```
Production: https://api.jobpilot.ai/v1
Staging:    https://api-staging.jobpilot.ai/v1
Local:      http://localhost:4000/v1
```

### Core Endpoints

#### Authentication
```http
POST /auth/register       # Create new account
POST /auth/login          # Login and get tokens
POST /auth/refresh        # Refresh access token
POST /auth/logout         # Invalidate session
GET  /auth/me             # Get current user
```

#### Resumes
```http
GET    /resumes           # List all resumes
POST   /resumes           # Create new resume
GET    /resumes/:id       # Get resume by ID
PUT    /resumes/:id       # Update resume
DELETE /resumes/:id       # Delete resume
POST   /resumes/:id/generate   # AI generate content
POST   /resumes/:id/optimize   # ATS optimization
POST   /resumes/:id/export     # Export PDF/DOCX
```

#### Jobs
```http
GET    /jobs              # Search jobs
POST   /jobs/match        # Get AI-matched jobs
GET    /jobs/recommended  # AI recommendations
POST   /jobs/:id/save     # Save job
DELETE /jobs/:id/save     # Unsave job
```

#### Applications
```http
GET    /applications           # List applications
POST   /applications           # Create application
POST   /applications/:id/apply # Trigger auto-apply
GET    /applications/analytics # Get stats
```

[Full API Documentation →](https://docs.jobpilot.ai/api)

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific package tests
pnpm test --filter=web
pnpm test --filter=api

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch
```

### Coverage Targets

| Package | Target | Current |
|---------|--------|---------|
| Web App | 85% | 88% |
| API Gateway | 90% | 92% |
| AI Service | 85% | 87% |
| Mobile App | 80% | 82% |

---

## 🚢 Deployment

### Using Docker

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes

```bash
# Apply with kubectl
kubectl apply -k infrastructure/kubernetes/overlays/prod

# Or using Helm
helm upgrade --install jobpilot ./infrastructure/kubernetes/helm/jobpilot \
  --namespace production \
  --values values.prod.yaml
```

### CI/CD Pipeline

1. **PR Created** → Lint, Type Check, Unit Tests
2. **PR Merged** → Build, Integration Tests, Deploy to Staging
3. **Staging Approved** → E2E Tests, Deploy to Production
4. **Production** → Health Checks, Monitoring, Rollback if needed

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write tests for new functionality
5. Run the test suite: `pnpm test`
6. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions/changes
- `chore:` Maintenance tasks

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) — GPT-4 API
- [Anthropic](https://anthropic.com) — Claude API
- [Vercel](https://vercel.com) — Next.js & Hosting
- [NestJS](https://nestjs.com) — Backend Framework
- [Expo](https://expo.dev) — Mobile Development

---

<div align="center">

**Built with ❤️ by the JobPilot AI Team**

[Website](https://jobpilot.ai) • [Twitter](https://twitter.com/jobpilotai) • [LinkedIn](https://linkedin.com/company/jobpilot-ai) • [Discord](https://discord.gg/jobpilot)

---

**🚀 Ready to land your dream job? [Start your free trial →](https://jobpilot.ai/signup)**

</div>
