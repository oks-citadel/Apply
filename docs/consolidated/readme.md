# JobPilot AI Platform - Documentation

Welcome to the JobPilot AI Platform documentation. This guide will help you understand, develop, deploy, and maintain the platform.

## Table of Contents

### Getting Started
- [Quick Start Guide](./getting-started.md) - Get up and running quickly
- [Installation](./development/installation.md) - Detailed installation instructions
- [Environment Setup](./development/environment-setup.md) - Configure your development environment

### Architecture
- [System Architecture](./architecture.md) - High-level system design and architecture
- [Microservices Overview](./architecture/microservices.md) - Individual service descriptions
- [Database Schema](./architecture/database-schema.md) - Database design and relationships
- [Authentication Flow](./architecture/authentication-flow.md) - Auth and authorization patterns
- [Event-Driven Architecture](./architecture/event-driven.md) - Message queue and event patterns

### API Documentation
- [API Overview](./api/README.md) - API introduction and conventions
- [Authentication API](./api/authentication.md) - Auth endpoints
- [User API](./api/users.md) - User management endpoints
- [Resume API](./api/resumes.md) - Resume CRUD and AI features
- [Job API](./api/jobs.md) - Job search and matching
- [Application API](./api/applications.md) - Application tracking
- [AI Service API](./api/ai.md) - AI/ML endpoints
- [Error Codes](./api/errors.md) - Complete error reference

### Development
- [Development Guide](./development/README.md) - Development best practices
- [Code Style Guide](./development/code-style.md) - Coding standards and conventions
- [Testing Guide](./development/testing.md) - Unit, integration, and E2E testing
- [Database Migrations](./development/database-migrations.md) - Managing database changes
- [Adding New Services](./development/adding-services.md) - Create new microservices
- [Debugging Guide](./development/debugging.md) - Debugging tips and tricks
- [Logging Standards](./logging-standards.md) - Logging best practices

### Deployment
- [Deployment Overview](./deployment/README.md) - Deployment strategies
- [Docker Compose](./deployment/docker-compose.md) - Local and staging deployment
- [Kubernetes](./deployment/kubernetes.md) - Production Kubernetes deployment
- [Azure Deployment](./deployment/azure.md) - Azure-specific deployment
- [Environment Variables](./deployment/environment-variables.md) - Configuration management
- [CI/CD Pipeline](./deployment/ci-cd.md) - Automated deployment workflows
- [Monitoring & Logging](./deployment/monitoring.md) - Production monitoring
- [Disaster Recovery](./deployment/disaster-recovery.md) - Backup and recovery procedures

### Security
- [Security Overview](./security/README.md) - Security best practices
- [Authentication & Authorization](./security/auth.md) - Security implementation
- [Data Encryption](./security/encryption.md) - Encryption strategies
- [Security Scanning](./security/scanning.md) - Vulnerability scanning
- [Compliance](./security/compliance.md) - GDPR, SOC2, and other compliance

### Operations
- [Operations Guide](./operations/README.md) - Day-to-day operations
- [Health Checks](./operations/health-checks.md) - Service health monitoring
- [Scaling Guide](./operations/scaling.md) - Horizontal and vertical scaling
- [Troubleshooting](./operations/troubleshooting.md) - Common issues and solutions
- [Runbooks](./operations/runbooks.md) - Operational procedures

### Contributing
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Pull Request Process](./development/pull-requests.md) - PR guidelines
- [Code Review Guidelines](./development/code-review.md) - Review best practices

## Quick Links

### For Developers
1. [Quick Start Guide](./getting-started.md)
2. [Development Setup](./development/installation.md)
3. [Code Style Guide](./development/code-style.md)
4. [Testing Guide](./development/testing.md)
5. [API Documentation](./api/README.md)

### For DevOps
1. [Deployment Overview](./deployment/README.md)
2. [Kubernetes Guide](./deployment/kubernetes.md)
3. [CI/CD Pipeline](./deployment/ci-cd.md)
4. [Monitoring Setup](./deployment/monitoring.md)
5. [Troubleshooting](./operations/troubleshooting.md)

### For Architects
1. [System Architecture](./architecture.md)
2. [Microservices Overview](./architecture/microservices.md)
3. [Database Schema](./architecture/database-schema.md)
4. [Security Architecture](./security/README.md)

## Project Overview

JobPilot AI is an AI-powered job application automation platform built with a modern microservices architecture. The platform helps job seekers:

- Build ATS-optimized resumes with AI assistance
- Find and match relevant job opportunities
- Automate job applications across multiple platforms
- Track application status and analytics
- Receive AI-powered career insights

## Technology Stack

### Frontend
- **Web App**: Next.js 14, React, TypeScript, TailwindCSS
- **Mobile App**: React Native, Expo
- **Browser Extension**: Chrome Extension Manifest V3

### Backend
- **API Gateway**: Node.js, NestJS, Express
- **Microservices**: Node.js, NestJS, TypeScript
- **AI Service**: Python, FastAPI, Transformers
- **Auto-Apply Service**: Python, Selenium, Playwright

### Data Layer
- **Primary Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search Engine**: Elasticsearch 8+
- **Message Queue**: RabbitMQ 3+

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes, Helm
- **IaC**: Terraform
- **CI/CD**: GitHub Actions, Azure Pipelines
- **Cloud**: Azure (primary), AWS (secondary)

## Repository Structure

```
Job-Apply-Platform/
├── apps/                 # Frontend applications
│   ├── web/             # Next.js web app
│   ├── mobile/          # React Native app
│   └── extension/       # Chrome extension
├── services/            # Backend microservices
│   ├── auth-service/
│   ├── user-service/
│   ├── resume-service/
│   ├── job-service/
│   ├── auto-apply-service/
│   ├── analytics-service/
│   ├── notification-service/
│   └── ai-service/
├── packages/            # Shared libraries
│   ├── ui/
│   ├── types/
│   ├── config/
│   ├── utils/
│   ├── logging/
│   ├── security/
│   └── telemetry/
├── infrastructure/      # IaC and deployment configs
├── docs/               # Documentation (you are here)
├── e2e/                # End-to-end tests
└── scripts/            # Utility scripts
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Web App | 3000 | Next.js frontend |
| Auth Service | 8001 | Authentication & authorization |
| User Service | 8002 | User profiles & preferences |
| Resume Service | 8003 | Resume CRUD & AI parsing |
| Job Service | 8004 | Job listings & search |
| Auto-Apply Service | 8005 | Automated applications |
| Analytics Service | 8006 | Metrics & analytics |
| Notification Service | 8007 | Email & push notifications |
| AI Service | 8008 | AI/ML operations |

## Infrastructure Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache & sessions |
| Elasticsearch | 9200 | Search engine |
| RabbitMQ | 5672 | Message broker |
| RabbitMQ Management | 15672 | RabbitMQ admin UI |

## Getting Help

- **Documentation**: Start with the [Quick Start Guide](./getting-started.md)
- **Issues**: Check [GitHub Issues](https://github.com/jobpilot/platform/issues)
- **Community**: Join our [Discord](https://discord.gg/jobpilot)
- **Support**: Email support@jobpilot.ai

## Contributing

We welcome contributions! Please read our [Contributing Guide](../CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

**Last Updated**: 2025-12-05
**Version**: 2.0.0
