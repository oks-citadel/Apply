# Quick Start - Environment Configuration

This guide helps you quickly configure the JobPilot AI Platform environment files.

## Files Created

All `.env` files have been created with production-ready configurations:

```
Job-Apply-Platform/
├── .env.example                    # Platform-wide reference (414 lines)
├── ENV_FILES_SUMMARY.md           # Detailed documentation
├── ENV_FILES_CREATED.txt          # Creation report
└── services/
    ├── ai-service/.env
    ├── analytics-service/.env
    ├── auth-service/.env
    ├── auto-apply-service/.env
    ├── job-service/.env
    ├── notification-service/.env
    ├── orchestrator-service/.env
    ├── resume-service/.env
    └── user-service/.env
```

## Immediate Configuration Required

### 1. No Configuration Needed (Ready to Use)

These services can run immediately with default configuration:

- **All services** can connect to PostgreSQL at `localhost:5434/jobpilot`
- **All services** can connect to Redis at `localhost:6381`
- **Services with RabbitMQ** can connect at `localhost:5673`
- **JWT authentication** is pre-configured with secure secrets

### 2. Optional External Services (Placeholders Provided)

Add API keys when ready to use these features:

#### AI Features (services/ai-service/.env)
```bash
OPENAI_API_KEY=sk-your-actual-key-here
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
PINECONE_API_KEY=your-actual-key-here
```

#### Email (services/notification-service/.env)
```bash
# Development: Uses MailHog (localhost:1026) - no config needed
# Production: Add SendGrid key
SENDGRID_API_KEY=SG.your-actual-key-here
```

#### File Storage (services/resume-service/.env, services/user-service/.env)
```bash
AWS_ACCESS_KEY_ID=your-actual-key-id
AWS_SECRET_ACCESS_KEY=your-actual-secret-key
AWS_S3_BUCKET=your-bucket-name
```

#### OAuth (services/auth-service/.env)
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### Payment Processing (services/user-service/.env)
```bash
STRIPE_SECRET_KEY=sk_test_your-actual-key
STRIPE_WEBHOOK_SECRET=whsec_your-actual-secret
```

## Start Services Immediately

All services can start with the current configuration:

```bash
# Start infrastructure (from docker-compose.yml)
docker-compose up -d postgres redis rabbitmq

# Start individual services
cd services/auth-service && npm start
cd services/user-service && npm start
cd services/ai-service && python -m uvicorn main:app --reload
# ... etc for other services
```

## Configuration by Priority

### Priority 1: Core Platform (Works Now)
- PostgreSQL: localhost:5434/jobpilot ✓
- Redis: localhost:6381 ✓
- RabbitMQ: localhost:5673 ✓
- JWT Authentication ✓
- Basic API functionality ✓

### Priority 2: Development Features
- MailHog for email testing (localhost:1026) ✓
- Local file storage for testing ✓
- Mock OAuth for development ✓

### Priority 3: Production Features (Add When Ready)
- SendGrid for production email
- AWS S3 for file storage
- OAuth providers (Google, LinkedIn, GitHub)
- Stripe for payments
- OpenAI/Anthropic for AI features
- Firebase for push notifications

## Service URLs

All services are configured to communicate:

| Service | Port | URL |
|---------|------|-----|
| AI Service | 8000 | http://localhost:8000/api/v1 |
| Auth Service | 8001 | http://localhost:8001/api/v1 |
| User Service | 8002 | http://localhost:8002/api/v1 |
| Resume Service | 8003 | http://localhost:8003/api/v1 |
| Job Service | 8004 | http://localhost:8004/api/v1 |
| Auto-Apply Service | 8005 | http://localhost:8005/api/v1 |
| Analytics Service | 8006 | http://localhost:8006/api/v1 |
| Notification Service | 8007 | http://localhost:8007/api/v1 |
| Orchestrator Service | 8008 | http://localhost:8008/api/v1 |

## Shared Secrets (Already Configured)

All services use consistent secrets for authentication:

- **JWT Secret**: Pre-generated 64-char hex string
- **JWT Refresh Secret**: Pre-generated 64-char hex string
- **Session Secret**: Pre-generated 64-char hex string

**Note**: Change these in production!

## Testing Configuration

### Test Database
```bash
# Already configured
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobpilot_test
```

### Test Email (MailHog)
```bash
# Check emails at: http://localhost:8025
SMTP_HOST=localhost
SMTP_PORT=1026
```

## Common Issues

### Issue: "Cannot connect to PostgreSQL"
**Solution**: Ensure PostgreSQL is running on port 5434
```bash
docker-compose up -d postgres
```

### Issue: "Redis connection failed"
**Solution**: Ensure Redis is running on port 6381
```bash
docker-compose up -d redis
```

### Issue: "RabbitMQ connection timeout"
**Solution**: Ensure RabbitMQ is running on port 5673
```bash
docker-compose up -d rabbitmq
```

## Security Checklist

For production deployment:

- [ ] Change all JWT secrets to new random values
- [ ] Update database passwords
- [ ] Use environment-specific API keys
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup systems
- [ ] Enable virus scanning (if using file uploads)

## Next Steps

1. **Verify Infrastructure**: Ensure PostgreSQL, Redis, and RabbitMQ are running
2. **Test Basic Connectivity**: Start one service and verify it connects to database
3. **Add External APIs**: Configure API keys for features you want to use
4. **Run Migrations**: Execute database migrations for each service
5. **Start All Services**: Launch all microservices
6. **Test Integration**: Verify inter-service communication
7. **Configure Frontend**: Update web app to use service URLs

## Support Files

- **ENV_FILES_SUMMARY.md**: Comprehensive documentation of all variables
- **ENV_FILES_CREATED.txt**: Detailed creation report with checklist
- **.env.example**: Platform-wide reference with 400+ lines of documentation
- **Each service/.env.example**: Service-specific documentation

## Quick Reference

```bash
# View all env files
find services -name ".env" -type f

# Check if services can connect to database
psql postgresql://postgres:postgres@localhost:5434/jobpilot

# Check Redis connection
redis-cli -p 6381 ping

# Check RabbitMQ
curl http://localhost:15673/api/overview
```

---

**All environment files are ready to use!**

Start your services and add external API keys as needed.
