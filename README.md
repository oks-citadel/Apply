# ApplyForUs AI Platform

A comprehensive AI-powered job application automation platform built with enterprise-grade microservices architecture.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)

## Overview

ApplyForUs AI is a full-stack, enterprise-grade SaaS platform that revolutionizes the job search process by automating and optimizing job applications using cutting-edge AI technology. The platform aggregates jobs from 500+ sources, provides intelligent resume building, AI-powered job matching, automated application submission, comprehensive analytics, and real-time notifications.

## Key Features

| Feature | Description |
|---------|-------------|
| **AI-Powered Resume Builder** | Create and optimize professional resumes with AI assistance |
| **Smart Job Matching** | ML algorithms match you with relevant job opportunities |
| **Auto-Apply Automation** | Automatically apply to LinkedIn, Indeed, Glassdoor jobs |
| **Job Aggregation** | Aggregate jobs from 500+ sources with ATS adapters |
| **Analytics Dashboard** | Track application metrics, success rates, and insights |
| **Multi-Platform Support** | Web, Mobile (iOS/Android), Chrome Extension |
| **Real-Time Notifications** | Email, push, and in-app notifications |
| **Interview Preparation** | AI-generated questions based on job descriptions |
| **Salary Prediction** | ML-powered salary range estimates |
| **Multi-Currency Support** | Stripe, Flutterwave, Paystack integration |

## Architecture

```
                                   +------------------+
                                   |   Load Balancer  |
                                   +--------+---------+
                                            |
                    +----------------------------------------------+
                    |                                              |
          +---------v----------+                     +-------------v---------+
          |    Web App         |                     |    API Gateway        |
          |   (Next.js 14)     |                     |   (NestJS)            |
          |    Port: 3000      |                     |   Port: 3500          |
          +--------------------+                     +-----------+-----------+
                                                                 |
    +-----------------------------------------------------------------------------------+
    |                                                                                   |
    v                      v                    v                   v                   v
+--------+            +--------+           +--------+          +--------+          +--------+
| Auth   |            | User   |           | Job    |          | Resume |          |  AI    |
|Service |            |Service |           |Service |          |Service |          |Service |
| :3003  |            | :3001  |           | :3004  |          | :3007  |          | :3008  |
+--------+            +--------+           +--------+          +--------+          +--------+
    |                     |                    |                   |                   |
    +---------------------+--------------------+-------------------+-------------------+
                                               |
                               +---------------v---------------+
                               |        Message Queue          |
                               |    (RabbitMQ + Redis)         |
                               +---------------+---------------+
                                               |
          +------------------------------------+------------------------------------+
          |                                    |                                    |
    +-----v------+                     +-------v-------+                   +--------v-------+
    | Notif.     |                     | Auto-Apply    |                   | Analytics      |
    | Service    |                     | Service       |                   | Service        |
    | :3009      |                     | :3006         |                   | :3010          |
    +------------+                     +---------------+                   +----------------+
```

### Project Structure

```
Job-Apply-Platform/
├── apps/                      # Frontend Applications
│   ├── web/                   # Main web app (Next.js 14)
│   ├── admin/                 # Admin dashboard (Next.js)
│   ├── employer/              # Employer portal (Next.js)
│   ├── mobile/                # Mobile app (React Native)
│   └── extension/             # Chrome extension
├── services/                  # Backend Microservices
│   ├── auth-service/          # Authentication & OAuth
│   ├── user-service/          # User management
│   ├── job-service/           # Job aggregation & search
│   ├── resume-service/        # Resume parsing & generation
│   ├── notification-service/  # Multi-channel notifications
│   ├── auto-apply-service/    # Browser automation
│   ├── analytics-service/     # Analytics & reporting
│   ├── ai-service/            # Python FastAPI ML service
│   ├── orchestrator-service/  # Service orchestration
│   ├── payment-service/       # Subscriptions & payments
│   └── api-gateway/           # API routing & auth
├── packages/                  # Shared Libraries
│   ├── types/                 # TypeScript interfaces
│   ├── utils/                 # Common utilities
│   ├── logging/               # Centralized logging
│   ├── telemetry/             # Distributed tracing
│   ├── security/              # RBAC & encryption
│   ├── feature-flags/         # Feature management
│   ├── config/                # Environment config
│   └── ui/                    # Shared components
├── infrastructure/            # Infrastructure as Code
│   ├── terraform/             # Azure Terraform configs
│   ├── kubernetes/            # K8s manifests
│   └── docker/                # Dockerfiles
└── tests/                     # Test suites
```

## Subscription Tiers

