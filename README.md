# JobPilot AI Platform

A comprehensive AI-powered job application automation platform built with a microservices architecture.

## Overview

JobPilot AI is a full-stack platform that helps job seekers automate and optimize their job application process using AI-powered tools including resume building, job matching, auto-apply functionality, and analytics.

## Architecture

This is a monorepo project organized into:

- **apps/**: Frontend applications (Web, Mobile, Chrome Extension)
- **services/**: Backend microservices
- **packages/**: Shared packages and libraries
- **infrastructure/**: Infrastructure as Code (Terraform, Kubernetes)
- **docs/**: Documentation
- **tests/**: Test suites

## Tech Stack

### Frontend
- Next.js 14+ (Web App)
- React Native (Mobile App)
- Chrome Extension API (Browser Extension)
- TypeScript
- TailwindCSS

### Backend
- Node.js/TypeScript (Microservices)
- Python/FastAPI (AI Service)
- PostgreSQL (Primary Database)
- Redis (Cache & Sessions)
- Elasticsearch (Search Engine)
- RabbitMQ (Message Queue)

### Infrastructure
- Docker & Docker Compose
- Kubernetes
- Terraform
- GitHub Actions

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- Python >= 3.11 (for AI service)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Job-Apply-Platform
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start infrastructure services

```bash
pnpm docker:up
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Elasticsearch on port 9200
- RabbitMQ on port 5672 (Management UI on 15672)

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Start development servers

```bash
pnpm dev
```

## Available Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages and services
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking
- `pnpm docker:up` - Start Docker services
- `pnpm docker:down` - Stop Docker services
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data

## Project Structure

```
Job-Apply-Platform/
├── apps/
│   ├── web/                    # Next.js web application
│   ├── mobile/                 # React Native mobile app
│   └── extension/              # Chrome extension
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── types/                  # Shared TypeScript types
│   ├── config/                 # Shared configuration
│   └── utils/                  # Shared utilities
├── services/
│   ├── auth-service/           # Authentication & authorization
│   ├── user-service/           # User management
│   ├── resume-service/         # Resume CRUD & parsing
│   ├── job-service/            # Job listings & matching
│   ├── auto-apply-service/     # Auto-apply automation
│   ├── analytics-service/      # Analytics & reporting
│   ├── notification-service/   # Email & push notifications
│   └── ai-service/             # AI/ML operations
├── infrastructure/
│   ├── terraform/              # Infrastructure as Code
│   ├── kubernetes/             # K8s manifests
│   └── docker/                 # Docker configurations
├── docs/                       # Documentation
├── tests/                      # Test suites
└── docker-compose.yml          # Local development setup
```

## Microservices

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 8001 | Authentication & JWT management |
| User Service | 8002 | User profiles & preferences |
| Resume Service | 8003 | Resume CRUD & AI parsing |
| Job Service | 8004 | Job listings & search |
| Auto-Apply Service | 8005 | Automated job applications |
| Analytics Service | 8006 | Metrics & analytics |
| Notification Service | 8007 | Email & notifications |
| AI Service | 8008 | AI/ML operations |

## Development Workflow

1. Create a new branch for your feature
2. Make your changes
3. Run tests: `pnpm test`
4. Lint your code: `pnpm lint`
5. Format your code: `pnpm format`
6. Commit your changes
7. Push and create a pull request

## Testing

```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e
```

## Deployment

Deployment is automated via GitHub Actions. See `.github/workflows/` for CI/CD pipelines.

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

Proprietary - All rights reserved

## Support

For support, email support@jobpilot.ai or open an issue in the repository.
