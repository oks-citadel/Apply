# E2E Testing Suite

End-to-End testing suite for JobPilot AI Platform using Playwright.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:auth
npm run test:e2e:jobs
npm run test:e2e:resumes
npm run test:e2e:flows

# Run with UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

## Test Suites

### Critical Flows

1. **Registration → Email Verification → Dashboard**
   - Complete user onboarding flow
   - Email verification process
   - First-time dashboard experience

2. **Login → Job Search → Apply**
   - User authentication
   - Job discovery and filtering
   - Application submission

3. **Resume Create → Edit → Export**
   - Resume builder workflow
   - Multi-section editing
   - Export in multiple formats

4. **Auto-Apply Configuration → Execution**
   - Settings configuration
   - Criteria management
   - Activity monitoring

5. **Profile Update → Settings**
   - Profile management
   - Preferences configuration
   - Account settings

## Test Structure

```
e2e/
├── fixtures/          # Test data
├── pages/             # Page Objects
├── tests/             # Test specifications
│   ├── auth/
│   ├── resumes/
│   ├── jobs/
│   ├── auto-apply/
│   ├── profile/
│   └── flows/         # Critical user flows
├── types/             # TypeScript types
├── utils/             # Helper functions
└── E2E_TEST_DOCUMENTATION.md
```

## Prerequisites

- Node.js 18+
- Application running on localhost:3000
- Test database configured
- Environment variables set in `.env`

## Environment Setup

Create `.env` file:

```bash
BASE_URL=http://localhost:3000
TEST_API_URL=http://localhost:4000
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
SKIP_DB_CLEANUP=false
```

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Specific Browser

```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit
```

### Specific Test File

```bash
npx playwright test registration-to-dashboard.spec.ts
```

### With Tags

```bash
# Critical tests only
npx playwright test --grep @critical

# Skip flaky tests
npx playwright test --grep-invert @flaky
```

### Headed Mode

```bash
npx playwright test --headed
```

### Debug Mode

```bash
npx playwright test --debug
```

### Update Snapshots

```bash
npx playwright test --update-snapshots
```

## Test Reports

### HTML Report

```bash
npx playwright show-report
```

### JSON Report

Located at `test-results/results.json`

### JUnit Report

Located at `test-results/junit.xml` (for CI integration)

## Page Objects

All page interactions use Page Object Model pattern:

- `LoginPage`: Authentication
- `RegisterPage`: User registration
- `DashboardPage`: Main dashboard
- `ResumesPage`: Resume management
- `ResumeEditorPage`: Resume editing
- `JobsPage`: Job search
- `ApplicationsPage`: Application tracking
- `SettingsPage`: User settings
- `ProfilePage`: User profile
- `EmailVerificationPage`: Email verification
- `AutoApplyPage`: Auto-apply dashboard

## Test Fixtures

Pre-defined test data available:

- `TEST_USERS`: Test user credentials
- `TEST_RESUME`: Resume data
- `TEST_JOBS`: Job listings
- `TEST_APPLICATIONS`: Application data
- `TEST_AUTO_APPLY_SETTINGS`: Auto-apply config
- `TEST_PROFILE`: Profile data

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

Artifacts:
- Test reports uploaded to GitHub Actions
- Screenshots on failure
- Videos on failure
- Trace files on first retry

## Best Practices

1. **Use Page Objects**: Never interact with elements directly
2. **Wait for Network Idle**: Use `waitForLoadState('networkidle')`
3. **Use Data Test IDs**: Prefer `[data-testid]` selectors
4. **Async/Await**: Always await async operations
5. **Fixtures**: Use test fixtures for data
6. **Cleanup**: Clean up test data in hooks
7. **Descriptive Names**: Write clear test descriptions
8. **Assertions**: Use Playwright's expect API

## Debugging

### Local Debugging

```bash
# Run with UI
npx playwright test --ui

# Debug specific test
npx playwright test registration.spec.ts --debug

# Headed mode with slow motion
npx playwright test --headed --slow-mo=100
```

### Screenshots

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Console Logs

```typescript
console.log('Current URL:', page.url());
```

### Trace Viewer

```bash
npx playwright show-trace trace.zip
```

## Common Issues

### Tests Timing Out

- Increase timeout in test or config
- Check if application is running
- Verify network connectivity

### Element Not Found

- Check selector is correct
- Wait for element to be visible
- Use proper locator strategies

### Flaky Tests

- Add explicit waits
- Use retry logic
- Handle race conditions
- Check for timing issues

### CI Failures

- Check environment variables
- Verify service startup
- Review CI logs
- Increase timeouts if needed

## Contributing

1. Create page object for new pages
2. Add test fixtures for new data
3. Write test specification
4. Run tests locally
5. Submit PR with passing tests
6. Update documentation

## Documentation

See [E2E_TEST_DOCUMENTATION.md](./E2E_TEST_DOCUMENTATION.md) for complete documentation.

## Support

- GitHub Issues: Report bugs or request features
- Team Chat: Ask questions
- Documentation: Review test examples

## License

MIT
