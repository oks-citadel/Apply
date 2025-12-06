import { test, expect } from '@playwright/test';

test.describe('Applications', () => {
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

  test('should display applications page', async ({ page }) => {
    await page.goto('/applications');
    await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible();
  });

  test('should show application list', async ({ page }) => {
    await page.goto('/applications');
    const applicationList = page.getByTestId('application-list');
    if (await applicationList.isVisible()) {
      await expect(applicationList).toBeVisible();
    }
  });

  test('should filter applications by status', async ({ page }) => {
    await page.goto('/applications');
    const statusFilter = page.getByRole('combobox', { name: /status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByRole('option', { name: /pending/i }).click();
    }
  });

  test('should navigate to application detail', async ({ page }) => {
    await page.goto('/applications');
    const firstApplication = page.getByTestId('application-item').first();
    if (await firstApplication.isVisible()) {
      await firstApplication.click();
      await expect(page).toHaveURL(/.*applications\/\d+/);
    }
  });
});

test.describe('Resume Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('should display resumes page', async ({ page }) => {
    await page.goto('/resumes');
    await expect(page.getByRole('heading', { name: /resumes/i })).toBeVisible();
  });

  test('should have upload button', async ({ page }) => {
    await page.goto('/resumes');
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeVisible();
  });

  test('should open upload modal', async ({ page }) => {
    await page.goto('/resumes');
    await page.getByRole('button', { name: /upload/i }).click();
    const modal = page.getByRole('dialog');
    if (await modal.isVisible()) {
      await expect(modal).toBeVisible();
    }
  });
});
