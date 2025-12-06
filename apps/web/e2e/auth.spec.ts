import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
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
  });

  test('should display dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display application statistics', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/total applications/i)).toBeVisible();
    await expect(page.getByText(/response rate/i)).toBeVisible();
  });
});

test.describe('Jobs', () => {
  test('should display jobs listing page', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { name: /jobs/i })).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/jobs');
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should filter jobs by location', async ({ page }) => {
    await page.goto('/jobs');
    const locationFilter = page.getByRole('combobox', { name: /location/i });
    if (await locationFilter.isVisible()) {
      await locationFilter.click();
      await page.getByRole('option', { name: /remote/i }).click();
      await expect(page.getByText(/remote/i)).toBeVisible();
    }
  });
});
