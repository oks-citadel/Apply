# E2E Test Suite

Comprehensive End-to-End test coverage for the Job Apply Platform using Playwright.

## Overview

This test suite provides complete E2E test skeletons for all critical user flows in the application. The tests are organized by feature area and use Playwright's modern testing capabilities.

**Total Test Files:** 31 (including utilities and fixtures)
**Test Spec Files:** 28

## Directory Structure

```
e2e/
├── utils/                    # Test utilities and helpers
│   ├── auth.ts              # Authentication helper functions
│   └── test-data.ts         # Test data generators and fixtures
├── fixtures/                 # Playwright fixtures
│   └── user.fixture.ts      # Custom user authentication fixtures
├── auth/                     # Authentication flows (6 files)
│   ├── registration.spec.ts
│   ├── login.spec.ts
│   ├── mfa-login.spec.ts
│   ├── oauth-login.spec.ts
│   ├── password-reset.spec.ts
│   └── email-verification.spec.ts
├── profile/                  # Profile management flows (4 files)
│   ├── complete-profile.spec.ts
│   ├── work-experience.spec.ts
│   ├── education.spec.ts
│   └── skills.spec.ts
├── resumes/                  # Resume management flows (4 files)
│   ├── upload-resume.spec.ts
│   ├── create-resume.spec.ts
│   ├── optimize-resume.spec.ts
│   └── export-resume.spec.ts
├── jobs/                     # Job search and management flows (4 files)
│   ├── search-jobs.spec.ts
│   ├── view-job.spec.ts
│   ├── save-job.spec.ts
│   └── job-alerts.spec.ts
├── applications/             # Application flows (3 files)
│   ├── apply-to-job.spec.ts
│   ├── track-applications.spec.ts
│   └── auto-apply-settings.spec.ts
├── ai-tools/                 # AI-powered tools flows (4 files)
│   ├── cover-letter.spec.ts
│   ├── interview-prep.spec.ts
│   ├── salary-assistant.spec.ts
│   └── skills-gap.spec.ts
└── billing/                  # Billing and subscription flows (3 files)
    ├── view-pricing.spec.ts
    ├── subscribe.spec.ts
    └── upgrade-plan.spec.ts
```

## Test Categories

### 1. Authentication Flows (6 tests)
- **registration.spec.ts**: User registration, form validation, email verification flow
- **login.spec.ts**: User login, validation, error handling, remember me
- **mfa-login.spec.ts**: Multi-factor authentication, backup codes, device trust
- **oauth-login.spec.ts**: Social login (Google, GitHub, LinkedIn), account linking
- **password-reset.spec.ts**: Forgot password flow, reset token validation
- **email-verification.spec.ts**: Email verification, resend verification, access restrictions

### 2. Profile Flows (4 tests)
- **complete-profile.spec.ts**: Profile setup wizard, multi-step onboarding, progress tracking
- **work-experience.spec.ts**: Add/edit/delete work experience, current position handling
- **education.spec.ts**: Add/edit/delete education, degree types, GPA validation
- **skills.spec.ts**: Skills management, categorization, proficiency levels, autocomplete

### 3. Resume Flows (4 tests)
- **upload-resume.spec.ts**: File upload (PDF, DOCX), validation, parsing, progress tracking
- **create-resume.spec.ts**: Resume builder, templates, sections, preview, auto-save
- **optimize-resume.spec.ts**: ATS optimization, keyword suggestions, content improvements
- **export-resume.spec.ts**: Export formats (PDF, DOCX), sharing, formatting options

### 4. Job Flows (4 tests)
- **search-jobs.spec.ts**: Search, filters (location, type, salary), sorting, pagination
- **view-job.spec.ts**: Job details, company info, requirements, apply button
- **save-job.spec.ts**: Save/bookmark jobs, organize saved jobs, folders
- **job-alerts.spec.ts**: Create alerts, manage alerts, frequency settings

### 5. Application Flows (3 tests)
- **apply-to-job.spec.ts**: Application process, resume selection, cover letter, submission
- **track-applications.spec.ts**: Application list, status updates, notes, timeline, analytics
- **auto-apply-settings.spec.ts**: Auto-apply configuration, criteria, limits, exclusions

### 6. AI Tools Flows (4 tests)
- **cover-letter.spec.ts**: AI cover letter generation, customization, editing
- **interview-prep.spec.ts**: Practice questions, answer suggestions, feedback, tips
- **salary-assistant.spec.ts**: Salary estimates, negotiation tips, offer evaluation
- **skills-gap.spec.ts**: Skills analysis, gap identification, learning recommendations

### 7. Billing Flows (3 tests)
- **view-pricing.spec.ts**: Pricing plans, features, comparison, FAQs
- **subscribe.spec.ts**: Checkout process, payment info, subscription confirmation
- **upgrade-plan.spec.ts**: Upgrade/downgrade, cancel subscription, billing history

## Utilities and Fixtures

