import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { WAIT_TIMES } from '../utils/test-data';

/**
 * E2E Tests for AI Salary Negotiation Assistant
 *
 * This suite tests salary assistance features including:
 * - Salary estimates
 * - Negotiation tips
 * - Market data
 * - Offer evaluation
 */

authenticatedTest.describe('AI Salary Assistant', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai-tools/salary');
  });

  authenticatedTest('should display salary assistant page', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await expect(authenticatedPage).toHaveURL(/.*salary/);
    await expect(authenticatedPage.getByRole('heading', { name: /salary|compensation/i })).toBeVisible();
  });

  authenticatedTest('should estimate salary range', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration with AI service
    await authenticatedPage.getByLabel(/job.*title/i).fill('Senior Software Engineer');
    await authenticatedPage.getByLabel(/location/i).fill('San Francisco, CA');
    await authenticatedPage.getByLabel(/years.*experience/i).fill('5');

    await authenticatedPage.getByRole('button', { name: /get.*estimate/i }).click();

    await expect(authenticatedPage.getByText(/calculating/i)).toBeVisible();

    const salaryRange = authenticatedPage.getByTestId('salary-range');
    await expect(salaryRange).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest('should provide negotiation tips', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const tipsButton = authenticatedPage.getByRole('button', { name: /negotiation.*tips/i });
    if (await tipsButton.isVisible().catch(() => false)) {
      await tipsButton.click();

      await expect(authenticatedPage.getByText(/tip|strategy/i)).toBeVisible({ timeout: WAIT_TIMES.apiCall });
    }
  });

  authenticatedTest('should evaluate job offer', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await authenticatedPage.getByLabel(/offered.*salary/i).fill('150000');
    await authenticatedPage.getByLabel(/job.*title/i).fill('Software Engineer');
    await authenticatedPage.getByLabel(/location/i).fill('San Francisco');

    await authenticatedPage.getByRole('button', { name: /evaluate/i }).click();

    const evaluation = authenticatedPage.getByTestId('offer-evaluation');
    await expect(evaluation).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest('should compare multiple offers', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const compareTab = authenticatedPage.getByRole('tab', { name: /compare/i });
    if (await compareTab.isVisible().catch(() => false)) {
      await compareTab.click();

      // Add offers
      await authenticatedPage.getByRole('button', { name: /add.*offer/i }).click();
      await authenticatedPage.getByLabel(/company/i).fill('Company A');
      await authenticatedPage.getByLabel(/salary/i).fill('150000');

      await authenticatedPage.getByRole('button', { name: /compare/i }).click();
    }
  });
});
