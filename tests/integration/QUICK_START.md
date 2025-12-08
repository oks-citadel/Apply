# Integration Tests Quick Start Guide

This guide will help you get integration tests running in under 5 minutes.

## Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose installed
- Git repository cloned

## Quick Setup

### 1. Start Test Infrastructure

```bash
# From project root
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready (~60 seconds)
```

### 2. Install Dependencies

```bash
cd tests/integration
npm install
```

### 3. Run Tests

```bash
# Run all integration tests
npm test

# Or run specific test suite
npm run test:auth-user
npm run test:job-ai
npm run test:resume-ai
npm run test:auto-apply
npm run test:notification
```

## What Gets Tested?

### Auth → User Integration
- User registration creates profile
- Login provides access to user data
- Token validation between services

### Job → AI Integration
- AI matches jobs to resume
- Job recommendations
- Scoring and explanations

### Resume → AI Integration
- Resume optimization
- ATS compatibility analysis
- Skill gap identification

### Auto-Apply → Job Integration
- Fetch job details
- Submit applications
- Track application status

### Notification Integration
- Send notifications via multiple channels
- Respect user preferences
- Track delivery status

## Common Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Clean everything
npm run docker:clean

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### Tests Failing?

1. **Check services are running:**
   ```bash
   docker-compose -f docker-compose.test.yml ps
   ```

2. **Check service health:**
   ```bash
   curl http://localhost:3001/api/v1/health  # Auth service
   curl http://localhost:8002/api/v1/health  # User service
   curl http://localhost:3003/api/v1/health  # Job service
   ```

3. **View service logs:**
   ```bash
   docker-compose -f docker-compose.test.yml logs auth-service-test
   ```

4. **Reset everything:**
   ```bash
   npm run docker:clean
   npm run docker:up
   ```

### Port Conflicts?

If ports are already in use, edit `docker-compose.test.yml` to use different ports:

```yaml
services:
  postgres-test:
    ports:
      - '5434:5432'  # Change 5433 to 5434
```

Then update `.env.test` accordingly.

## Test Structure Overview

```
tests/integration/
├── fixtures/              # Test data
├── mocks/                 # Service mocks
├── utils/                 # Test utilities
├── *.integration.test.ts  # Test files
└── setup.ts              # Global setup
```

## Writing Your First Test

Create `tests/integration/my-feature.integration.test.ts`:

```typescript
import { AxiosInstance } from 'axios';
import { TestServiceManager } from './utils/test-service-manager';

describe('My Feature Integration Tests', () => {
  let serviceManager: TestServiceManager;
  let myService: AxiosInstance;

  beforeAll(async () => {
    serviceManager = (global as any).testServices;
    myService = serviceManager.getService('my-service');
    await serviceManager.waitForService('my-service');
  });

  it('should work correctly', async () => {
    const response = await myService.get('/api/endpoint');
    expect(response.status).toBe(200);
  });
});
```

Run your test:
```bash
npm test -- my-feature.integration.test.ts
```

## Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Explore existing test files for examples
3. Check service-specific documentation in `services/*/README.md`
4. Review CI/CD workflow in `.github/workflows/integration-tests.yml`

## Need Help?

- Check service logs: `npm run docker:logs`
- Enable debug mode: `TEST_DEBUG=true npm test`
- Review [README.md](./README.md) for detailed troubleshooting
- Create an issue in the repository

## Success Criteria

Tests are working correctly when:
- ✅ All services start without errors
- ✅ Health checks pass for all services
- ✅ Tests complete without timeouts
- ✅ No unexpected errors in logs
- ✅ Test results show expected behavior

Happy testing! 🚀
