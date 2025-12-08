# Getting Started with JobPilot AI Platform

This guide will help you set up the JobPilot AI Platform for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Platform](#running-the-platform)
- [Verification](#verification)
- [Next Steps](#next-steps)
- [Common Issues](#common-issues)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v20.0.0 or higher)
   ```bash
   node --version  # Should output v20.x.x or higher
   ```
   Download from: https://nodejs.org/

2. **pnpm** (v8.0.0 or higher)
   ```bash
   npm install -g pnpm
   pnpm --version  # Should output 8.x.x or higher
   ```

3. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before proceeding

4. **Python** (v3.11 or higher) - Required for AI Service
   ```bash
   python --version  # Should output Python 3.11.x or higher
   ```

5. **Git**
   ```bash
   git --version
   ```

### Optional but Recommended

- **Visual Studio Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript
  - Docker
  - Python
- **Postman** or **Insomnia** for API testing
- **DBeaver** or **pgAdmin** for database management

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Job-Apply-Platform
```

### 2. Install Dependencies

Install all project dependencies using pnpm:

```bash
pnpm install
```

This will install dependencies for:
- All frontend applications (web, mobile, extension)
- All backend microservices
- Shared packages
- Development tools

The installation process may take 5-10 minutes depending on your internet connection.

### 3. Verify Installation

Check that all workspaces are properly set up:

```bash
pnpm ls -r --depth 0
```

You should see all services and packages listed.

## Environment Configuration

### 1. Create Environment Files

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Required Environment Variables

Edit the `.env` file and update the following critical variables:

#### Database Configuration
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobpilot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=jobpilot
POSTGRES_HOST=localhost
POSTGRES_PORT=5434
```

#### Redis Configuration
```bash
REDIS_URL=redis://localhost:6381
REDIS_HOST=localhost
REDIS_PORT=6381
```

#### RabbitMQ Configuration
```bash
RABBITMQ_URL=amqp://guest:guest@localhost:5673
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5673
```

#### JWT Configuration
Generate secure random strings for JWT secrets:

```bash
# Generate secure secrets (run these commands)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update these values in `.env`:
```bash
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>
SESSION_SECRET=<your-generated-secret>
```

#### AI Service Configuration (Optional for initial setup)

For AI features to work, you'll need API keys:

```bash
# OpenAI (required for most AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Pinecone Vector Database (optional for advanced features)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=jobpilot-vectors
```

#### Service URLs
```bash
AI_SERVICE_URL=http://localhost:8000/api/v1
AUTH_SERVICE_URL=http://localhost:8001/api/v1
USER_SERVICE_URL=http://localhost:8002/api/v1
RESUME_SERVICE_URL=http://localhost:8003/api/v1
JOB_SERVICE_URL=http://localhost:8004/api/v1
AUTO_APPLY_SERVICE_URL=http://localhost:8005/api/v1
ANALYTICS_SERVICE_URL=http://localhost:8006/api/v1
NOTIFICATION_SERVICE_URL=http://localhost:8007/api/v1
```

### 3. Service-Specific Environment Files

Some services have their own `.env` files. Copy the examples:

```bash
# AI Service
cp services/ai-service/.env.example services/ai-service/.env

# Notification Service
cp services/notification-service/.env.example services/notification-service/.env

# Resume Service
cp services/resume-service/.env.example services/resume-service/.env
```

## Database Setup

### 1. Start Infrastructure Services

Start PostgreSQL, Redis, RabbitMQ, and Elasticsearch using Docker Compose:

```bash
pnpm docker:up
```

This command starts:
- PostgreSQL on port 5434
- Redis on port 6381
- RabbitMQ on port 5673 (Management UI: http://localhost:15673)
- Elasticsearch on port 9200
- MailHog (Email testing) on port 1025 (UI: http://localhost:8025)

Verify services are running:

```bash
docker ps
```

You should see all containers in "Up" status.

### 2. Wait for Services to Be Ready

PostgreSQL and Elasticsearch may take 30-60 seconds to fully initialize. Check their logs:

```bash
docker-compose logs -f postgres
docker-compose logs -f elasticsearch
```

Wait until you see "database system is ready to accept connections" for PostgreSQL.

### 3. Run Database Migrations

Create database schemas and tables:

```bash
# Run migrations for all services
pnpm db:migrate
```

This will:
- Create all necessary tables
- Set up indexes
- Configure constraints
- Initialize sequences

### 4. Seed Initial Data (Optional)

Populate the database with sample data for development:

```bash
pnpm db:seed
```

This creates:
- Sample user accounts
- Test job listings
- Sample resumes
- Demo analytics data

**Test Accounts Created:**
- Email: `admin@jobpilot.ai` / Password: `Admin123!`
- Email: `user@jobpilot.ai` / Password: `User123!`

## Running the Platform

### Development Mode (All Services)

Start all services in development mode with hot-reload:

```bash
pnpm dev
```

This starts:
- **Web App**: http://localhost:3000
- **AI Service**: http://localhost:8000
- **Auth Service**: http://localhost:8001
- **User Service**: http://localhost:8002
- **Resume Service**: http://localhost:8003
- **Job Service**: http://localhost:8004
- **Auto-Apply Service**: http://localhost:8005
- **Analytics Service**: http://localhost:8006
- **Notification Service**: http://localhost:8007
- **Orchestrator Service**: http://localhost:8008

### Running Individual Services

You can also run services individually:

```bash
# Web Application
cd apps/web
pnpm dev

# AI Service
cd services/ai-service
pnpm dev  # or python src/main.py

# Auth Service
cd services/auth-service
pnpm dev

# Any other service
cd services/<service-name>
pnpm dev
```

### Building for Production

Build all services:

```bash
pnpm build
```

Build individual service:

```bash
cd services/auth-service
pnpm build
```

## Verification

### 1. Check Service Health

Once all services are running, verify they're healthy:

```bash
# Check each service health endpoint
curl http://localhost:8001/health  # Auth Service
curl http://localhost:8002/health  # User Service
curl http://localhost:8003/health  # Resume Service
curl http://localhost:8004/health  # Job Service
curl http://localhost:8005/health  # Auto-Apply Service
curl http://localhost:8006/health  # Analytics Service
curl http://localhost:8007/health  # Notification Service
curl http://localhost:8000/health  # AI Service
```

Each should return a 200 status with health information.

### 2. Access the Web Application

Open your browser and navigate to:
- **Web App**: http://localhost:3000

You should see the JobPilot login page.

### 3. Test API Endpoints

Try a basic API request:

```bash
# Register a new user
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 4. Check Database Connections

Verify database connectivity:

```bash
# Connect to PostgreSQL
docker exec -it jobpilot-postgres psql -U postgres -d jobpilot

# Inside PostgreSQL shell, list tables
\dt

# Exit
\q
```

### 5. Verify Message Queue

Access RabbitMQ Management UI:
- URL: http://localhost:15673
- Username: `guest`
- Password: `guest`

### 6. Check Email Testing (MailHog)

Access MailHog UI to view test emails:
- URL: http://localhost:8025

## Next Steps

Now that your development environment is set up, you can:

1. **Explore the Codebase**
   - Review the [Architecture Documentation](architecture.md)
   - Understand the [API Reference](api-reference.md)
   - Read service-specific READMEs

2. **Start Development**
   - Read the [Development Guide](development/workflow.md)
   - Review [Coding Standards](development/coding-standards.md)
   - Learn about [Testing Practices](development/testing.md)

3. **Make Your First Contribution**
   - Check the [Contributing Guidelines](../CONTRIBUTING.md)
   - Find beginner-friendly issues labeled "good first issue"
   - Submit your first pull request

4. **Explore Advanced Features**
   - Set up [Chrome Extension](development/chrome-extension.md)
   - Configure [Mobile App](development/mobile-app.md)
   - Learn about [AI/ML Features](development/ai-features.md)

## Common Issues

### Docker Services Won't Start

**Problem**: Docker containers fail to start or exit immediately.

**Solution**:
1. Ensure Docker Desktop is running
2. Check port conflicts:
   ```bash
   lsof -i :5434  # PostgreSQL
   lsof -i :6381  # Redis
   lsof -i :5673  # RabbitMQ
   ```
3. Reset Docker environment:
   ```bash
   pnpm docker:down
   docker system prune -f
   pnpm docker:up
   ```

### Database Migration Fails

**Problem**: `pnpm db:migrate` fails with connection errors.

**Solution**:
1. Ensure PostgreSQL is running: `docker ps`
2. Wait 30 seconds after starting Docker services
3. Verify connection string in `.env`
4. Check PostgreSQL logs: `docker-compose logs postgres`

### Port Already in Use

**Problem**: Service fails to start due to port conflict.

**Solution**:
1. Find process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000

   # macOS/Linux
   lsof -i :3000
   ```
2. Kill the process or change the port in `.env`

### pnpm Install Fails

**Problem**: Dependency installation fails.

**Solution**:
1. Clear pnpm cache:
   ```bash
   pnpm store prune
   ```
2. Delete node_modules and lockfile:
   ```bash
   pnpm clean
   ```
3. Reinstall:
   ```bash
   pnpm install
   ```

### AI Service Won't Start

**Problem**: Python AI service fails to start.

**Solution**:
1. Verify Python version: `python --version` (should be 3.11+)
2. Create virtual environment:
   ```bash
   cd services/ai-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Check for missing dependencies in `requirements.txt`

### Environment Variables Not Loading

**Problem**: Services can't read environment variables.

**Solution**:
1. Ensure `.env` file exists in project root
2. Verify `.env` file format (no spaces around `=`)
3. Restart all services after modifying `.env`
4. Check service-specific `.env` files

## Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Search existing [GitHub Issues](https://github.com/your-org/Job-Apply-Platform/issues)
3. Ask in the [Developer Forum](https://community.jobpilot.com)
4. Contact the development team at dev@jobpilot.ai

## Additional Resources

- [Architecture Overview](architecture.md)
- [API Documentation](api-reference.md)
- [Development Workflow](development/workflow.md)
- [Testing Guide](development/testing.md)
- [Deployment Guide](deployment/README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

Welcome to the JobPilot development team! Happy coding!
