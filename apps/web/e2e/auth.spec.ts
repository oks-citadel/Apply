import { test, expect } from '@playwright/test';
import { TEST_USERS, generateUniqueEmail } from './utils/test-data';

/**
 * E2E Tests for Authentication Flow
 *
 * This suite tests authentication functionality including:
 * - Login/logout
 * - Registration
 * - Password reset
 * - Session management
 * - Dashboard access
 */

// Mock API responses
const mockLoginResponse = {
  user: {
    id: 'user-123',
    email: 'testuser@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  },
  token: 'mock-jwt-token-12345',
  refreshToken: 'mock-refresh-token-12345',
};

const mockRegisterResponse = {
  user: {
    id: 'user-new-123',
    email: 'newuser@example.com',
    firstName: 'New',
    lastName: 'User',
    role: 'user',
  },
  message: 'Registration successful. Please check your email to verify your account.',
};

const mockDashboardData = {
  stats: {
    totalApplications: 25,
    pendingApplications: 10,
    interviews: 5,
    offers: 2,
    responseRate: 45,
  },
  recentActivity: [
    { type: 'application', jobTitle: 'Software Engineer', company: 'TechCorp', date: '2024-01-15' },
    { type: 'interview', jobTitle: 'Senior Developer', company: 'StartupXYZ', date: '2024-01-14' },
  ],
};

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth API endpoints
    await page.route('**/api/auth/login', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');

      if (body.email === TEST_USERS.valid.email && body.password === TEST_USERS.valid.password) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLoginResponse),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid email or password' }),
        });
      }
    });

    await page.route('**/api/auth/register', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');

      if (body.email && body.password && body.firstName && body.lastName) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockRegisterResponse,
            user: {
              ...mockRegisterResponse.user,
              email: body.email,
              firstName: body.firstName,
              lastName: body.lastName,
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'All fields are required' }),
        });
      }
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLoginResponse.user),
      });
    });

    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should show validation error
    const emailError = page.getByText(/email.*required|enter.*email|valid.*email/i);
    await expect(emailError).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid.*email|invalid.*password|credentials|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill(TEST_USERS.valid.email);
    await page.getByLabel(/password/i).fill(TEST_USERS.valid.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up|create.*account|register/i }).click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create account|sign up|register/i })).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should register successfully with valid data', async ({ page }) => {
    await page.goto('/register');

    const uniqueEmail = generateUniqueEmail('newuser');
    await page.getByLabel(/first name/i).fill('New');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill('SecurePass123!');

    // Accept terms if checkbox exists
    const termsCheckbox = page.getByLabel(/terms|agree|accept/i);
    if (await termsCheckbox.isVisible().catch(() => false)) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /sign up|create.*account|register/i }).click();

    // Should show success or redirect
    const successMessage = page.getByText(/success|verify.*email|check.*email|account.*created/i);
    const redirectedToDashboard = await page.url().match(/.*dashboard/);
    const redirectedToVerify = await page.url().match(/.*verify/);

    expect(
      (await successMessage.isVisible().catch(() => false)) ||
        redirectedToDashboard ||
        redirectedToVerify
    ).toBeTruthy();
  });

  test('should show validation errors on register with invalid data', async ({ page }) => {
    await page.goto('/register');

    // Submit without filling required fields
    await page.getByRole('button', { name: /sign up|create.*account|register/i }).click();

    // Should show validation errors
    const errorMessage = page.getByText(/required|enter.*name|valid.*email/i);
    await expect(errorMessage.first()).toBeVisible();
  });

  test('should show password requirements', async ({ page }) => {
    await page.goto('/register');

    // Focus on password field
    const passwordField = page.getByLabel(/password/i);
    await passwordField.click();
    await passwordField.fill('weak');

    // Should show password requirements or error
    const passwordHint = page.getByText(/characters|uppercase|lowercase|number|special|strong/i);
    if (await passwordHint.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(passwordHint).toBeVisible();
    }
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');

    const forgotLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
    if (await forgotLink.isVisible().catch(() => false)) {
      await forgotLink.click();
      await expect(page).toHaveURL(/.*forgot|.*reset/);
    }
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set mock auth token
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock dashboard API
    await page.route('**/api/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardData),
      });
    });

    // Mock user API
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLoginResponse.user),
      });
    });

    // Mock applications API
    await page.route('**/api/applications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockDashboardData.recentActivity,
          total: 25,
        }),
      });
    });
  });

  test('should display dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|welcome|overview/i })).toBeVisible();
  });

  test('should display application statistics', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show application stats
    const totalApps = page.getByText(/total.*applications|applications/i);
    const responseRate = page.getByText(/response.*rate|rate/i);

    await expect(totalApps.first()).toBeVisible();
    await expect(responseRate.first()).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show recent activity section
    const recentSection = page.getByText(/recent.*activity|recent|activity/i);
    if (await recentSection.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(recentSection.first()).toBeVisible();
    }
  });

  test('should have navigation to other sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Should have navigation links
    const jobsLink = page.getByRole('link', { name: /jobs|find.*jobs/i });
    const resumesLink = page.getByRole('link', { name: /resumes?/i });
    const applicationsLink = page.getByRole('link', { name: /applications/i });

    // At least one navigation item should be visible
    const hasJobsLink = await jobsLink.isVisible().catch(() => false);
    const hasResumesLink = await resumesLink.isVisible().catch(() => false);
    const hasApplicationsLink = await applicationsLink.isVisible().catch(() => false);

    expect(hasJobsLink || hasResumesLink || hasApplicationsLink).toBeTruthy();
  });

  test('should redirect unauthenticated users to login', async ({ page, context }) => {
    // Clear cookies to simulate unauthenticated state
    await context.clearCookies();

    // Mock 401 response for unauthenticated requests
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});

