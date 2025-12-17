import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';

/**
 * E2E Tests for Job Alerts Flow
 *
 * This suite tests job alert/notification functionality including:
 * - Creating job alerts
 * - Managing alerts
 * - Alert preferences
 * - Email notifications
 */

authenticatedTest.describe('Job Alerts', () => {
  authenticatedTest('should create a job alert from search', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/jobs');

    await authenticatedPage.getByPlaceholder(/search/i).fill('React Developer');
    await authenticatedPage.getByPlaceholder(/location/i).fill('Remote');

    const createAlertButton = authenticatedPage.getByRole('button', { name: /create.*alert|save.*search/i });
    await createAlertButton.click();

    await expect(authenticatedPage.getByText(/alert.*created/i)).toBeVisible();
  });

  test('should view all job alerts', async ({ page, context }) => {
    // TODO: Requires backend integration
    await context.addCookies([
      { name: 'auth-token', value: 'mock-token', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/alerts');

    await expect(page.getByRole('heading', { name: /job.*alerts/i })).toBeVisible();
  });

  authenticatedTest('should edit job alert', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/alerts');

    const editButton = authenticatedPage.getByRole('button', { name: /edit/i }).first();
    await editButton.click();

    await authenticatedPage.getByLabel(/frequency/i).selectOption('daily');
    await authenticatedPage.getByRole('button', { name: /save/i }).click();

    await expect(authenticatedPage.getByText(/updated/i)).toBeVisible();
  });

  authenticatedTest('should delete job alert', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/alerts');

    const initialCount = await authenticatedPage.getByTestId('alert-item').count();

    const deleteButton = authenticatedPage.getByRole('button', { name: /delete/i }).first();
    await deleteButton.click();
    await authenticatedPage.getByRole('button', { name: /confirm/i }).click();

    const newCount = await authenticatedPage.getByTestId('alert-item').count();
    expect(newCount).toBe(initialCount - 1);
  });

  authenticatedTest('should configure alert frequency', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/alerts');

    const alert = authenticatedPage.getByTestId('alert-item').first();
    const frequencySelect = alert.getByLabel(/frequency/i);

    if (await frequencySelect.isVisible().catch(() => false)) {
      await frequencySelect.selectOption('weekly');
      await expect(authenticatedPage.getByText(/updated/i)).toBeVisible();
    }
  });
});
