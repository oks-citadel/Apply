# JOBPILOT AI
## Development Setup Guide

**Version 2.0.0 | Complete Installation & Configuration**  
*Step-by-Step Guide for Local Development Environment*

---

## 1. Prerequisites

Before setting up JobPilot AI, ensure your development environment meets the following requirements.

### 1.1 Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 20.x LTS+ | https://nodejs.org or use nvm |
| pnpm | 8.x+ | `npm install -g pnpm` |
| Docker | 24.x+ | https://docker.com/get-started |
| Docker Compose | 2.x+ | Included with Docker Desktop |
| Python | 3.11+ | For AI/ML services |
| Git | 2.x+ | https://git-scm.com |

### 1.2 Required API Keys

You will need accounts and API keys from the following services:

- **OpenAI API Key:** For GPT-4 content generation (https://platform.openai.com)
- **Anthropic API Key:** For Claude integration (https://console.anthropic.com)
- **Stripe Keys:** For payment processing (https://dashboard.stripe.com)
- **SendGrid API Key:** For email notifications (https://sendgrid.com)
- **AWS Credentials:** For S3 file storage (optional for local dev)

### 1.3 System Requirements

- **RAM:** Minimum 16GB (32GB recommended for full stack)
- **Storage:** At least 20GB free space
- **OS:** macOS 12+, Ubuntu 20.04+, or Windows 10+ with WSL2

---

## 2. Installation

### 2.1 Clone the Repository

```bash
git clone https://github.com/jobpilot/jobpilot-ai.git
cd jobpilot-ai
```

### 2.2 Install Dependencies

Install all workspace dependencies using pnpm:

```bash
pnpm install
```

This command installs dependencies for all apps, packages, and services in the monorepo.

### 2.3 Set Up Environment Variables

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Open `.env.local` in your editor and configure the following:

#### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 characters) |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens |
| `OPENAI_API_KEY` | Your OpenAI API key (sk-...) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (sk-ant-...) |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_... or sk_live_...) |
| `SENDGRID_API_KEY` | SendGrid API key for emails |

#### Example .env.local

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/jobpilot

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-token-secret-key-here

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# AWS (Optional for local development)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=jobpilot-uploads
AWS_REGION=us-east-1
```

---

## 3. Infrastructure Setup

### 3.1 Start Docker Services

Start the required infrastructure services using Docker Compose:

```bash
docker-compose up -d postgres redis elasticsearch rabbitmq
```

This starts the following services:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache, sessions, rate limiting |
| Elasticsearch | 9200 | Job search, full-text indexing |
| RabbitMQ | 5672, 15672 | Message queue, management UI |

### 3.2 Verify Services Are Running

```bash
docker-compose ps
```

All services should show status "Up" or "healthy".

### 3.3 Initialize the Database

1. Run database migrations to create tables:

```bash
pnpm db:migrate
```

2. Seed the database with initial data:

```bash
pnpm db:seed
```

This creates subscription plans, resume templates, and a test user account.

#### Default Test Account

After seeding, you can login with:
- **Email:** test@jobpilot.ai
- **Password:** TestPassword123!

---

## 4. Running the Application

### 4.1 Start All Services

Start all development servers simultaneously:

```bash
pnpm dev
```

### 4.2 Start Individual Services

Or start specific services as needed:

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Web application (Next.js) on port 3000 |
| `pnpm dev:api` | API Gateway (NestJS) on port 4000 |
| `pnpm dev:ai` | AI Service (FastAPI) on port 8000 |
| `pnpm dev:mobile` | Mobile app (Expo) on port 8081 |
| `pnpm dev:extension` | Browser extension development build |

### 4.3 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Web Application | http://localhost:3000 | Main dashboard |
| API Gateway | http://localhost:4000 | REST API |
| GraphQL Playground | http://localhost:4000/graphql | API explorer |
| Swagger Docs | http://localhost:4000/api/docs | REST API docs |
| AI Service | http://localhost:8000 | ML endpoints |
| AI Service Docs | http://localhost:8000/docs | FastAPI docs |
| RabbitMQ UI | http://localhost:15672 | Queue management (guest/guest) |

---

## 5. Running Tests

### 5.1 Test Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all unit tests |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test --filter=web` | Run tests for specific package |
| `pnpm test --filter=api` | Run API tests only |

### 5.2 Coverage Targets

| Package | Target | Current |
|---------|--------|---------|
| Web App | 85% | 88% |
| API Gateway | 90% | 92% |
| AI Service | 85% | 87% |
| Mobile App | 80% | 82% |

---

## 6. Building for Production

### 6.1 Build Commands

```bash
# Build all packages
pnpm build

# Build specific apps
pnpm build:web
pnpm build:api
pnpm build:ai
```

### 6.2 Docker Production Build

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

### 6.3 Verify Production Build

```bash
# Check all services are healthy
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Port Already in Use

If a port is already in use, find and kill the process:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use this one-liner
kill -9 $(lsof -t -i:3000)
```

#### Docker Container Issues

Reset Docker containers and volumes:

```bash
# Remove containers and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a

# Restart fresh
docker-compose up -d
```

#### Database Connection Failed

1. Verify PostgreSQL is running:

```bash
docker-compose ps postgres
```

2. Check DATABASE_URL in .env.local matches Docker configuration

3. Test connection manually:

```bash
docker exec -it jobpilot-postgres psql -U postgres -d jobpilot
```

4. Reset database if needed:

```bash
pnpm db:reset
```

#### Node Module Issues

Clear cache and reinstall:

```bash
# Remove all node_modules
rm -rf node_modules
rm -rf apps/*/node_modules packages/*/node_modules services/*/node_modules

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

#### Python Environment Issues

For AI service issues:

```bash
cd services/ai-service

# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate  # macOS/Linux
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

#### TypeScript Errors

Clear TypeScript cache:

```bash
# Remove all TypeScript build info
find . -name "*.tsbuildinfo" -delete
find . -name ".next" -type d -exec rm -rf {} +

# Rebuild
pnpm build
```

### 7.2 Useful Debug Commands

```bash
# Check all service logs
pnpm logs

# Check specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis

# View API gateway logs
pnpm dev:api --verbose

# Check database tables
docker exec -it jobpilot-postgres psql -U postgres -d jobpilot -c "\dt"

# Check Redis keys
docker exec -it jobpilot-redis redis-cli keys "*"
```

### 7.3 Getting Help

- **Documentation:** https://docs.jobpilot.ai
- **GitHub Issues:** https://github.com/jobpilot/jobpilot-ai/issues
- **Discord Community:** https://discord.gg/jobpilot
- **Email Support:** support@jobpilot.ai

---

## 8. Development Workflow

### 8.1 Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### 8.2 Git Workflow

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add auto-apply queue management"

# Bug fix
git commit -m "fix: resolve ATS adapter timeout issue"

# Documentation
git commit -m "docs: update API reference"

# Refactor
git commit -m "refactor: optimize resume parsing logic"
```

### 8.3 Branch Naming

- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates
- `refactor/` — Code refactoring
- `test/` — Test additions

Example: `feature/linkedin-oauth-integration`

---

## 9. Quick Reference

### Essential Commands

```bash
# Start development
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Database operations
pnpm db:migrate
pnpm db:seed
pnpm db:reset

# Code quality
pnpm lint
pnpm typecheck
pnpm format

# Docker operations
docker-compose up -d
docker-compose down
docker-compose logs -f
```

### Environment URLs

| Environment | Web | API |
|-------------|-----|-----|
| Local | http://localhost:3000 | http://localhost:4000 |
| Staging | https://staging.jobpilot.ai | https://api-staging.jobpilot.ai |
| Production | https://jobpilot.ai | https://api.jobpilot.ai |

---

## Document Information

| Property | Value |
|----------|-------|
| Version | 2.0.0 |
| Last Updated | 2025 |
| Maintainer | JobPilot AI Engineering Team |

---

*JobPilot AI — Setup Guide v2.0.0*
