# Auto-Apply Service - Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites Check
```bash
# Check Node.js version (requires 18+)
node --version

# Check PostgreSQL (requires 13+)
psql --version

# Check Redis (requires 6+)
redis-cli --version
```

### 2. Installation
```bash
cd services/auto-apply-service

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

Minimum required variables:
```env
NODE_ENV=development
PORT=8005

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=auto_apply_db

REDIS_HOST=localhost
REDIS_PORT=6379

BROWSER_HEADLESS=true
LOG_LEVEL=info
```

### 4. Database Setup
```bash
# Create database
createdb auto_apply_db

# Run migrations
npm run migration:run
```

### 5. Start Service
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Verify Installation
```bash
# Health check
curl http://localhost:8005/api/v1/health

# Should return: {"status":"ok",...}
```

## Quick API Test

### 1. Configure Auto-Apply Settings
```bash
curl -X PUT http://localhost:8005/api/v1/auto-apply/settings \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "enabled": true,
    "resumeId": "resume-uuid",
    "maxApplicationsPerDay": 10,
    "filters": {
      "jobTitle": ["Software Engineer"],
      "location": ["Remote"]
    }
  }'
```

### 2. Start Auto-Apply
```bash
curl -X POST http://localhost:8005/api/v1/auto-apply/start \
  -H "x-user-id: test-user-123"
```

### 3. Check Status
```bash
curl http://localhost:8005/api/v1/auto-apply/status \
  -H "x-user-id: test-user-123"
```

### 4. View Queue Stats
```bash
curl http://localhost:8005/api/v1/auto-apply/queue/stats
```

## Common Commands

### Development
```bash
# Start with auto-reload
npm run start:dev

# Run with visible browser (for debugging)
BROWSER_HEADLESS=false npm run start:dev

# Enable debug logging
LOG_LEVEL=debug npm run start:dev
```

### Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Database
```bash
# Generate migration
npm run migration:generate -- AddNewColumn

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Queue Management
```bash
# View queue stats
curl http://localhost:8005/api/v1/auto-apply/queue/stats

# Pause queue
curl -X POST http://localhost:8005/api/v1/auto-apply/queue/pause

# Resume queue
curl -X POST http://localhost:8005/api/v1/auto-apply/queue/resume

# Clear queue
curl -X POST http://localhost:8005/api/v1/auto-apply/queue/clear
```

## Supported ATS Platforms

| Platform | URL Pattern | Status |
|----------|-------------|--------|
| Workday | `*.myworkdayjobs.com` | ✅ |
| Greenhouse | `*.greenhouse.io` | ✅ |
| Lever | `*.lever.co` | ✅ |
| iCIMS | `*.icims.com` | ✅ |
| Taleo | `*.taleo.net` | ✅ |
| SmartRecruiters | `*.smartrecruiters.com` | ✅ |

## Project Structure

```
src/
├── modules/
│   ├── adapters/          # ATS platform adapters
│   ├── applications/      # Application management
│   ├── browser/           # Playwright automation
│   ├── form-mapping/      # Form field detection
│   └── queue/             # Job queue processing
├── config/                # Configuration files
├── migrations/            # Database migrations
└── main.ts               # Application entry
```

## Troubleshooting

### Issue: Browser won't launch
```bash
# Reinstall browsers
npx playwright install chromium --force

# Check installation
npx playwright install --dry-run
```

### Issue: Database connection failed
```bash
# Test connection
psql -U postgres -d auto_apply_db -c "SELECT 1"

# Check environment variables
echo $DB_HOST $DB_PORT $DB_DATABASE
```

### Issue: Redis connection failed
```bash
# Test Redis
redis-cli ping

# Check Redis logs
redis-cli INFO server
```

### Issue: Queue not processing jobs
```bash
# Check queue stats
curl http://localhost:8005/api/v1/auto-apply/queue/stats

# Check failed jobs
curl http://localhost:8005/api/v1/auto-apply/queue/failed

# Resume queue if paused
curl -X POST http://localhost:8005/api/v1/auto-apply/queue/resume
```

### Issue: Form fields not being filled
```bash
# Enable debug mode
LOG_LEVEL=debug BROWSER_HEADLESS=false npm run start:dev

# Check screenshots directory
ls -la screenshots/
```

## Environment Variables Quick Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8005 | Service port |
| `NODE_ENV` | development | Environment |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 5432 | Database port |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `BROWSER_HEADLESS` | true | Run browser headless |
| `LOG_LEVEL` | info | Logging level |

## API Endpoints Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/applications` | List applications |
| GET | `/applications/analytics` | Get analytics |
| POST | `/applications/manual` | Log manual app |
| GET | `/auto-apply/settings` | Get settings |
| PUT | `/auto-apply/settings` | Update settings |
| POST | `/auto-apply/start` | Start auto-apply |
| POST | `/auto-apply/stop` | Stop auto-apply |
| GET | `/auto-apply/status` | Get status |
| GET | `/auto-apply/queue/stats` | Queue statistics |

## Next Steps

1. ✅ Service is running
2. ⏭️ Run integration tests
3. ⏭️ Connect to frontend
4. ⏭️ Deploy to staging
5. ⏭️ Monitor and optimize

## Documentation

- **Full Documentation**: See `README.md`
- **API Reference**: See `API_REFERENCE.md`
- **Implementation Guide**: See `IMPLEMENTATION_COMPLETE.md`
- **Completion Summary**: See `COMPLETION_SUMMARY.md`

## Support

- Issues: Report on GitHub
- Questions: Check documentation
- Bugs: Include logs and screenshots

---

**Ready to go!** The service is fully functional and ready for testing. 🚀
