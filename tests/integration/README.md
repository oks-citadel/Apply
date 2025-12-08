# Integration Tests Documentation

## Overview

This directory contains comprehensive integration tests for the JobPilot microservices platform. These tests validate the communication and data flow between services, ensuring that the entire system works correctly as a cohesive unit.

## Table of Contents

- [Test Structure](#test-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Suites](#test-suites)
- [Test Infrastructure](#test-infrastructure)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Test Structure

```
tests/integration/
├── fixtures/           # Test data fixtures
│   ├── user.fixtures.ts
│   ├── job.fixtures.ts
│   ├── resume.fixtures.ts
│   └── notification.fixtures.ts
├── mocks/             # Service mocks
│   ├── auth-service.mock.ts
│   ├── ai-service.mock.ts
│   ├── job-service.mock.ts
│   └── notification-service.mock.ts
├── utils/             # Test utilities
│   ├── test-database.ts
│   ├── test-service-manager.ts
│   └── test-logger.ts
├── auth-user.integration.test.ts
├── job-ai.integration.test.ts
├── resume-ai.integration.test.ts
├── auto-apply-job.integration.test.ts
├── notification.integration.test.ts
├── jest.config.js
├── tsconfig.json
├── setup.ts
├── package.json
└── .env.test
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- Elasticsearch 8.11+

### Installation

1. Install dependencies:
```bash
cd tests/integration
npm install
```

2. Set up environment variables:
```bash
cp .env.test .env.test.local
# Edit .env.test.local with your configuration
```

3. Start test infrastructure:
```bash
npm run docker:up
```

## Running Tests

### Run All Integration Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Auth-User integration tests
npm run test:auth-user

# Job-AI integration tests
npm run test:job-ai

# Resume-AI integration tests
npm run test:resume-ai

# Auto-Apply integration tests
npm run test:auto-apply

# Notification integration tests
npm run test:notification
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Debug Mode

```bash
npm run test:debug
```

## Test Suites

### 1. Auth-User Integration Tests (`auth-user.integration.test.ts`)

Tests the integration between authentication service and user service.

**Key Scenarios:**
- User registration flow
- User login flow
- Profile creation after registration
- Token validation between services
- Profile updates
- Error handling

**Example:**
```typescript
it('should create user in both auth and user services on registration', async () => {
  const userData = createUserPayload();
  const registerResponse = await authService.post('/api/v1/auth/register', userData);

  expect(registerResponse.status).toBe(201);
  expect(registerResponse.data).toHaveProperty('accessToken');

  // Verify user profile was created
  const profileResponse = await userService.get(`/api/v1/profile/${user.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  expect(profileResponse.status).toBe(200);
});
```

### 2. Job-AI Integration Tests (`job-ai.integration.test.ts`)

Tests the integration between job service and AI service for job matching and recommendations.

**Key Scenarios:**
- Job matching with AI
- Job recommendations based on user profile
- Score calculation for job matches
- Bulk job analysis
- Match explanations
- Error handling for non-existent jobs

**Example:**
```typescript
it('should match jobs to user resume using AI', async () => {
  const jobResponse = await jobService.post('/api/v1/jobs', jobData);
  const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData);

  const matchResponse = await aiService.post('/api/ai/match/jobs', {
    resumeId: resume.id,
    jobIds: [job.id],
  });

  expect(matchResponse.status).toBe(200);
  expect(matchResponse.data.matches[0].score).toBeGreaterThan(0);
});
```

### 3. Resume-AI Integration Tests (`resume-ai.integration.test.ts`)

Tests the integration between resume service and AI service for resume optimization and analysis.

**Key Scenarios:**
- Resume content optimization
- ATS compatibility analysis
- Keyword identification
- Skill gap analysis
- Resume scoring
- Version comparison
- Batch resume analysis

**Example:**
```typescript
it('should optimize resume content using AI', async () => {
  const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData);

  const optimizeResponse = await aiService.post('/api/ai/optimize/resume', {
    resumeId: resume.id,
    targetRole: 'Software Engineer',
  });

  expect(optimizeResponse.data.score.after).toBeGreaterThan(
    optimizeResponse.data.score.before
  );
});
```

### 4. Auto-Apply-Job Integration Tests (`auto-apply-job.integration.test.ts`)

Tests the integration between auto-apply service and job service.

**Key Scenarios:**
- Job data fetching
- Application submission
- Application tracking
- Duplicate prevention
- Batch applications
- Campaign management
- Error handling

**Example:**
```typescript
it('should submit application to job', async () => {
  const jobResponse = await jobService.post('/api/v1/jobs', jobData);
  const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData);

  const applicationResponse = await autoApplyService.post('/api/v1/applications', {
    jobId: job.id,
    resumeId: resume.id,
  });

  expect(applicationResponse.status).toBe(201);
  expect(applicationResponse.data.status).toBe('submitted');
});
```

### 5. Notification Integration Tests (`notification.integration.test.ts`)

Tests notification service integration with all other services.

**Key Scenarios:**
- Welcome email on registration
- Job match notifications
- Application status updates
- Multi-channel notifications (email, push, in-app)
- Notification preferences
- Batch notifications
- Notification management (mark as read, delete)

**Example:**
```typescript
it('should send notification via multiple channels', async () => {
  const channels = ['email', 'push', 'in-app'];

  for (const channel of channels) {
    const response = await notificationService.post('/api/v1/notifications', {
      userId,
      channel,
      title: `Test ${channel} Notification`,
      message: 'Test message',
    });

    expect([200, 201, 202]).toContain(response.status);
  }
});
```

## Test Infrastructure

### Test Database Manager (`test-database.ts`)

Manages test database lifecycle and operations:
- Creates isolated test databases for each service
- Provides data source connections
- Cleans databases between tests
- Handles database migrations

**Usage:**
```typescript
const dbManager = new TestDatabaseManager();
await dbManager.initialize();
const dataSource = await dbManager.getDataSource('auth_service_test', entities);
await dbManager.cleanDatabase('auth_service_test');
```

### Test Service Manager (`test-service-manager.ts`)

Manages service instances and communication:
- Provides HTTP clients for each service
- Waits for services to be ready
- Handles service health checks
- Manages service configurations

**Usage:**
```typescript
const serviceManager = new TestServiceManager();
await serviceManager.initialize();
const authService = serviceManager.getService('auth-service');
await serviceManager.waitForService('auth-service');
```

### Test Fixtures

Provides reusable test data:
- **User Fixtures**: Test users with various roles and attributes
- **Job Fixtures**: Sample job postings with different requirements
- **Resume Fixtures**: Resume templates with various skill sets
- **Notification Fixtures**: Notification templates for different scenarios

**Usage:**
```typescript
import { createUserPayload, getTestUser } from './fixtures/user.fixtures';

const user = createUserPayload({ email: 'custom@test.com' });
const defaultUser = getTestUser(0);
```

### Mock Services

Provides mock implementations for testing without external dependencies:
- **Auth Service Mock**: Simulates authentication flows
- **AI Service Mock**: Provides mock AI responses
- **Job Service Mock**: Simulates job data operations
- **Notification Service Mock**: Tracks notification delivery

**Usage:**
```typescript
import { authServiceMock } from './mocks/auth-service.mock';

const authResponse = authServiceMock.mockRegister(email, password, firstName, lastName);
const isValid = authServiceMock.mockValidateToken(token);
```

## Writing New Tests

### Test Template

```typescript
import { AxiosInstance } from 'axios';
import { TestServiceManager } from './utils/test-service-manager';
import { TestDatabaseManager } from './utils/test-database';

describe('New Integration Tests', () => {
  let serviceManager: TestServiceManager;
  let dbManager: TestDatabaseManager;
  let service1: AxiosInstance;
  let service2: AxiosInstance;
  let accessToken: string;

  beforeAll(async () => {
    serviceManager = (global as any).testServices;
    dbManager = (global as any).testDb;

    service1 = serviceManager.getService('service-1');
    service2 = serviceManager.getService('service-2');

    await Promise.all([
      serviceManager.waitForService('service-1'),
      serviceManager.waitForService('service-2'),
    ]);
  });

  beforeEach(async () => {
    await dbManager.cleanDatabase('service_1_test');
    await dbManager.cleanDatabase('service_2_test');
  });

  describe('Feature Flow', () => {
    it('should test integration scenario', async () => {
      // Arrange
      const testData = createTestData();

      // Act
      const response = await service1.post('/api/endpoint', testData);

      // Assert
      expect(response.status).toBe(200);
    });
  });
});
```

### Best Practices

1. **Test Independence**: Each test should be independent and not rely on other tests
2. **Clean State**: Always clean databases before each test
3. **Realistic Data**: Use realistic test data that mimics production scenarios
4. **Error Cases**: Test both success and error scenarios
5. **Timeouts**: Set appropriate timeouts for async operations
6. **Assertions**: Make specific assertions about expected behavior
7. **Documentation**: Add clear descriptions for each test case

### Common Patterns

#### Testing Async Operations
```typescript
it('should handle async operation', async () => {
  const response = await service.post('/api/endpoint', data);

  // Wait for async processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const result = await service.get('/api/result');
  expect(result.status).toBe(200);
});
```

#### Testing Error Handling
```typescript
it('should handle errors gracefully', async () => {
  const response = await service.post('/api/endpoint', invalidData);

  expect([400, 422]).toContain(response.status);
  expect(response.data).toHaveProperty('error');
});
```

#### Testing with Authentication
```typescript
it('should require authentication', async () => {
  const response = await service.get('/api/protected', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  expect(response.status).toBe(200);
});
```

## Troubleshooting

### Common Issues

#### Services Not Starting

**Problem**: Services fail to start or are not reachable
**Solution**:
```bash
# Check service logs
npm run docker:logs

# Restart services
npm run docker:down
npm run docker:up

# Check service health
curl http://localhost:3001/api/v1/health
```

#### Database Connection Issues

**Problem**: Cannot connect to test database
**Solution**:
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check database credentials in `.env.test`
- Ensure database port is not in use
- Run `npm run docker:clean` to reset everything

#### Test Timeouts

**Problem**: Tests timeout before completion
**Solution**:
- Increase timeout in `jest.config.js`
- Check if services are responding: `curl http://localhost:PORT/health`
- Review service logs for errors
- Ensure sufficient system resources

#### Port Conflicts

**Problem**: Port already in use
**Solution**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Use different ports in .env.test
```

### Debug Mode

Run tests in debug mode to troubleshoot issues:

```bash
# Enable debug logging
TEST_DEBUG=true npm test

# Run specific test in debug mode
npm run test:debug -- auth-user.integration.test.ts
```

## CI/CD Integration

### GitHub Actions

Integration tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Daily scheduled runs (3 AM UTC)
- Manual workflow dispatch

### Local CI Simulation

Run tests as they would run in CI:

```bash
# Start test environment
npm run docker:up

# Wait for services
sleep 30

# Run tests
npm test

# Cleanup
npm run docker:down
```

### Environment Variables

Required environment variables for CI:
```bash
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_USERNAME=postgres
TEST_DB_PASSWORD=postgres
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:8002
JOB_SERVICE_URL=http://localhost:3003
# ... (see .env.test for complete list)
```

## Performance Considerations

### Test Execution Time

- Full suite: ~5-10 minutes
- Individual suites: ~1-2 minutes
- Tests run serially to avoid database conflicts

### Optimization Tips

1. Use test fixtures to reduce setup time
2. Clean only necessary databases
3. Reuse service connections
4. Mock external dependencies when possible
5. Run tests in parallel when safe

## Contributing

When adding new integration tests:

1. Follow the existing test structure
2. Add fixtures for reusable test data
3. Update this README with new test descriptions
4. Ensure tests are deterministic
5. Add appropriate assertions
6. Test both success and failure cases
7. Update CI workflow if needed

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For issues or questions:
- Create an issue in the repository
- Contact the backend team
- Check service-specific documentation in `services/*/README.md`
