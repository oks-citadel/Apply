# JobPilot AI Platform - Project Structure

## Overview

This document describes the complete project structure of the JobPilot AI Platform monorepo.

## Directory Structure

```
Job-Apply-Platform/
├── .github/                          # GitHub configuration
│   ├── workflows/                    # GitHub Actions workflows
│   │   ├── ci.yml                   # Continuous Integration pipeline
│   │   └── deploy.yml               # Deployment pipeline
│   ├── ISSUE_TEMPLATE/              # Issue templates
│   │   ├── bug_report.md           # Bug report template
│   │   └── feature_request.md      # Feature request template
│   └── PULL_REQUEST_TEMPLATE.md     # PR template
│
├── apps/                             # Frontend applications
│   ├── web/                         # Next.js web application
│   ├── mobile/                      # React Native mobile app
│   └── extension/                   # Chrome extension
│
├── packages/                         # Shared packages
│   ├── ui/                          # Shared UI components library
│   ├── types/                       # Shared TypeScript types & interfaces
│   ├── config/                      # Shared configuration
│   └── utils/                       # Shared utility functions
│
├── services/                         # Backend microservices
│   ├── auth-service/                # Authentication & authorization
│   ├── user-service/                # User management & profiles
│   ├── resume-service/              # Resume CRUD & AI parsing
│   ├── job-service/                 # Job listings, search & matching
│   ├── auto-apply-service/          # Automated job application
│   ├── analytics-service/           # Analytics & metrics
│   ├── notification-service/        # Email & push notifications
│   └── ai-service/                  # AI/ML operations (Python)
│
├── infrastructure/                   # Infrastructure as Code
│   ├── docker/                      # Docker configurations
│   │   └── postgres/                # PostgreSQL initialization
│   │       └── init.sql            # Database init script
│   ├── terraform/                   # Terraform IaC
│   │   ├── modules/                # Reusable Terraform modules
│   │   └── environments/           # Environment-specific configs
│   └── kubernetes/                  # Kubernetes manifests
│       ├── base/                   # Base configurations
│       └── services/               # Service-specific manifests
│
├── docs/                            # Documentation
│   ├── architecture/               # Architecture documentation
│   ├── api/                        # API documentation
│   └── guides/                     # User & developer guides
│
├── tests/                           # Test suites
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
│
├── docker/                          # Dockerfiles
│   ├── Dockerfile.node             # Multi-stage Node.js Dockerfile
│   └── Dockerfile.python           # Multi-stage Python Dockerfile
│
├── .editorconfig                    # Editor configuration
├── .dockerignore                    # Docker ignore rules
├── .env.example                     # Environment variables template
├── .eslintrc.js                     # ESLint configuration
├── .gitignore                       # Git ignore rules
├── .nvmrc                           # Node version specification
├── .prettierrc                      # Prettier configuration
├── .prettierignore                  # Prettier ignore rules
├── docker-compose.yml               # Local development services
├── Makefile                         # Development automation
├── package.json                     # Root package.json
├── pnpm-workspace.yaml              # pnpm workspace configuration
├── README.md                        # Project README
├── tsconfig.base.json               # Base TypeScript configuration
└── turbo.json                       # Turborepo configuration
```

## Key Files

### Root Configuration

| File | Purpose |
|------|---------|
| `package.json` | Root package configuration with workspace scripts |
| `turbo.json` | Turborepo build orchestration configuration |
| `pnpm-workspace.yaml` | pnpm workspace definition |
| `tsconfig.base.json` | Base TypeScript configuration for all packages |
| `.eslintrc.js` | ESLint rules and configuration |
| `.prettierrc` | Code formatting rules |
| `docker-compose.yml` | Local development infrastructure |
| `Makefile` | Development automation commands |

### Docker Configuration

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local dev services (PostgreSQL, Redis, Elasticsearch, RabbitMQ) |
| `docker/Dockerfile.node` | Multi-stage build for Node.js services |
| `docker/Dockerfile.python` | Multi-stage build for Python AI service |
| `.dockerignore` | Files to exclude from Docker builds |

### GitHub Actions

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI pipeline (lint, test, build) |
| `.github/workflows/deploy.yml` | Deployment pipeline |

## Workspace Structure

### Apps Workspace (`apps/*`)

Contains frontend applications:
- **web**: Next.js 14+ web application
- **mobile**: React Native mobile app
- **extension**: Chrome extension for job application automation

