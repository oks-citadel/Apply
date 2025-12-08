# JobPilot AI Platform

A comprehensive AI-powered job application automation platform built with a modern microservices architecture.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

## Overview

JobPilot AI is a full-stack, enterprise-grade platform that revolutionizes the job search process by automating and optimizing job applications using cutting-edge AI technology. The platform provides intelligent resume building, AI-powered job matching, automated application submission, comprehensive analytics, and real-time notifications.

### Key Features

- **AI-Powered Resume Builder**: Create and optimize professional resumes with AI assistance
- **Smart Job Matching**: Machine learning algorithms match you with relevant job opportunities
- **Auto-Apply Automation**: Automatically apply to jobs based on your preferences
- **Analytics Dashboard**: Track application metrics, success rates, and performance insights
- **Multi-Platform Support**: Web application, mobile app, and Chrome extension
- **Real-Time Notifications**: Stay updated on application status and new opportunities
- **Resume Parsing & Optimization**: Upload existing resumes and get AI-powered improvement suggestions
- **Interview Preparation**: AI-generated interview questions based on job descriptions
- **Salary Prediction**: ML-powered salary range estimates for job positions

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

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Getting Started Guide](docs/getting-started.md) - Complete developer setup and onboarding
- [Architecture Documentation](docs/architecture.md) - System design and architecture details
- [API Reference](docs/api-reference.md) - Complete API endpoint documentation
- [Deployment Guide](docs/deployment/) - Production deployment instructions
- [Development Guide](docs/development/) - Development workflow and best practices
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project

## Available Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages and services
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking
- `pnpm docker:up` - Start Docker services
- `pnpm docker:down` - Stop Docker services
- `pnpm docker:logs` - View Docker service logs
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm clean` - Clean build artifacts and dependencies

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

## Environment Variables

The platform uses a comprehensive set of environment variables. See `.env.example` for a complete list with descriptions. Key variables include:

- Database connection strings (PostgreSQL)
- Redis and RabbitMQ URLs
- JWT secrets for authentication
- API keys for OpenAI, LinkedIn, Indeed, etc.
- AWS S3 credentials for file storage
- Email service configuration (SendGrid)
- Service ports and URLs

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests. Key points:

1. Fork the repository and create a feature branch
2. Follow the coding standards and conventions
3. Write tests for new features
4. Ensure all tests pass and code is properly formatted
5. Submit a pull request with a clear description

## Security

- Security audits are performed regularly
- Dependencies are kept up-to-date
- All sensitive data is encrypted
- Rate limiting and authentication on all endpoints
- See [Security Policy](docs/SECURITY.md) for reporting vulnerabilities

## License

Proprietary - All rights reserved. This software is proprietary and confidential.

## Support

- **Documentation**: [docs.jobpilot.ai](https://docs.jobpilot.ai)
- **API Status**: [status.jobpilot.ai](https://status.jobpilot.ai)
- **Email Support**: support@jobpilot.ai
- **Issues**: Open an issue in this repository
- **Developer Forum**: [community.jobpilot.com](https://community.jobpilot.com)

## Acknowledgments

Built with modern technologies and best practices:
- Node.js & TypeScript for robust backend services
- Next.js 14+ for high-performance frontend
- Python & FastAPI for AI/ML operations
- PostgreSQL, Redis, and Elasticsearch for data management
- Docker & Kubernetes for containerization and orchestration

---

Made with care by the JobPilot team
