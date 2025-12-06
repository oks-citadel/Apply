# Getting Started with JobPilot AI Platform

This guide will help you get the JobPilot AI Platform up and running on your local development environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Infrastructure Services](#infrastructure-services)
4. [Database Setup](#database-setup)
5. [Starting the Application](#starting-the-application)
6. [Verification](#verification)
7. [Next Steps](#next-steps)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Recommended Version | Download Link |
|----------|----------------|---------------------|---------------|
| Node.js | 20.0.0 | 20.11.0 or later | [nodejs.org](https://nodejs.org) |
| pnpm | 8.0.0 | 8.15.0 or later | [pnpm.io](https://pnpm.io) |
| Docker | 24.0.0 | Latest | [docker.com](https://docker.com) |
| Docker Compose | 2.20.0 | Latest | Included with Docker Desktop |
| Git | 2.40.0 | Latest | [git-scm.com](https://git-scm.com) |
| Python | 3.11.0 | 3.11.x (for AI service) | [python.org](https://python.org) |

### Recommended Tools

- **VS Code**: Recommended IDE with extensions
  - ESLint
  - Prettier
  - Docker
  - GitLens
  - Remote - Containers
- **Postman** or **Insomnia**: API testing
- **pgAdmin** or **DBeaver**: Database management
- **Redis Insight**: Redis management

### System Requirements

- **Operating System**: macOS, Linux, or Windows with WSL2
- **RAM**: Minimum 8GB, 16GB recommended
- **Disk Space**: 10GB free space
- **CPU**: Multi-core processor recommended

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/jobpilot/Job-Apply-Platform.git
cd Job-Apply-Platform

# Or if using SSH
git clone git@github.com:jobpilot/Job-Apply-Platform.git
cd Job-Apply-Platform
```

### 2. Install pnpm (if not already installed)

```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using Chocolatey (Windows)
choco install pnpm

# Verify installation
pnpm --version
```

### 3. Install Node.js Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This will install dependencies for:
# - Root workspace
# - All apps (web, mobile, extension)
# - All services (auth, user, resume, job, etc.)
# - All packages (ui, types, utils, etc.)
```

### 4. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
# Recommended: Use default values for local development
```

**Important Environment Variables to Configure:**

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobpilot

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# AI Services (optional for basic testing)
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Email (optional for basic testing)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@jobpilot.ai
```

## Infrastructure Services

The platform requires several infrastructure services. We use Docker Compose to manage these.

### Start Infrastructure Services

```bash
# Start all infrastructure services in detached mode
docker-compose up -d

# Or using Make
make docker-up

# Or using pnpm script
pnpm docker:up
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Elasticsearch** on port 9200
- **RabbitMQ** on port 5672 (Management UI on 15672)

### Verify Services are Running

```bash
# Check running containers
docker ps

# Check service logs
docker-compose logs -f

# Check specific service
docker-compose logs -f postgres
```

### Access Service UIs

| Service | URL | Credentials |
|---------|-----|-------------|
| RabbitMQ Management | http://localhost:15672 | guest / guest |
| Elasticsearch | http://localhost:9200 | elastic / changeme |

## Database Setup

### Run Database Migrations

```bash
# Run migrations for all services
pnpm db:migrate

# Or using Make
make db-migrate

# Run migrations for specific service
pnpm --filter auth-service migration:run
pnpm --filter user-service migration:run
pnpm --filter resume-service migration:run
pnpm --filter job-service migration:run
```

### Seed the Database (Optional)

```bash
# Seed with sample data
pnpm db:seed

# Or using Make
make db-seed
```

This creates:
- Sample users
- Sample resumes
- Sample job listings
- Test application data

### Verify Database Connection

```bash
# Connect to PostgreSQL using psql
docker exec -it jobpilot-postgres psql -U postgres -d jobpilot

# Inside psql, run:
\dt          # List all tables
\d users     # Describe users table
SELECT COUNT(*) FROM users;  # Count users
\q           # Quit psql
```

## Starting the Application

### Option 1: Start All Services (Recommended for Full Stack Development)

```bash
# Start all services and apps
pnpm dev

# Or using Make
make dev
```

This starts:
- Web app (Next.js) on port 3000
- All microservices on ports 8001-8008
- Mobile app in development mode

### Option 2: Start Individual Services

```bash
# Start only the web app
pnpm --filter web dev

# Start specific microservice
pnpm --filter auth-service start:dev
pnpm --filter user-service start:dev
pnpm --filter resume-service start:dev

# Start AI service (Python)
cd services/ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8008
```

### Option 3: Use Docker Compose for Development

```bash
# Start all services with hot-reload
docker-compose -f docker-compose.dev.yml up

# Build and start
docker-compose -f docker-compose.dev.yml up --build
```

## Verification

### 1. Check Service Health

Visit the following URLs to verify services are running:

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Web App | http://localhost:3000 | Landing page |
| Auth Service | http://localhost:8001/health | `{"status":"ok"}` |
| User Service | http://localhost:8002/health | `{"status":"ok"}` |
| Resume Service | http://localhost:8003/health | `{"status":"ok"}` |
| Job Service | http://localhost:8004/health | `{"status":"ok"}` |
| Auto-Apply Service | http://localhost:8005/health | `{"status":"ok"}` |
| Analytics Service | http://localhost:8006/health | `{"status":"ok"}` |
| Notification Service | http://localhost:8007/health | `{"status":"ok"}` |
| AI Service | http://localhost:8008/health | `{"status":"ok"}` |

### 2. Test API Endpoints

```bash
# Register a new user
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

### 3. Access Swagger Documentation

Most services provide Swagger/OpenAPI documentation:

- Auth Service: http://localhost:8001/api/docs
- User Service: http://localhost:8002/api/docs
- Resume Service: http://localhost:8003/api/docs
- Job Service: http://localhost:8004/api/docs

### 4. Run Tests

```bash
# Run all tests
pnpm test

# Run tests for specific workspace
pnpm --filter web test
pnpm --filter auth-service test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Next Steps

Now that you have the platform running, here are some next steps:

### For Frontend Developers
1. Read the [Web App Documentation](./development/web-app.md)
2. Explore the [UI Component Library](../packages/ui/README.md)
3. Review [Frontend Best Practices](./development/frontend-best-practices.md)

### For Backend Developers
1. Review the [API Documentation](./api/README.md)
2. Understand the [Microservices Architecture](./architecture.md)
3. Learn about [Adding New Services](./development/adding-services.md)

### For Full Stack Developers
1. Complete the [Development Guide](./development/README.md)
2. Review [Testing Strategies](./development/testing.md)
3. Understand the [Database Schema](./architecture/database-schema.md)

### Create Your First Feature
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Write tests
4. Submit a pull request (see [Contributing Guide](../CONTRIBUTING.md))

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Docker Services Not Starting

```bash
# Reset Docker environment
docker-compose down -v
docker-compose up -d

# Rebuild containers
docker-compose up -d --build

# Check Docker logs
docker-compose logs -f
```

#### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
pnpm db:migrate
```

#### pnpm Installation Issues

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear all node_modules in workspace
find . -name "node_modules" -type d -prune -exec rm -rf {} +
pnpm install
```

#### Python/AI Service Issues

```bash
# Recreate virtual environment
cd services/ai-service
rm -rf venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](./operations/troubleshooting.md)
2. Search [GitHub Issues](https://github.com/jobpilot/platform/issues)
3. Ask in [Discord](https://discord.gg/jobpilot)
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

## Development Tools Setup

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
```

## Environment-Specific Configuration

### Development Environment

The default `.env` configuration is optimized for local development with:
- Debug logging enabled
- Hot module reloading
- Relaxed security settings
- Mock external services

### Testing Environment

For running tests:

```bash
cp .env.example .env.test
# Configure test-specific variables
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobpilot_test
```

### Production-Like Environment

To test production builds locally:

```bash
# Build all services
pnpm build

# Start in production mode
NODE_ENV=production pnpm start
```

## Performance Tips

1. **Use Turborepo Cache**: Turborepo caches build outputs
2. **Docker BuildKit**: Enable for faster Docker builds
3. **pnpm Store**: Shared package cache across projects
4. **Incremental Builds**: Only rebuilds what changed

## Additional Resources

- [Project Structure](../PROJECT_STRUCTURE.md)
- [API Documentation](./api/README.md)
- [Architecture Overview](./architecture.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Code Style Guide](./development/code-style.md)

---

**Congratulations!** You now have a fully functional JobPilot AI Platform development environment.

**Next**: Explore the [Development Guide](./development/README.md) to learn best practices and workflows.