### Test Utilities (`utils/`)

#### `auth.ts`
Helper functions for authentication:
- `loginViaUI()` - Login through UI
- `loginViaContext()` - Fast login via cookies
- `registerViaUI()` - Register new user
- `logout()` - Logout user
- `setupMFA()` - Enable MFA for testing
- `completeOAuthFlow()` - Mock OAuth completion

#### `test-data.ts`
Test data generators and constants:
- `TEST_USERS` - Sample user credentials
- `TEST_JOBS` - Sample job postings
- `TEST_RESUME_DATA` - Sample resume content
- `TEST_PAYMENT_DATA` - Test payment cards (Stripe)
- `SUBSCRIPTION_PLANS` - Plan definitions
- `AI_PROMPTS` - AI tool prompt examples
- `WAIT_TIMES` - Timeout constants

### Fixtures (`fixtures/`)

#### `user.fixture.ts`
Custom Playwright fixtures:
- `authenticatedPage` - Pre-authenticated page
- `premiumUserPage` - Premium user page
- `mfaUserPage` - MFA-enabled user page
- `newUser` - Generate unique user for test

## Test Patterns

### 1. Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-path');
  });

  test('should perform basic action', async ({ page }) => {
    // Test implementation
  });

  test.skip('should perform action requiring backend', async ({ page }) => {
    // TODO: Requires backend integration
    // Test implementation
  });
});
```

### 2. Authentication Pattern
```typescript
// For unauthenticated tests
test('should access public page', async ({ page }) => {
  await page.goto('/jobs');
  // ...
});

// For authenticated tests
authenticatedTest('should access protected page', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // ...
});
```

### 3. Test Skipping Convention
- Tests marked with `test.skip()` require backend integration
- All tests have `// TODO: Requires backend integration` comments
- Tests without `.skip()` test UI/navigation only

## Running Tests

### Run All Tests
```bash
cd apps/web
npx playwright test
```

### Run Specific Suite
```bash
npx playwright test e2e/auth/
npx playwright test e2e/resumes/
npx playwright test e2e/billing/
```

### Run Single File
```bash
npx playwright test e2e/auth/login.spec.ts
```

### Run in UI Mode
```bash
npx playwright test --ui
```

### Run in Headed Mode
```bash
npx playwright test --headed
```

### Run with Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Implementation Status

### Ready to Run (No Backend Required)
- Basic page navigation tests
- UI element visibility tests
- Form validation (client-side)
- Navigation flow tests

### Requires Backend Implementation
Most tests are currently marked with `test.skip()` and need:
- Backend API endpoints
- Database integration
- Authentication services
- Payment processing
- AI service integration
- Email service

## Next Steps

1. **Implement Backend APIs**
   - Remove `test.skip()` as endpoints are implemented
   - Update test data to match actual API responses

2. **Add Test Data Setup**
   - Create database seeders for test data
   - Implement test user creation utilities
   - Add API mocking for external services

3. **Configure CI/CD**
   - Set up Playwright in GitHub Actions
   - Configure test reporting
   - Add test coverage tracking

4. **Enhance Tests**
   - Add screenshot comparison tests
   - Implement accessibility tests
   - Add performance tests
   - Create visual regression tests

5. **Add Page Objects**
   - Create page object models for complex pages
   - Refactor tests to use page objects
   - Improve test maintainability

## Best Practices

1. **Use Descriptive Test Names**
   ```typescript
   test('should display validation error when email is invalid')
   ```

2. **Use Proper Selectors**
   - Prefer `getByRole()` for accessibility
   - Use `getByLabel()` for form inputs
   - Use `getByTestId()` for custom elements

3. **Wait for Elements Properly**
   ```typescript
   await expect(page.getByText('Success')).toBeVisible();
   ```

4. **Clean Up After Tests**
   - Tests should be independent
   - Use fixtures for setup/teardown
   - Reset state between tests

5. **Handle Async Operations**
   - Use proper wait strategies
   - Define timeout constants
   - Handle loading states

## Common Issues and Solutions

### Issue: Test Timeout
**Solution:** Increase timeout for slow operations
```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

### Issue: Flaky Tests
**Solution:** Use proper wait strategies
```typescript
// Bad
await page.waitForTimeout(1000);

// Good
await expect(element).toBeVisible();
```

### Issue: Element Not Found
**Solution:** Use more resilient selectors
```typescript
// Bad
page.locator('.btn-submit')

// Good
page.getByRole('button', { name: /submit/i })
```

## Contributing

When adding new tests:
1. Follow the existing directory structure
2. Use the established test patterns
3. Add `test.skip()` for backend-dependent tests
4. Include descriptive comments
5. Update this README if adding new categories

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

## Configuration

Test configuration is in `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\web\playwright.config.ts`

Key settings:
- Test directory: `./e2e`
- Base URL: `http://localhost:3000`
- Browsers: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- Screenshots: On failure only
- Video: On failure only
- Retries: 2 (in CI)