| Tier | Monthly | Yearly | Applications/mo | AI Cover Letters | Auto-Apply | Priority Support | API Access |
|------|---------|--------|-----------------|------------------|------------|------------------|------------|
| **Free** | $0 | $0 | 5 | 2 | No | No | No |
| **Starter** | $23.99 | $239.99 | 30 | 15 | No | No | No |
| **Basic** | $49.99 | $499.99 | 75 | 40 | Yes | No | No |
| **Professional** | $89.99 | $899.99 | 200 | 100 | Yes | Yes | No |
| **Advanced Career** | $149.99 | $1,499.99 | 500 | 300 | Yes | Yes | Yes |
| **Enterprise** | Custom | Custom | Unlimited | Unlimited | Yes | Yes | Yes |

### Feature Limits by Tier

| Feature | Free | Starter | Basic | Pro | Advanced | Enterprise |
|---------|------|---------|-------|-----|----------|------------|
| Job Applications | 5 | 30 | 75 | 200 | 500 | Unlimited |
| AI Cover Letters | 2 | 15 | 40 | 100 | 300 | Unlimited |
| Resume Templates | 2 | 5 | 10 | Unlimited | Unlimited | Unlimited |
| Auto-Apply | No | No | Yes | Yes | Yes | Yes |
| Salary Insights | No | No | Yes | Yes | Yes | Yes |
| Interview Prep | No | No | No | Yes | Yes | Yes |
| Analytics Dashboard | Basic | Basic | Standard | Advanced | Advanced | Custom |
| API Access | No | No | No | No | Yes | Yes |
| Dedicated Manager | No | No | No | No | No | Yes |

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14+ | Web applications |
| React Native | Mobile apps (iOS/Android) |
| TypeScript | Type-safe development |
| TailwindCSS | Styling |
| Radix UI | Accessible components |
| Zustand | State management |
| React Query | Server state |

### Backend
| Technology | Purpose |
|------------|---------|
| NestJS | Microservices framework |
| FastAPI | AI/ML service (Python) |
| PostgreSQL | Primary database |
| Redis | Caching & sessions |
| Elasticsearch | Job search |
| RabbitMQ | Message queue |
| Bull | Job processing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Kubernetes | Orchestration |
| Terraform | IaC (Azure) |
| Azure AKS | Managed Kubernetes |
| Azure ACR | Container registry |

### Payment Providers
| Provider | Markets |
|----------|---------|
| Stripe | Global (US, EU, UK, CA, AU) |
| Flutterwave | Africa (NG, GH, KE, ZA, UG, TZ) |
| Paystack | Africa (NG, GH, ZA) |

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 15+

### Installation

```bash
# Clone the repository
git clone https://github.com/oks-citadel/Apply.git
cd Apply

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, RabbitMQ, Elasticsearch)
docker compose up -d

# Build shared packages
pnpm build:packages

# Run all services in development mode
pnpm dev
```

### Development Ports

| Service | Port |
|---------|------|
| Web App | 3000 |
| Admin Dashboard | 3001 |
| Employer Portal | 3002 |
| Auth Service | 3003 |
| Job Service | 3004 |
| Auto-Apply Service | 3006 |
| Resume Service | 3007 |
| AI Service | 3008 |
| Notification Service | 3009 |
| Analytics Service | 3010 |
| Orchestrator Service | 3011 |
| API Gateway | 3500 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Elasticsearch | 9200 |
| RabbitMQ | 5672 |
| RabbitMQ UI | 15672 |

## Docker Images

All services are available as Docker images in Azure Container Registry:

```
acrunifiedhealthdev2.azurecr.io/applyai-web:latest
acrunifiedhealthdev2.azurecr.io/applyai-auth-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-user-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-job-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-resume-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-notification-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-auto-apply-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-analytics-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-ai-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-orchestrator-service:latest
acrunifiedhealthdev2.azurecr.io/applyai-payment-service:latest
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific service tests
pnpm --filter @applyforus/auth-service test

# Run E2E tests
pnpm test:e2e
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/applyforus

# Redis
REDIS_URL=redis://localhost:6379

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

## API Documentation

API documentation is available at:
- Development: `http://localhost:3500/api/docs`
- Production: `https://api.applyforus.com/docs`

## Deployment

### Azure Kubernetes Service (AKS)

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription <subscription-id>

# Get AKS credentials
az aks get-credentials --resource-group <rg-name> --name <aks-name>

# Deploy services
kubectl apply -f infrastructure/kubernetes/production/
```

### CI/CD Pipelines

- **GitHub Actions**: Automated testing, building, and deployment
- **Azure DevOps**: Alternative CI/CD pipeline
- **Terraform**: Infrastructure provisioning

## Monitoring & Observability

- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Distributed Tracing**: OpenTelemetry integration
- **Logging**: Centralized with Winston

## Security

- **Authentication**: JWT, OAuth 2.0, Multi-factor (TOTP)
- **Authorization**: RBAC, subscription guards
- **Encryption**: AWS KMS integration
- **Input Validation**: Zod schemas, DOMPurify
- **Rate Limiting**: Express rate limiter
- **Audit Logging**: Comprehensive activity tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All Rights Reserved

## Support

For support, contact: support@applyforus.com

---

Built with passion by the ApplyForUs Team
