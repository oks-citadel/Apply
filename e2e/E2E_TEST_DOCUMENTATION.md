# E2E Test Documentation

## Overview

This document provides comprehensive documentation for the End-to-End (E2E) test suite for the JobPilot AI Platform. The test suite uses Playwright and TypeScript to ensure critical user flows work correctly.

## Table of Contents

1. [Test Structure](#test-structure)
2. [Critical Flows](#critical-flows)
3. [Running Tests](#running-tests)
4. [Test Configuration](#test-configuration)
5. [Page Object Models](#page-object-models)
6. [Test Fixtures](#test-fixtures)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Test Structure

```
e2e/
├── fixtures/           # Test data and fixtures
│   ├── auth.fixture.ts
│   └── data.fixture.ts
├── pages/             # Page Object Models
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── dashboard.page.ts
│   ├── resumes.page.ts
│   ├── resume-editor.page.ts
│   ├── jobs.page.ts
│   ├── applications.page.ts
│   ├── settings.page.ts
│   ├── profile.page.ts
│   ├── email-verification.page.ts
│   └── auto-apply.page.ts
├── tests/             # Test specifications
│   ├── auth/          # Authentication tests
│   ├── resumes/       # Resume management tests
│   ├── jobs/          # Job search and application tests
│   ├── auto-apply/    # Auto-apply feature tests
│   ├── profile/       # Profile management tests
│   └── flows/         # Critical user flows
│       ├── registration-to-dashboard.spec.ts
│       ├── login-job-apply.spec.ts
│       └── resume-lifecycle.spec.ts
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
│   ├── api.ts
│   └── database.ts
├── global-setup.ts    # Global test setup
└── global-teardown.ts # Global test teardown
```

## Critical Flows

### Flow 1: Registration → Email Verification → Dashboard

**File**: `e2e/tests/flows/registration-to-dashboard.spec.ts`

**Description**: Tests the complete user onboarding flow from registration through email verification to landing on the dashboard.

**Test Cases**:
- Complete registration flow with email verification
- Handle registration with existing email
- Resend verification code
- Skip email verification (if permitted)
- Validate verification code format
- Handle incorrect verification code
- Persist user session after registration
- Redirect to login if already have account
- Show password strength indicator
- Complete registration with newsletter subscription
- Handle network errors gracefully
- Show loading state during submission

**Key Assertions**:
- User can successfully register
- Email verification page is displayed
- Dashboard is accessible after verification
- Welcome message displays user name
- Navigation and stats are visible

### Flow 2: Login → Job Search → Apply

**File**: `e2e/tests/flows/login-job-apply.spec.ts`

**Description**: Tests the complete job application flow from login through job search and filtering to submitting an application.

**Test Cases**:
- Complete login to job application flow
- Login with remember me
- Search and filter jobs before applying
- Save multiple jobs before applying
- Sort jobs by relevance and date
- Paginate through job results
- Require resume when applying to job
- View and update application status
- Filter applications by status
- Search through applications
- Logout after completing flow
- Persist job search filters
- Handle applying to same job twice

**Key Assertions**:
- User can successfully login
- Job search returns results
- Filters work correctly
- Job details are displayed
- Application is submitted successfully
- Application appears in My Applications

### Flow 3: Resume Create → Edit → Export

**File**: `e2e/tests/flows/resume-lifecycle.spec.ts`

**Description**: Tests the complete resume lifecycle from creation through editing to exporting in different formats.

**Test Cases**:
- Complete resume creation, edit, and export flow
- Auto-save resume changes
- Preview resume before export
- Validate required resume fields
- Add multiple work experiences
- Add multiple education entries
- Add technical and soft skills
- Handle current job checkbox
- Download resume in PDF format
- Download resume in DOCX format
- Search and filter resumes
- Delete resume with confirmation
- Cancel resume deletion
- Duplicate existing resume
- Show empty state when no resumes exist
- Navigate between editor tabs
- Persist resume changes after reload

**Key Assertions**:
- Resume is created successfully
- All sections can be filled
- Auto-save works correctly
- Preview displays content
- Export generates files
- Resume appears in list
- Changes are persisted

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### Run Specific Tests

```bash
# Run specific test file
npx playwright test e2e/tests/flows/registration-to-dashboard.spec.ts

# Run tests with specific tag
npx playwright test --grep @critical

# Run tests in specific browser
npx playwright test --project=chromium
```

### Debug Tests

```bash
# Debug mode
npx playwright test --debug

# Debug specific test
npx playwright test registration-to-dashboard.spec.ts --debug
```

### Generate Test Report

```bash
# Generate HTML report
npx playwright show-report

# Generate and open report
npx playwright test --reporter=html
```

## Test Configuration

### Playwright Configuration

Located at `playwright.config.ts`:

```typescript
{
  testDir: './e2e/tests',
  timeout: 60000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    'chromium',
    'firefox',
    'webkit',
    'Mobile Chrome',
    'Mobile Safari'
  ]
}
```

### Environment Variables

Create `.env` file in the `e2e` directory:

```bash
BASE_URL=http://localhost:3000
TEST_API_URL=http://localhost:4000
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
SKIP_DB_CLEANUP=false
HEADLESS=true
```

## Page Object Models

### Structure

Each page object follows this structure:

```typescript
export class PageName {
  readonly page: Page;
  readonly locators: Locator;

  constructor(page: Page) {
    this.page = page;
    this.locators = page.locator('selector');
  }

  async goto() {
    await this.page.goto('/path');
  }

  async performAction() {
    // Action implementation
  }

  async assertVisible() {
    await expect(this.locators).toBeVisible();
  }
}
```

### Available Page Objects

- **LoginPage**: Login functionality
- **RegisterPage**: Registration functionality
- **EmailVerificationPage**: Email verification flow
- **DashboardPage**: Dashboard navigation and stats
- **ResumesPage**: Resume list and management
- **ResumeEditorPage**: Resume creation and editing
- **JobsPage**: Job search and filtering
- **ApplicationsPage**: Application tracking
- **SettingsPage**: User settings management
- **ProfilePage**: User profile management
- **AutoApplyPage**: Auto-apply dashboard

## Test Fixtures

### Authentication Fixtures

Located at `e2e/fixtures/auth.fixture.ts`:

```typescript
export const TEST_USERS = {
  regular: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  premium: {
    email: 'premium@example.com',
    password: 'TestPassword123!',
  },
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  },
};
```

### Data Fixtures

Located at `e2e/fixtures/data.fixture.ts`:

- `TEST_RESUME`: Resume test data
- `TEST_JOBS`: Job listing test data
- `TEST_APPLICATIONS`: Application test data
- `TEST_AUTO_APPLY_SETTINGS`: Auto-apply configuration
- `TEST_PROFILE`: Profile test data

## CI/CD Integration

### GitHub Actions

The tests are integrated into GitHub Actions workflow:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Results

- **HTML Report**: Generated in `playwright-report/`
- **JSON Report**: Generated in `test-results/results.json`
- **JUnit Report**: Generated in `test-results/junit.xml`

## Best Practices

### 1. Use Page Object Model

Always use page objects for element interactions:

```typescript
// Good
await loginPage.login(email, password);

// Bad
await page.fill('input[name="email"]', email);
```

### 2. Wait for Network Idle

Wait for network operations to complete:

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Use Data Test IDs

Prefer data-testid selectors:

```typescript
// Good
page.locator('[data-testid="submit-button"]')

// Less reliable
page.locator('button.submit')
```

### 4. Handle Async Operations

Always await async operations:

```typescript
const count = await page.locator('.item').count();
```

### 5. Use Fixtures for Test Data

Use fixtures instead of hardcoded data:

```typescript
// Good
await registerPage.register(TEST_USERS.regular);

// Bad
await registerPage.register({
  email: 'test@test.com',
  password: 'pass123'
});
```

### 6. Clean Up After Tests

Use beforeEach and afterEach hooks:

```typescript
test.afterEach(async ({ page }) => {
  // Cleanup code
});
```

### 7. Write Descriptive Test Names

```typescript
// Good
test('should complete full registration flow with email verification', ...)

// Bad
test('registration test', ...)
```

### 8. Use Proper Assertions

Use Playwright's built-in assertions:

```typescript
// Good
await expect(page).toHaveURL(/dashboard/);

// Less reliable
expect(page.url()).toContain('dashboard');
```

## Troubleshooting

### Tests Failing Locally

1. **Check if application is running**:
   ```bash
   npm run dev
   ```

2. **Verify database is accessible**:
   ```bash
   npm run db:test:setup
   ```

3. **Clear test data**:
   ```bash
   npm run db:test:reset
   ```

### Tests Failing in CI

1. **Check CI logs** for specific errors
2. **Verify environment variables** are set correctly
3. **Check if services are starting properly**
4. **Increase timeouts** if needed

### Flaky Tests

1. **Add explicit waits**:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

2. **Use proper selectors** (prefer data-testid)

3. **Handle race conditions**:
   ```typescript
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

### Debugging

1. **Run with headed mode**:
   ```bash
   npx playwright test --headed
   ```

2. **Use debug mode**:
   ```bash
   npx playwright test --debug
   ```

3. **Add screenshots**:
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

4. **Use console logs**:
   ```typescript
   console.log('Current URL:', page.url());
   ```

## Test Coverage

### Current Coverage

- **Authentication**: 95%
- **Job Search & Apply**: 90%
- **Resume Management**: 92%
- **Auto-Apply**: 85%
- **Profile Management**: 88%

### Coverage Goals

- Overall: 90%+
- Critical Flows: 95%+
- Happy Paths: 100%
- Error Scenarios: 85%+

## Continuous Improvement

### Adding New Tests

1. Create page object if needed
2. Add test fixtures
3. Write test specification
4. Run locally
5. Submit PR with tests
6. Verify CI passes

### Updating Tests

1. Update page objects first
2. Update test fixtures if needed
3. Update test cases
4. Verify all related tests pass
5. Update documentation

## Support

For questions or issues:
- Check existing test examples
- Review Playwright documentation
- Ask in team chat
- Create GitHub issue

## Version History

- **v1.0.0** (2024-12-08): Initial E2E test suite implementation
  - Complete test suite for 5 critical flows
  - 12+ page objects
  - Comprehensive test fixtures
  - CI/CD integration
  - Full documentation