### Packages Workspace (`packages/*`)

Contains shared libraries:
- **ui**: Shared React components (buttons, forms, layouts)
- **types**: TypeScript types and interfaces
- **config**: Shared configuration (ESLint, TypeScript)
- **utils**: Utility functions (validation, formatting, etc.)

### Services Workspace (`services/*`)

Contains backend microservices:

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| auth-service | 8001 | Node.js/TypeScript | Authentication & JWT management |
| user-service | 8002 | Node.js/TypeScript | User profiles & preferences |
| resume-service | 8003 | Node.js/TypeScript | Resume CRUD & AI parsing |
| job-service | 8004 | Node.js/TypeScript | Job listings & search |
| auto-apply-service | 8005 | Node.js/TypeScript | Automated applications |
| analytics-service | 8006 | Node.js/TypeScript | Metrics & analytics |
| notification-service | 8007 | Node.js/TypeScript | Email & notifications |
| ai-service | 8008 | Python/FastAPI | AI/ML operations |

## Infrastructure Services

Managed by `docker-compose.yml`:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache & session store |
| Elasticsearch | 9200 | Search engine |
| RabbitMQ | 5672 | Message queue |
| RabbitMQ Management | 15672 | RabbitMQ UI |
| PgAdmin | 5050 | Database management UI (optional) |
| Mailhog | 8025 | Email testing UI (optional) |

## Development Workflow

### Initial Setup

```bash
# Install dependencies
make install
# or
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services
make docker-up
# or
docker-compose up -d

# Run migrations
make db-migrate
# or
pnpm db:migrate
```

### Daily Development

```bash
# Start all services in dev mode
make dev
# or
pnpm dev

# Run tests
make test
# or
pnpm test

# Lint code
make lint
# or
pnpm lint

# Format code
make format
# or
pnpm format
```

## Build System

The project uses **Turborepo** for build orchestration:

- **Parallel execution**: Multiple packages build simultaneously
- **Caching**: Intelligent caching of build outputs
- **Dependency graph**: Builds packages in correct order
- **Incremental builds**: Only rebuilds what changed

## Environment Variables

All environment variables are defined in `.env.example`. Key categories:

1. **Application**: Basic app configuration
2. **Databases**: PostgreSQL, Redis connection strings
3. **External Services**: Elasticsearch, RabbitMQ
4. **Authentication**: JWT secrets, OAuth providers
5. **Email**: SendGrid/SES configuration
6. **Cloud Services**: AWS S3, etc.
7. **AI Services**: OpenAI, Anthropic API keys
8. **Payment**: Stripe configuration
9. **Analytics**: Google Analytics, Mixpanel
10. **Feature Flags**: Enable/disable features

## Testing Strategy

### Unit Tests (`tests/unit/`)
- Individual function/component testing
- Fast execution
- No external dependencies

### Integration Tests (`tests/integration/`)
- Service-to-service communication
- Database interactions
- API endpoint testing

### E2E Tests (`tests/e2e/`)
- Full user workflows
- Browser automation
- Cross-service scenarios

## CI/CD Pipeline

### Continuous Integration (`.github/workflows/ci.yml`)

1. **Setup**: Install dependencies
2. **Lint**: Check code style and quality
3. **Type Check**: Verify TypeScript types
4. **Test**: Run all test suites
5. **Build**: Build all packages
6. **Security**: Run security audits

### Deployment (`.github/workflows/deploy.yml`)

1. Build production artifacts
2. Run tests
3. Deploy to production
4. Send notifications

## Path Aliases

TypeScript path aliases configured in `tsconfig.base.json`:

- `@jobpilot/types` → Shared types package
- `@jobpilot/ui` → Shared UI components
- `@jobpilot/config` → Shared configuration
- `@jobpilot/utils` → Shared utilities
- `@jobpilot/*-service` → Individual services

## Best Practices

1. **Always run tests** before committing
2. **Follow naming conventions** in the codebase
3. **Update documentation** with code changes
4. **Use semantic commit messages**
5. **Keep services small and focused**
6. **Write tests for new features**
7. **Review security implications**
8. **Monitor performance metrics**

## Support

For questions or issues:
- Check documentation in `docs/`
- Review GitHub issues
- Contact the development team

---

Last Updated: 2025-12-04
