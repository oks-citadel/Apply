# E2E Testing Quick Reference

## Setup (One Time)

```bash
# 1. Copy environment file
cp e2e/.env.example e2e/.env

# 2. Edit configuration
# Update TEST_DATABASE_URL, TEST_API_URL in e2e/.env

# 3. Install dependencies (if needed)
npm install pg typeorm @types/pg

# 4. Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test e2e/tests/auth/login.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Keep database for debugging
SKIP_DB_CLEANUP=true npx playwright test

# Run tests sequentially
WORKERS=1 npx playwright test
```

## Database Utilities

```typescript
import {
  clearTable,
  clearTables,
  insertTestRecord,
  findRecords,
  findOneRecord,
  getTableRowCount,
  recordExists,
} from './utils/database';

// Clear a table
await clearTable('users');

// Clear multiple tables
await clearTables(['users', 'jobs']);

// Insert record
const user = await insertTestRecord('users', {
  email: 'test@example.com',
  firstName: 'Test',
});

// Find records
const users = await findRecords('users', { role: 'admin' });

// Find one record
const user = await findOneRecord('users', { email: 'test@example.com' });

// Count rows
const count = await getTableRowCount('users');

// Check existence
const exists = await recordExists('users', { email: 'test@example.com' });
```

## API Utilities

```typescript
import {
  authApi,
  createTestUser,
  assertApiSuccess,
} from './utils/api';

// Register user
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

// Create test user (returns with tokens)
const user = await createTestUser({
  email: 'custom@example.com',
});

// Get profile
const profile = await authApi.getProfile(user.accessToken);

// Assert success
assertApiSuccess(response);
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { clearTable } from '../utils/database';
import { createTestUser } from '../utils/api';

test.describe('Feature Tests', () => {
  test.beforeEach(async () => {
    // Setup before each test
    await clearTable('users');
  });

  test('should do something', async ({ page }) => {
    // Test code here
  });
});
```

## Environment Variables

```bash
# Required
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobpilot_test
TEST_API_URL=http://localhost:3001/api/v1
BASE_URL=http://localhost:3000

# Optional
SKIP_DB_CLEANUP=false
HEADLESS=true
WORKERS=auto
DEBUG=false
```

## Common Commands

```bash
# View test report
npx playwright show-report

# Show trace
npx playwright show-trace trace.zip

# Check PostgreSQL
pg_isready

# Connect to test DB
psql postgresql://postgres:postgres@localhost:5432/jobpilot_test

# Check auth service
curl http://localhost:3001/api/v1/health
```

## Test Users

Created automatically during setup:

- **Standard**: `test@example.com` / `TestPassword123!`
- **Admin**: `admin@example.com` / `AdminPassword123!`

## Debugging

```bash
# Run with debug console
PWDEBUG=1 npx playwright test

# Keep database state
SKIP_DB_CLEANUP=true npx playwright test

# Verbose logging
DEBUG=pw:api npx playwright test

# Run single test in debug
npx playwright test auth.spec.ts:10 --debug
```

## Common Test Patterns

### Pattern 1: UI Test with API Setup

```typescript
test('user can login', async ({ page }) => {
  // Create user via API
  await authApi.register({
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  });

  // Test UI
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('[type="submit"]');

  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Pattern 2: API-Only Test

```typescript
test('API endpoint works', async () => {
  const user = await createTestUser();

  const response = await authApi.getProfile(user.accessToken);

  assertApiSuccess(response);
  expect(response.data.email).toBe(user.email);
});
```

### Pattern 3: Database Verification

```typescript
test('data is persisted', async ({ page }) => {
  await page.goto('/register');
  // ... fill form and submit ...

  // Verify in database
  const user = await findOneRecord('users', {
    email: 'test@example.com'
  });

  expect(user).toBeDefined();
});
```

## File Locations

- **Setup**: `e2e/global-setup.ts`
- **Teardown**: `e2e/global-teardown.ts`
- **DB Utils**: `e2e/utils/database.ts`
- **API Utils**: `e2e/utils/api.ts`
- **Types**: `e2e/types/index.ts`
- **Config**: `e2e/.env`
- **Tests**: `e2e/tests/**/*.spec.ts`
- **Pages**: `e2e/pages/**/*.page.ts`

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| DB connection failed | Check PostgreSQL: `pg_isready` |
| API not responding | Check service: `curl http://localhost:3001/api/v1/health` |
| Tests timeout | Increase timeout: `TEST_TIMEOUT=120000` |
| Need to inspect DB | Use: `SKIP_DB_CLEANUP=true` |
| Flaky tests | Run sequentially: `WORKERS=1` |

## Resources

- Full docs: `e2e/README.md`
- Examples: `e2e/tests/example.spec.ts`
- Implementation: `E2E_SETUP_IMPLEMENTATION.md`
- Playwright: https://playwright.dev/
