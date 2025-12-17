import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';

/**
 * E2E Tests for Save Job Flow
 *
 * This suite tests saving/bookmarking jobs including:
 * - Saving jobs
 * - Viewing saved jobs
 * - Removing saved jobs
 * - Organizing saved jobs
 */

authenticatedTest.describe('Save Jobs', () => {
  authenticatedTest.skip('should save a job from search results', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/jobs');

    const saveButton = authenticatedPage.getByRole('button', { name: /save|bookmark/i }).first();
    await saveButton.click();

    await expect(authenticatedPage.getByText(/saved|bookmarked/i)).toBeVisible();
  });

  authenticatedTest.skip('should save a job from detail page', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/jobs/1');

    const saveButton = authenticatedPage.getByRole('button', { name: /save.*job|bookmark/i });
    await saveButton.click();

    await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
  });

  authenticatedTest.skip('should view saved jobs', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/jobs/saved');

    await expect(authenticatedPage.getByRole('heading', { name: /saved.*jobs/i })).toBeVisible();
    const jobItems = authenticatedPage.getByTestId('job-item');
    expect(await jobItems.count()).toBeGreaterThan(0);
  });

  authenticatedTest.skip('should unsave a job', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/jobs/saved');

    const initialCount = await authenticatedPage.getByTestId('job-item').count();

    const unsaveButton = authenticatedPage.getByRole('button', { name: /unsave|remove/i }).first();
    await unsaveButton.click();

    const newCount = await authenticatedPage.getByTestId('job-item').count();
    expect(newCount).toBe(initialCount - 1);
  });

  authenticatedTest.skip('should organize saved jobs into folders', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.goto('/jobs/saved');

    const createFolderButton = authenticatedPage.getByRole('button', { name: /create.*folder|new.*list/i });
    if (await createFolderButton.isVisible().catch(() => false)) {
      await createFolderButton.click();
      await authenticatedPage.getByLabel(/name/i).fill('High Priority');
      await authenticatedPage.getByRole('button', { name: /create|save/i }).click();

      await expect(authenticatedPage.getByText('High Priority')).toBeVisible();
    }
  });
});
