# Troubleshooting Guide

This guide covers common issues and their solutions for the JobPilot AI Platform.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Docker Issues](#docker-issues)
- [Database Issues](#database-issues)
- [Service Issues](#service-issues)
- [API Errors](#api-errors)
- [Authentication Issues](#authentication-issues)
- [Build Errors](#build-errors)
- [Performance Issues](#performance-issues)
- [Network Issues](#network-issues)

---

## Installation Issues

### pnpm Install Fails

**Problem**: `pnpm install` fails with errors or hangs.

**Solutions**:

1. **Clear pnpm cache and reinstall**:
   ```bash
   pnpm store prune
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

2. **Check Node.js version**:
   ```bash
   node --version  # Should be v20.0.0 or higher
   ```
   If version is incorrect, install the correct version using nvm:
   ```bash
   nvm install 20
   nvm use 20
   ```

3. **Increase memory limit**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   pnpm install
   ```

4. **Network issues - use different registry**:
   ```bash
   pnpm config set registry https://registry.npmjs.org/
   pnpm install
   ```

### Python Dependencies Fail

**Problem**: Python packages fail to install for AI service.

**Solutions**:

1. **Ensure correct Python version**:
   ```bash
   python --version  # Should be 3.11 or higher
   ```

2. **Create and use virtual environment**:
   ```bash
   cd services/ai-service
   python -m venv venv

   # On Windows
   venv\Scripts\activate

   # On macOS/Linux
   source venv/bin/activate

   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Install system dependencies** (Ubuntu/Debian):
   ```bash
   sudo apt-get update
   sudo apt-get install python3-dev build-essential
   ```

4. **Install system dependencies** (macOS):
   ```bash
   brew install python@3.11
   ```

---

## Docker Issues

### Docker Containers Won't Start

**Problem**: Running `pnpm docker:up` fails or containers exit immediately.

**Solutions**:

1. **Ensure Docker Desktop is running**:
   ```bash
   docker --version
   docker ps
   ```

2. **Check for port conflicts**:
   ```bash
   # Windows
   netstat -ano | findstr :5434
   netstat -ano | findstr :6381
   netstat -ano | findstr :5673

   # macOS/Linux
   lsof -i :5434  # PostgreSQL
   lsof -i :6381  # Redis
   lsof -i :5673  # RabbitMQ
   lsof -i :9200  # Elasticsearch
   ```

3. **Reset Docker environment**:
   ```bash
   pnpm docker:down
   docker system prune -f
   docker volume prune -f
   pnpm docker:up
   ```

4. **Check Docker logs**:
   ```bash
   docker-compose logs postgres
   docker-compose logs redis
   docker-compose logs rabbitmq
   ```

### PostgreSQL Container Fails

**Problem**: PostgreSQL container exits or won't accept connections.

**Solutions**:

1. **Check PostgreSQL logs**:
   ```bash
   docker-compose logs postgres
   ```

2. **Ensure data directory has correct permissions**:
   ```bash
   # Remove old volume
   docker volume rm jobpilot_postgres_data
   pnpm docker:up
   ```

3. **Wait for PostgreSQL to be ready**:
   ```bash
   # PostgreSQL takes 30-60 seconds to initialize
   docker-compose logs -f postgres
   # Wait for: "database system is ready to accept connections"
   ```

4. **Test connection**:
   ```bash
   docker exec -it jobpilot-postgres psql -U postgres -d jobpilot -c "SELECT 1;"
   ```

### Elasticsearch Won't Start

**Problem**: Elasticsearch container fails to start or is unhealthy.

**Solutions**:

1. **Increase Docker memory**:
   - Docker Desktop → Settings → Resources
   - Increase Memory to at least 4GB

2. **Set vm.max_map_count** (Linux/WSL):
   ```bash
   sudo sysctl -w vm.max_map_count=262144
   ```

3. **Check Elasticsearch logs**:
   ```bash
   docker-compose logs elasticsearch
   ```

4. **Disable security features for development**:
   In `docker-compose.yml`:
   ```yaml
   environment:
     - xpack.security.enabled=false
   ```

### Docker Compose Version Issues

**Problem**: `docker-compose` command not found or version mismatch.

**Solutions**:

1. **Use Docker Compose V2**:
   ```bash
   # Instead of docker-compose, use:
   docker compose up -d
   ```

2. **Update Docker Desktop** to latest version.

3. **Install Docker Compose**:
   ```bash
   # Linux
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

---

## Database Issues

### Migration Fails

**Problem**: `pnpm db:migrate` fails with errors.

**Solutions**:

1. **Ensure PostgreSQL is running**:
   ```bash
   docker ps | grep postgres
   ```

2. **Wait for PostgreSQL to be ready**:
   ```bash
   # Wait 30-60 seconds after starting Docker
   sleep 60
   pnpm db:migrate
   ```

3. **Check database connection**:
   ```bash
   docker exec -it jobpilot-postgres psql -U postgres -l
   ```

4. **Verify environment variables**:
   ```bash
   # Check .env file
   cat .env | grep DATABASE_URL
   ```

5. **Reset database** (⚠️ This will delete all data):
   ```bash
   docker exec -it jobpilot-postgres psql -U postgres -c "DROP DATABASE IF EXISTS jobpilot;"
   docker exec -it jobpilot-postgres psql -U postgres -c "CREATE DATABASE jobpilot;"
   pnpm db:migrate
   ```

6. **Check migration files**:
   ```bash
   # Ensure migration files exist
   ls -la services/*/src/migrations/
   ```

### Cannot Connect to Database

**Problem**: Services cannot connect to PostgreSQL.

**Solutions**:

1. **Verify connection string**:
   ```bash
   # Should match Docker container settings
   DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobpilot
   ```

2. **Check if port is exposed**:
   ```bash
   docker ps | grep postgres
   # Should show 0.0.0.0:5434->5432/tcp
   ```

3. **Test connection from host**:
   ```bash
   # Using psql
   psql postgresql://postgres:postgres@localhost:5434/jobpilot -c "SELECT 1;"

   # Using Docker
   docker exec -it jobpilot-postgres psql -U postgres -d jobpilot
   ```

4. **Check firewall settings** (Windows):
   - Ensure port 5434 is allowed through Windows Firewall

### Database Permission Errors

**Problem**: Permission denied errors when accessing database.

**Solutions**:

1. **Check user permissions**:
   ```sql
   -- Connect as postgres user
   docker exec -it jobpilot-postgres psql -U postgres

   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE jobpilot TO postgres;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
   ```

2. **Reset postgres password**:
   ```bash
   docker exec -it jobpilot-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
   ```

---

## Service Issues

### Service Won't Start

**Problem**: Microservice fails to start or crashes immediately.

**Solutions**:

1. **Check service logs**:
   ```bash
   cd services/<service-name>
   pnpm dev
   # Review error messages
   ```

2. **Verify environment variables**:
   ```bash
   # Ensure .env file exists
   ls -la .env

   # Check required variables
   cat .env | grep -E 'DATABASE_URL|REDIS_URL|JWT_SECRET'
   ```

3. **Check port conflicts**:
   ```bash
   # Windows
   netstat -ano | findstr :8001

   # macOS/Linux
   lsof -i :8001
   ```

4. **Install service dependencies**:
   ```bash
   cd services/<service-name>
   pnpm install
   ```

5. **Check for TypeScript errors**:
   ```bash
   cd services/<service-name>
   pnpm type-check
   ```

### AI Service Won't Start

**Problem**: Python AI service fails to start.

**Solutions**:

1. **Activate virtual environment**:
   ```bash
   cd services/ai-service

   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Check Python version**:
   ```bash
   python --version  # Should be 3.11+
   ```

4. **Verify OpenAI API key**:
   ```bash
   # Check .env file
   cat .env | grep OPENAI_API_KEY
   ```

5. **Run in debug mode**:
   ```bash
   python src/main.py --debug
   ```

### Service Health Check Fails

**Problem**: Service health endpoint returns errors.

**Solutions**:

1. **Check if service is running**:
   ```bash
   curl http://localhost:8001/health
   ```

2. **Verify database connection**:
   ```bash
   # Most health checks verify database connectivity
   docker ps | grep postgres
   ```

3. **Check service logs**:
   ```bash
   cd services/<service-name>
   pnpm dev
   ```

4. **Restart service**:
   ```bash
   # Kill the service and restart
   pkill -f "node.*<service-name>"
   cd services/<service-name>
   pnpm dev
   ```

---

## API Errors

### 401 Unauthorized

**Problem**: API requests return 401 Unauthorized.

**Solutions**:

1. **Ensure token is valid**:
   ```bash
   # Login to get fresh token
   curl -X POST http://localhost:8001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

2. **Check Authorization header format**:
   ```bash
   # Correct format:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Verify JWT_SECRET matches** across services:
   ```bash
   cat .env | grep JWT_SECRET
   ```

4. **Check token expiration**:
   - Access tokens expire in 15 minutes
   - Use refresh token to get new access token

### 403 Forbidden

**Problem**: API requests return 403 Forbidden.

**Solutions**:

1. **Check user permissions**:
   - Verify user has required role/permissions
   - Some endpoints require specific subscription tiers

2. **Verify resource ownership**:
   - Ensure user owns the resource they're trying to access

### 404 Not Found

**Problem**: API requests return 404 Not Found.

**Solutions**:

1. **Check endpoint URL**:
   ```bash
   # Ensure correct base URL and version
   http://localhost:8001/api/v1/auth/login  # Correct
   http://localhost:8001/auth/login         # Wrong (missing /api/v1)
   ```

2. **Verify service is running**:
   ```bash
   curl http://localhost:8001/health
   ```

3. **Check resource exists**:
   ```bash
   # Verify ID is correct
   curl http://localhost:8003/api/v1/resumes/:id
   ```

### 500 Internal Server Error

**Problem**: API requests return 500 errors.

**Solutions**:

1. **Check service logs**:
   ```bash
   cd services/<service-name>
   pnpm dev
   # Review error stack trace
   ```

2. **Verify database connection**:
   ```bash
   docker ps | grep postgres
   ```

3. **Check external service connectivity**:
   ```bash
   # Test OpenAI API
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

4. **Review error logs**:
   ```bash
   # Check service-specific logs
   tail -f logs/<service-name>.log
   ```

### 429 Rate Limit Exceeded

**Problem**: Too many requests error.

**Solutions**:

1. **Wait for rate limit window to reset**:
   - Check `X-RateLimit-Reset` header

2. **Implement exponential backoff**:
   ```javascript
   async function retryWithBackoff(fn, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.status === 429 && i < retries - 1) {
           await new Promise(r => setTimeout(r, 2 ** i * 1000));
           continue;
         }
         throw error;
       }
     }
   }
   ```

3. **Upgrade subscription tier** for higher rate limits.

---

## Authentication Issues

### Login Fails

**Problem**: Cannot login with valid credentials.

**Solutions**:

1. **Verify credentials**:
   ```bash
   # Check if user exists
   docker exec -it jobpilot-postgres psql -U postgres -d jobpilot -c "SELECT * FROM users WHERE email='user@example.com';"
   ```

2. **Reset password**:
   ```bash
   curl -X POST http://localhost:8001/api/v1/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com"}'
   ```

3. **Check password hashing**:
   - Ensure bcrypt is working correctly
   - Verify JWT_SECRET is set

4. **Clear session/cookies**:
   - Clear browser cache and cookies
   - Try in incognito mode

### JWT Token Invalid

**Problem**: Token verification fails.

**Solutions**:

1. **Ensure JWT_SECRET is consistent**:
   ```bash
   # All services must use the same JWT_SECRET
   grep -r "JWT_SECRET" .env services/*/. env
   ```

2. **Check token expiration**:
   ```javascript
   // Decode JWT to check expiration
   const decoded = jwt.decode(token);
   console.log(new Date(decoded.exp * 1000));
   ```

3. **Refresh token**:
   ```bash
   curl -X POST http://localhost:8001/api/v1/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"your-refresh-token"}'
   ```

### OAuth Login Fails

**Problem**: Social login (Google, LinkedIn) fails.

**Solutions**:

1. **Verify OAuth credentials**:
   ```bash
   cat .env | grep -E 'GOOGLE_CLIENT_ID|LINKEDIN_CLIENT_ID'
   ```

2. **Check redirect URIs**:
   - Ensure redirect URI matches OAuth provider settings
   - Example: `http://localhost:3000/auth/callback/google`

3. **Enable OAuth in provider console**:
   - Google: https://console.cloud.google.com/
   - LinkedIn: https://www.linkedin.com/developers/

4. **Check CORS settings**:
   - Ensure frontend URL is in CORS_ORIGINS

---

## Build Errors

### TypeScript Compilation Fails

**Problem**: `pnpm build` fails with TypeScript errors.

**Solutions**:

1. **Run type check**:
   ```bash
   pnpm type-check
   ```

2. **Fix import errors**:
   ```typescript
   // Use absolute imports
   import { User } from '@/types/user';

   // Instead of relative imports
   import { User } from '../../../types/user';
   ```

3. **Update TypeScript**:
   ```bash
   pnpm add -D typescript@latest
   ```

4. **Clean build cache**:
   ```bash
   pnpm clean
   pnpm install
   pnpm build
   ```

### Next.js Build Fails

**Problem**: Web app build fails.

**Solutions**:

1. **Clear Next.js cache**:
   ```bash
   cd apps/web
   rm -rf .next
   pnpm build
   ```

2. **Check environment variables**:
   ```bash
   # Ensure NEXT_PUBLIC_* variables are set
   cat .env | grep NEXT_PUBLIC
   ```

3. **Increase Node memory**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=8192"
   pnpm build
   ```

4. **Check for circular dependencies**:
   ```bash
   npx madge --circular apps/web/src
   ```

### Turbo Build Fails

**Problem**: `turbo run build` fails.

**Solutions**:

1. **Clear Turbo cache**:
   ```bash
   rm -rf .turbo
   turbo run build --force
   ```

2. **Build services individually**:
   ```bash
   cd services/auth-service
   pnpm build
   ```

3. **Check turbo.json configuration**:
   - Ensure dependencies are correctly defined

---

## Performance Issues

### Slow API Responses

**Problem**: API endpoints are slow to respond.

**Solutions**:

1. **Check database query performance**:
   ```sql
   -- Enable query logging
   SET log_statement = 'all';

   -- Analyze slow queries
   EXPLAIN ANALYZE SELECT * FROM jobs WHERE ...;
   ```

2. **Add database indexes**:
   ```sql
   CREATE INDEX idx_jobs_location ON jobs(location);
   CREATE INDEX idx_jobs_title ON jobs(title);
   ```

3. **Implement caching**:
   ```typescript
   // Use Redis for frequently accessed data
   const cachedData = await redis.get(`jobs:${id}`);
   if (cachedData) return JSON.parse(cachedData);
   ```

4. **Enable response compression**:
   ```typescript
   // In NestJS
   app.use(compression());
   ```

5. **Optimize database connections**:
   - Use connection pooling
   - Set appropriate pool size (10-20 connections)

### High Memory Usage

**Problem**: Service consuming too much memory.

**Solutions**:

1. **Check for memory leaks**:
   ```bash
   node --inspect services/auth-service/dist/main.js
   # Use Chrome DevTools to profile memory
   ```

2. **Implement pagination**:
   - Don't load large datasets into memory
   - Use cursor-based pagination

3. **Clear caches periodically**:
   ```typescript
   // Set TTL on Redis keys
   await redis.setex(key, 3600, value);
   ```

4. **Limit concurrent operations**:
   ```typescript
   import pLimit from 'p-limit';
   const limit = pLimit(10);
   ```

### Database Connection Pool Exhausted

**Problem**: "Too many connections" error.

**Solutions**:

1. **Increase pool size**:
   ```typescript
   {
     type: 'postgres',
     poolSize: 20, // Increase from default
   }
   ```

2. **Close connections properly**:
   ```typescript
   // Always close query runners
   const queryRunner = connection.createQueryRunner();
   try {
     // ... operations
   } finally {
     await queryRunner.release();
   }
   ```

3. **Use PgBouncer**:
   - Implement connection pooling middleware

---

## Network Issues

### Cannot Connect to External APIs

**Problem**: Requests to LinkedIn, Indeed, OpenAI fail.

**Solutions**:

1. **Check API keys**:
   ```bash
   cat .env | grep -E 'OPENAI_API_KEY|LINKEDIN_API_KEY'
   ```

2. **Verify network connectivity**:
   ```bash
   curl https://api.openai.com/v1/models
   ```

3. **Check firewall/proxy settings**:
   - Ensure outbound connections are allowed

4. **Test with curl**:
   ```bash
   curl -X POST https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4","messages":[{"role":"user","content":"test"}]}'
   ```

### CORS Errors

**Problem**: Frontend can't make requests due to CORS.

**Solutions**:

1. **Add frontend URL to CORS_ORIGINS**:
   ```bash
   # In .env
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

2. **Configure CORS in services**:
   ```typescript
   app.enableCors({
     origin: process.env.CORS_ORIGINS.split(','),
     credentials: true,
   });
   ```

3. **Check browser console** for specific CORS error.

### WebSocket Connection Fails

**Problem**: Real-time updates not working.

**Solutions**:

1. **Verify WebSocket URL**:
   ```javascript
   const ws = new WebSocket('ws://localhost:3001/ws');
   ```

2. **Check proxy configuration** (if using NGINX):
   ```nginx
   location /ws {
     proxy_pass http://backend;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

3. **Test WebSocket connection**:
   ```bash
   npm install -g wscat
   wscat -c ws://localhost:3001/ws
   ```

---

## Getting Help

If none of these solutions work:

1. **Search GitHub Issues**: https://github.com/your-org/Job-Apply-Platform/issues
2. **Check Service Logs**: Review detailed logs for error messages
3. **Developer Forum**: https://community.jobpilot.com
4. **Email Support**: dev@jobpilot.ai

When reporting issues, include:
- Error messages (full stack trace)
- Environment details (OS, Node version, Docker version)
- Steps to reproduce
- Relevant configuration files (with secrets removed)
- Service logs

---

## Additional Resources

- [Getting Started Guide](getting-started.md)
- [Architecture Documentation](architecture.md)
- [API Reference](api-reference.md)
- [Development Guide](development/workflow.md)
- [Deployment Guide](deployment/README.md)
