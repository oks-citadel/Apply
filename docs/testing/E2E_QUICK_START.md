# E2E Tests - Quick Start Guide

## Setup (One-Time)

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Create environment file (optional)
cp e2e/.env.example e2e/.env

# 4. Start the application
npm run dev
```

## Running Tests

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui
```

### Run Specific Tests

```bash
# Run specific flow
npx playwright test flows/registration-to-dashboard.spec.ts

# Run specific test suite
npx playwright test auth/
npx playwright test jobs/
npx playwright test resumes/

# Run tests matching pattern
npx playwright test --grep "registration"
```

### Run by Browser

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit

# All browsers
npx playwright test
```

### Debug Tests

```bash
# Debug mode (step through)
npx playwright test --debug

# Debug specific test
npx playwright test registration.spec.ts --debug

# Slow motion (see actions)
npx playwright test --headed --slow-mo=100
```

## View Results

### Test Reports

```bash
# Open HTML report
npx playwright show-report

# Generate report
npx playwright test --reporter=html
```

### Screenshots & Videos

- Screenshots: `test-results/` (on failure)
- Videos: `test-results/` (on failure)
- Traces: `test-results/` (on retry)

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npx playwright test --ui` | Interactive UI mode |
| `npx playwright test --headed` | See browser actions |
| `npx playwright test --debug` | Debug mode |
| `npx playwright show-report` | View HTML report |
| `npx playwright codegen` | Generate test code |

## Test Files Location

```
e2e/tests/
├── flows/
│   ├── registration-to-dashboard.spec.ts
│   ├── login-job-apply.spec.ts
│   └── resume-lifecycle.spec.ts
├── auth/
│   └── register.spec.ts
├── jobs/
│   └── job-apply.spec.ts
├── resumes/
│   └── create-resume.spec.ts
├── auto-apply/
│   └── auto-apply.spec.ts
└── profile/
    └── profile.spec.ts
```

## Critical Flows

### 1. Registration Flow (13 tests)
```bash
npx playwright test flows/registration-to-dashboard.spec.ts
```
- Complete user registration
- Email verification
- Dashboard access

### 2. Job Application Flow (14 tests)
```bash
npx playwright test flows/login-job-apply.spec.ts
```
- User login
- Job search & filtering
- Application submission

### 3. Resume Lifecycle (22 tests)
```bash
npx playwright test flows/resume-lifecycle.spec.ts
```
- Resume creation
- Editing & sections
- Export (PDF/DOCX)

### 4. Auto-Apply (43 tests)
```bash
npx playwright test auto-apply/auto-apply.spec.ts
```
- Settings configuration
- Activity monitoring

### 5. Profile Management (49 tests)
```bash
npx playwright test profile/profile.spec.ts
```
- Profile editing
- Experience & education
- Skills management

## Troubleshooting

### Application Not Running
```bash
# Start the app first
npm run dev
```

### Playwright Browsers Missing
```bash
# Install browsers
npx playwright install
```

### Tests Failing
```bash
# Run in headed mode to see what's happening
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Check test results
npx playwright show-report
```

### Port Already in Use
```bash
# Check what's using port 3000
# Kill the process or change BASE_URL in .env
```

## Environment Variables

Create `e2e/.env`:

```bash
BASE_URL=http://localhost:3000
TEST_API_URL=http://localhost:4000
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
```

## Tips

1. **Start Application First**: Always ensure the app is running
2. **Use UI Mode**: Great for development and debugging
3. **Check Reports**: Review HTML reports for failures
4. **Run Specific Tests**: Don't run all tests while developing
5. **Debug Mode**: Use when tests are failing

## Quick Debugging

```bash
# 1. Run specific test in debug mode
npx playwright test registration.spec.ts --debug

# 2. See browser actions
npx playwright test --headed

# 3. Check test report
npx playwright show-report

# 4. Take screenshot at specific point
# Add this to your test:
await page.screenshot({ path: 'debug.png' });
```

## CI/CD

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

View results:
- GitHub Actions tab
- Test reports artifact
- Screenshots/videos on failure

## Help

- **Full Documentation**: See `E2E_TEST_DOCUMENTATION.md`
- **Detailed Guide**: See `e2e/README.md`
- **Playwright Docs**: https://playwright.dev/docs/intro

## Test Statistics

- **Total Tests**: 141+
- **Test Files**: 5+ flows
- **Page Objects**: 12
- **Average Runtime**: ~5-10 minutes (all tests)
- **Browsers**: Chrome, Firefox, Safari
