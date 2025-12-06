# Setup & Troubleshooting Guide

Complete guide for setting up and troubleshooting the Notification Service.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Email Configuration](#email-configuration)
6. [Running the Service](#running-the-service)
7. [Verification](#verification)
8. [Common Issues](#common-issues)
9. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18.x or higher
   ```

2. **npm** (v9 or higher)
   ```bash
   npm --version
   ```

3. **PostgreSQL** (v14 or higher)
   ```bash
   postgres --version
   ```

### Optional but Recommended
- Docker & Docker Compose (for containerized setup)
- Git (for version control)
- Postman or similar API testing tool

---

## Installation

### Step 1: Navigate to Project Directory

```bash
cd services/notification-service
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- NestJS framework
- TypeORM
- PostgreSQL driver
- Nodemailer
- Swagger
- And all dev dependencies

**Expected output:**
```
added 500+ packages in 30s
```

---

## Configuration

### Step 1: Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Or on Windows
copy .env.example .env
```

### Step 2: Edit .env File

Open `.env` in your editor and configure:

```bash
# Server Configuration
PORT=8007                           # Service port
NODE_ENV=development                # development | production | test

# Database Configuration
DB_HOST=localhost                   # Database host
DB_PORT=5432                        # PostgreSQL port
DB_USERNAME=postgres                # Database user
DB_PASSWORD=your_password           # Database password
DB_DATABASE=notification_service    # Database name

# Email Configuration
SMTP_HOST=smtp.gmail.com           # SMTP server
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                  # true for 465, false for other ports
SMTP_USER=your-email@gmail.com     # Your email
SMTP_PASSWORD=your-app-password    # App password (not regular password!)
EMAIL_FROM=noreply@jobapply.com    # From address
EMAIL_FROM_NAME=Job Apply Platform # From name

# Frontend URL
FRONTEND_URL=http://localhost:3000  # Your frontend URL
```

---

## Database Setup

### Option 1: Using PostgreSQL Directly

#### Install PostgreSQL

**On macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-14
sudo systemctl start postgresql
```

**On Windows:**
Download from https://www.postgresql.org/download/windows/

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE notification_service;

# Create user (if needed)
CREATE USER notif_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE notification_service TO notif_user;

# Exit
\q
```

#### Verify Connection

```bash
psql -U postgres -d notification_service -c "SELECT version();"
```

### Option 2: Using Docker

```bash
# Start PostgreSQL container
docker run -d \
  --name notification-db \
  -e POSTGRES_DB=notification_service \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:14-alpine

# Verify it's running
docker ps | grep notification-db
```

### Option 3: Using Docker Compose

```bash
# Start PostgreSQL using the provided docker-compose.yml
docker-compose up -d postgres

# Check logs
docker-compose logs postgres
```

---

## Email Configuration

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Update .env**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # The app password
   ```

### Other Email Providers

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

---

## Running the Service

### Development Mode (with hot reload)

```bash
npm run start:dev
```

**Expected output:**
```
[Nest] 12345  - 12/04/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 12/04/2025, 10:30:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 12/04/2025, 10:30:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 12345  - 12/04/2025, 10:30:01 AM     LOG [InstanceLoader] NotificationsModule dependencies initialized
[Nest] 12345  - 12/04/2025, 10:30:01 AM     LOG [InstanceLoader] EmailModule dependencies initialized
[Nest] 12345  - 12/04/2025, 10:30:01 AM     LOG [EmailService] Email service initialized
[Nest] 12345  - 12/04/2025, 10:30:01 AM     LOG [RoutesResolver] NotificationsController {/notifications}
[Nest] 12345  - 12/04/2025, 10:30:01 AM     LOG [RouterExplorer] Mapped {/notifications/email, POST}
[Nest] 12345  - 12/04/2025, 10:30:01 AM     LOG [RouterExplorer] Mapped {/notifications/push, POST}
[Nest] 12345  - 12/04/2025, 10:30:01 AM     LOG [NestApplication] Nest application successfully started
Notification Service is running on: http://localhost:8007
Swagger documentation available at: http://localhost:8007/api/docs
```

### Production Mode

```bash
# Build the application
npm run build

# Start in production mode
NODE_ENV=production npm run start:prod
```

### Using Docker

```bash
# Build image
docker build -t notification-service .

# Run container
docker run -d \
  --name notification-service \
  -p 8007:8007 \
  --env-file .env \
  notification-service
```

### Using Docker Compose

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Verification

### 1. Check Service Health

```bash
curl http://localhost:8007/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T10:30:00.000Z",
  "service": "notification-service",
  "version": "1.0.0"
}
```

### 2. Check Swagger Documentation

Open in browser:
```
http://localhost:8007/api/docs
```

You should see the interactive API documentation.

### 3. Test Database Connection

The service logs will show:
```
[TypeOrmModule] Successfully connected to database
```

### 4. Test Email Service

```bash
curl -X POST http://localhost:8007/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello!</h1><p>This is a test.</p>",
    "userId": "test-user-123"
  }'
```

Check your inbox for the test email.

### 5. Test Notification Creation

```bash
curl -X POST http://localhost:8007/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "type": "in_app",
    "title": "Test Notification",
    "message": "This is a test notification"
  }'
```

### 6. Verify Database Tables

```bash
# Connect to database
psql -U postgres -d notification_service

# List tables
\dt

# You should see:
#  notifications

# Check schema
\d notifications

# Exit
\q
```

---

## Common Issues

### Issue 1: Cannot Connect to Database

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   # On macOS/Linux
   sudo systemctl status postgresql
   # or
   pg_isready

   # On Windows
   # Check Services app for PostgreSQL service
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -l | grep notification_service
   ```

3. **Check credentials in .env:**
   - Ensure DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD are correct

4. **Check firewall:**
   ```bash
   # Allow PostgreSQL port
   sudo ufw allow 5432/tcp
   ```

### Issue 2: Email Not Sending

**Error:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions:**

1. **For Gmail - Use App Password:**
   - Regular password won't work
   - Must enable 2FA first
   - Generate app password at https://myaccount.google.com/apppasswords

2. **Check SMTP settings:**
   ```bash
   # Gmail
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

3. **Test SMTP connection manually:**
   ```bash
   telnet smtp.gmail.com 587
   ```

4. **Check email service logs:**
   - Look for detailed error messages in console

### Issue 3: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8007
```

**Solutions:**

1. **Find process using port:**
   ```bash
   # On macOS/Linux
   lsof -i :8007

   # On Windows
   netstat -ano | findstr :8007
   ```

2. **Kill the process:**
   ```bash
   # On macOS/Linux
   kill -9 <PID>

   # On Windows
   taskkill /PID <PID> /F
   ```

3. **Or change port in .env:**
   ```bash
   PORT=8008
   ```

### Issue 4: TypeORM Synchronization Issues

**Error:**
```
QueryFailedError: column "user_id" does not exist
```

**Solutions:**

1. **Enable synchronize in development:**
   - It's already enabled in `app.module.ts` for development
   - Check `NODE_ENV` is set to `development`

2. **Manually drop and recreate database:**
   ```bash
   psql -U postgres -c "DROP DATABASE notification_service;"
   psql -U postgres -c "CREATE DATABASE notification_service;"
   ```

3. **Clear dist folder and rebuild:**
   ```bash
   rm -rf dist
   npm run build
   ```

### Issue 5: Module Import Errors

**Error:**
```
Cannot find module '@nestjs/common'
```

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   npm install
   ```

### Issue 6: Docker Container Won't Start

**Error:**
```
Error: Container exited with code 1
```

**Solutions:**

1. **Check container logs:**
   ```bash
   docker logs notification-service
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose config
   ```

3. **Rebuild image:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

---

## Production Deployment

### Best Practices

1. **Use Environment Variables:**
   - Never commit `.env` file
   - Use secrets management (AWS Secrets Manager, Vault, etc.)

2. **Database:**
   - Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
   - Enable SSL connections
   - Set up automated backups

3. **Email Service:**
   - Use dedicated service (SendGrid, AWS SES, Mailgun)
   - Implement rate limiting
   - Set up bounce handling

4. **Monitoring:**
   - Add logging service (CloudWatch, Datadog)
   - Set up health check monitoring
   - Configure alerts

5. **Security:**
   - Use HTTPS only
   - Implement authentication (JWT, API keys)
   - Enable rate limiting
   - Use CORS appropriately

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production database
- [ ] Configure production SMTP
- [ ] Disable TypeORM synchronize
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up backups
- [ ] Test all endpoints
- [ ] Load testing
- [ ] Security audit
- [ ] Document API for team

### Example Production .env

```bash
NODE_ENV=production
PORT=8007

DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=production_user
DB_PASSWORD=strong_secure_password
DB_DATABASE=notification_service

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your_production_api_key

EMAIL_FROM=notifications@yourdomain.com
EMAIL_FROM_NAME=Your App Name
FRONTEND_URL=https://yourdomain.com
```

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Nodemailer Documentation](https://nodemailer.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## Getting Help

If you encounter issues not covered here:

1. Check the service logs for detailed error messages
2. Review the README.md for general documentation
3. Check API_EXAMPLES.md for usage examples
4. Verify all environment variables are set correctly
5. Test each component individually (DB, SMTP, etc.)

## Support

For additional support:
- Open an issue on the project repository
- Check existing issues for similar problems
- Review the project documentation