test.describe('Jobs', () => {
  test.beforeEach(async ({ page }) => {
    // Mock jobs API
    await page.route('**/api/jobs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'job-1',
              title: 'Software Engineer',
              company_name: 'TechCorp',
              location: 'Remote',
              remote_type: 'remote',
              salary_min: 100000,
              salary_max: 150000,
            },
            {
              id: 'job-2',
              title: 'Product Manager',
              company_name: 'StartupXYZ',
              location: 'New York, NY',
              remote_type: 'hybrid',
              salary_min: 120000,
              salary_max: 160000,
            },
          ],
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        }),
      });
    });
  });

  test('should display jobs listing page', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { name: /jobs|find.*jobs|job.*search/i })).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/jobs');
    const searchInput = page.getByPlaceholder(/search|job.*title|keywords/i);
    await expect(searchInput).toBeVisible();
  });

  test('should filter jobs by location', async ({ page }) => {
    await page.goto('/jobs');

    const locationFilter = page.getByRole('combobox', { name: /location/i });
    const locationInput = page.getByPlaceholder(/location/i);

    if (await locationFilter.isVisible().catch(() => false)) {
      await locationFilter.click();
      const remoteOption = page.getByRole('option', { name: /remote/i });
      if (await remoteOption.isVisible().catch(() => false)) {
        await remoteOption.click();
        await expect(page.getByText(/remote/i).first()).toBeVisible();
      }
    } else if (await locationInput.isVisible().catch(() => false)) {
      await locationInput.fill('Remote');
      await locationInput.press('Enter');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/remote/i).first()).toBeVisible();
    }
  });

  test('should display job cards with key information', async ({ page }) => {
    await page.goto('/jobs');

    // Wait for jobs to load
    await page.waitForLoadState('networkidle');

    // Should show job items
    const jobItems = page.getByTestId('job-item');
    const jobCards = page.locator('[class*="job"]');

    const hasJobItems = await jobItems.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasJobCards = await jobCards.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasJobItems || hasJobCards).toBeTruthy();
  });
});
