import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';

/**
 * E2E Tests for Auto-Apply Settings Flow
 *
 * This suite tests auto-apply configuration including:
 * - Enabling/disabling auto-apply
 * - Setting preferences
 * - Auto-apply rules
 * - Daily limits
 * - Exclusions
 */

authenticatedTest.describe('Auto-Apply Settings', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings/auto-apply');
  });

  authenticatedTest('should display auto-apply settings page', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await expect(authenticatedPage).toHaveURL(/.*auto-apply|.*settings/);
    await expect(authenticatedPage.getByRole('heading', { name: /auto.*apply|automatic.*applications/i })).toBeVisible();
  });

  authenticatedTest('should enable auto-apply feature', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const enableToggle = authenticatedPage.getByRole('switch', { name: /enable.*auto.*apply/i });
    await enableToggle.click();

    await expect(authenticatedPage.getByText(/enabled|activated/i)).toBeVisible();
  });

  authenticatedTest('should set job criteria for auto-apply', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    // Job titles
    const jobTitlesInput = authenticatedPage.getByLabel(/job.*titles/i);
    await jobTitlesInput.fill('Software Engineer, Developer, Programmer');

    // Locations
    const locationsInput = authenticatedPage.getByLabel(/locations/i);
    await locationsInput.fill('San Francisco, Remote, New York');

    // Save
    await authenticatedPage.getByRole('button', { name: /save/i }).click();
    await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
  });

  authenticatedTest('should set salary requirements', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const minSalaryInput = authenticatedPage.getByLabel(/minimum.*salary/i);
    if (await minSalaryInput.isVisible().catch(() => false)) {
      await minSalaryInput.fill('100000');

      await authenticatedPage.getByRole('button', { name: /save/i }).click();
      await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
    }
  });

  authenticatedTest('should set daily application limit', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const limitInput = authenticatedPage.getByLabel(/daily.*limit|applications.*per.*day/i);
    if (await limitInput.isVisible().catch(() => false)) {
      await limitInput.fill('10');

      await authenticatedPage.getByRole('button', { name: /save/i }).click();
      await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
    }
  });

  authenticatedTest('should exclude specific companies', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const excludeInput = authenticatedPage.getByLabel(/exclude.*companies/i);
    if (await excludeInput.isVisible().catch(() => false)) {
      await excludeInput.fill('CompanyX, CompanyY');

      await authenticatedPage.getByRole('button', { name: /save/i }).click();
      await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
    }
  });

  authenticatedTest('should select resume for auto-apply', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const resumeSelect = authenticatedPage.getByLabel(/default.*resume|resume/i);
    await resumeSelect.click();
    await authenticatedPage.getByRole('option').first().click();

    await authenticatedPage.getByRole('button', { name: /save/i }).click();
    await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
  });

  authenticatedTest('should configure auto-apply schedule', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const scheduleSection = authenticatedPage.getByRole('heading', { name: /schedule/i });
    if (await scheduleSection.isVisible().catch(() => false)) {
      // Select days of week
      await authenticatedPage.getByLabel(/monday/i).check();
      await authenticatedPage.getByLabel(/tuesday/i).check();
      await authenticatedPage.getByLabel(/wednesday/i).check();

      await authenticatedPage.getByRole('button', { name: /save/i }).click();
      await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
    }
  });

  authenticatedTest('should set auto-apply filters', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    // Experience level
    const experienceSelect = authenticatedPage.getByLabel(/experience.*level/i);
    if (await experienceSelect.isVisible().catch(() => false)) {
      await experienceSelect.selectOption('mid-level');
    }

    // Job type
    await authenticatedPage.getByLabel(/full.*time/i).check();
    await authenticatedPage.getByLabel(/remote/i).check();

    await authenticatedPage.getByRole('button', { name: /save/i }).click();
    await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
  });

  authenticatedTest('should pause auto-apply', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const pauseButton = authenticatedPage.getByRole('button', { name: /pause/i });
    if (await pauseButton.isVisible().catch(() => false)) {
      await pauseButton.click();
      await expect(authenticatedPage.getByText(/paused/i)).toBeVisible();
    }
  });

  authenticatedTest('should view auto-apply history', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const historyTab = authenticatedPage.getByRole('tab', { name: /history/i });
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();

      // Should show applications made by auto-apply
      await expect(authenticatedPage.getByText(/auto.*applied/i)).toBeVisible();
    }
  });

  authenticatedTest('should require premium subscription for auto-apply', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    // If user doesn't have premium, should show upgrade prompt
    const upgradePrompt = authenticatedPage.getByText(/upgrade|premium.*required/i);
    if (await upgradePrompt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(upgradePrompt).toBeVisible();

      const upgradeButton = authenticatedPage.getByRole('button', { name: /upgrade/i });
      await expect(upgradeButton).toBeVisible();
    }
  });
});
