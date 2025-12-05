# E2E Testing Guide

End-to-end testing setup for the JobPilot AI Platform using Playwright.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Database Management](#database-management)
- [Test Utilities](#test-utilities)
- [Writing Tests](#writing-tests)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The E2E test suite provides comprehensive testing for the JobPilot platform, including:

- User authentication and authorization
- Job search and application workflows
- Resume management
- AI-powered features
- Payment processing
- Admin functionality

### Technology Stack

- **Playwright**: Browser automation and testing framework
- **TypeScript**: Type-safe test development
- **PostgreSQL**: Test database
- **Node.js**: Runtime environment

## Setup

### Prerequisites

1. Node.js 20.x or higher
2. PostgreSQL 14.x or higher
3. All platform services running (auth, job, resume, etc.)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create test environment configuration:

```bash
cp e2e/.env.example e2e/.env
```

3. Update the `.env` file with your test environment values:

```env
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobpilot_test
TEST_API_URL=http://localhost:3001/api/v1
BASE_URL=http://localhost:3000
```

4. Create test database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE jobpilot_test;

# Exit psql
\q
```

5. Install Playwright browsers:

```bash
npx playwright install
```

## Configuration

### Environment Variables

Key configuration options in `e2e/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/jobpilot_test` |
| `TEST_API_URL` | Base URL for API calls | `http://localhost:3001/api/v1` |
| `BASE_URL` | Base URL for web application | `http://localhost:3000` |
| `SKIP_DB_CLEANUP` | Skip database cleanup after tests | `false` |
| `HEADLESS` | Run tests in headless mode | `true` |
| `WORKERS` | Number of parallel workers | `auto` |

### Test Users

The setup automatically creates these test users:

- **Standard User**: `test@example.com` / `TestPassword123!`
- **Admin User**: `admin@example.com` / `AdminPassword123!`

## Running Tests

### All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Or using Playwright CLI
npx playwright test
```

### Specific Tests

```bash
# Run tests in a specific file
npx playwright test e2e/tests/auth.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests in a specific browser
npx playwright test --project=chromium
```

### Debug Mode

```bash
# Run tests in headed mode with debug console
npx playwright test --headed --debug

# Run tests with Playwright Inspector
PWDEBUG=1 npx playwright test
```

### Watch Mode

```bash
# Run tests in watch mode (re-run on file changes)
npx playwright test --watch
```

## Database Management

### Global Setup

The `global-setup.ts` script runs before all tests and:

1. Connects to PostgreSQL
2. Creates test database if it doesn't exist
3. Runs TypeORM migrations
4. Clears existing test data
5. Creates test users via API
6. Prepares authentication state

### Global Teardown

The `global-teardown.ts` script runs after all tests and:

1. Truncates all database tables
2. Resets sequences to start values
3. Closes database connections
4. Removes authentication files
5. Cleans up temporary files

### Manual Database Operations

```bash
# Clear test database manually
npm run test:db:clear

# Reset test database (drop and recreate)
npm run test:db:reset

# Run migrations on test database
npm run test:db:migrate
```

### Skip Cleanup (for debugging)

```bash
# Keep test data after tests complete
SKIP_DB_CLEANUP=true npx playwright test
```

## Test Utilities

### Database Utilities (`e2e/utils/database.ts`)

```typescript
import {
  clearTable,
  clearTables,
  insertTestRecord,
  findRecords,
  executeQuery,
  getTableRowCount,
} from './utils/database';

// Clear a single table
await clearTable('users');

// Clear multiple tables
await clearTables(['users', 'jobs', 'applications']);

// Insert test data
const user = await insertTestRecord('users', {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
});

// Find records
const users = await findRecords('users', { role: 'admin' });

// Execute raw SQL
const results = await executeQuery('SELECT * FROM users WHERE status = $1', ['active']);

// Get row count
const count = await getTableRowCount('users');
```

### API Utilities (`e2e/utils/api.ts`)

```typescript
import {
  authApi,
  userApi,
  apiGet,
  apiPost,
  createTestUser,
  assertApiSuccess,
} from './utils/api';

// Register a user
const response = await authApi.register({
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
});

// Login
const loginResponse = await authApi.login({
  email: 'test@example.com',
  password: 'Password123!',
});

// Create test user with token
const testUser = await createTestUser({
  email: 'custom@example.com',
  password: 'CustomPass123!',
});

// Make authenticated API call
const profile = await apiGet('/users/me', {
  token: testUser.accessToken,
});

// Assert response
assertApiSuccess(response);
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { clearTable } from '../utils/database';
import { authApi } from '../utils/api';

test.describe('Authentication', () => {
  // Run before each test in this describe block
  test.beforeEach(async () => {
    // Clear users table for isolation
    await clearTable('users');
  });

  test('should register a new user', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');

    // Submit form
    await page.click('[type="submit"]');

    // Assert redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should login existing user', async ({ page }) => {
    // Create user via API
    await authApi.register({
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    // Navigate to login page
    await page.goto('/login');

    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');

    // Submit form
    await page.click('[type="submit"]');

    // Assert redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

### Using Page Objects

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

test('should login and access dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login('test@example.com', 'Password123!');

  await expect(dashboardPage.welcomeMessage).toBeVisible();
});
```

### Test Isolation

Each test should be independent and not rely on state from other tests:

```typescript
test.beforeEach(async () => {
  // Clear relevant tables before each test
  await clearTables(['users', 'jobs', 'applications']);

  // Seed necessary data
  await insertTestRecord('users', {
    email: 'test@example.com',
    password: 'hashed_password',
    role: 'user',
  });
});
```

## Debugging

### Visual Debugging

```bash
# Run with headed browser and slow motion
npx playwright test --headed --slow-mo=1000
```

### Debug Specific Test

```bash
# Run single test with debug console
npx playwright test auth.spec.ts:10 --debug
```

### Screenshots and Videos

Tests automatically capture:
- Screenshots on failure
- Videos on failure
- Traces on retry

View results:

```bash
# Open test report
npx playwright show-report
```

### Database State

```bash
# Keep database state after tests for inspection
SKIP_DB_CLEANUP=true npx playwright test

# Then inspect database
psql -U postgres jobpilot_test
```

### Verbose Logging

```bash
# Enable debug logging
DEBUG=pw:api npx playwright test

# Show browser console logs
SHOW_BROWSER_CONSOLE=true npx playwright test
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: jobpilot_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          npm run services:start
          npm run services:wait

      - name: Run E2E tests
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/jobpilot_test
          TEST_API_URL: http://localhost:3001/api/v1
          BASE_URL: http://localhost:3000
          CI: true
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check database exists
psql -U postgres -l | grep jobpilot_test

# Verify connection string
echo $TEST_DATABASE_URL
```

### Service Not Available

```bash
# Check auth service is running
curl http://localhost:3001/api/v1/health

# Check web app is running
curl http://localhost:3000
```

### Port Conflicts

```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Kill process using port
kill -9 <PID>
```

### Test Timeouts

```bash
# Increase timeout for slow environments
TEST_TIMEOUT=120000 npx playwright test

# Run tests sequentially
WORKERS=1 npx playwright test
```

### Clean Start

```bash
# Clear everything and start fresh
npm run test:clean
rm -rf e2e/.auth
dropdb jobpilot_test
createdb jobpilot_test
npx playwright test
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clean State**: Use `beforeEach` to reset database state
3. **Page Objects**: Use page object pattern for maintainability
4. **Selectors**: Use data-testid attributes for stable selectors
5. **Assertions**: Use Playwright's built-in assertions
6. **Error Handling**: Add try-catch blocks for cleanup operations
7. **Documentation**: Comment complex test scenarios
8. **Performance**: Use API calls for setup when possible

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [TypeScript Guide](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:

1. Check this README
2. Review test examples in `e2e/tests/`
3. Check Playwright documentation
4. Open an issue in the repository
