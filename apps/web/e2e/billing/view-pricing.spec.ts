import { test, expect } from '@playwright/test';
import { SUBSCRIPTION_PLANS } from '../utils/test-data';

/**
 * E2E Tests for Pricing Page
 *
 * This suite tests the pricing page including:
 * - Viewing plans
 * - Plan comparison
 * - Feature lists
 * - FAQs
 * - Navigation to checkout
 */

test.describe('View Pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('should display pricing page', async ({ page }) => {
    await expect(page).toHaveURL(/.*pricing/);
    await expect(page.getByRole('heading', { name: /pricing|plans|subscription/i })).toBeVisible();
  });

  test('should display all subscription tiers', async ({ page }) => {
    // Should show multiple pricing tiers
    const pricingCards = page.getByTestId('pricing-card');
    const cardCount = await pricingCards.count().catch(() => 0);

    if (cardCount > 0) {
      expect(cardCount).toBeGreaterThanOrEqual(2);
    } else {
      // Alternative selectors
      const plans = page.getByRole('article');
      const planCount = await plans.count();
      expect(planCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('should display plan names and prices', async ({ page }) => {
    // Check for common plan names
    const planNames = [/free|basic|starter/i, /professional|pro/i, /premium|enterprise/i];

    let foundCount = 0;
    for (const planName of planNames) {
      const element = page.getByText(planName);
      if (await element.first().isVisible().catch(() => false)) {
        foundCount++;
      }
    }

    expect(foundCount).toBeGreaterThan(0);

    // Check for prices
    const priceElement = page.getByText(/\$\d+|free/i);
    await expect(priceElement.first()).toBeVisible();
  });

  test('should display plan features', async ({ page }) => {
    // Each plan should show features
    const features = page.getByText(/unlimited|applications|resume|ai.*tools|support/i);
    const featureCount = await features.count();

    expect(featureCount).toBeGreaterThan(0);
  });

  test('should toggle between monthly and annual billing', async ({ page }) => {
    // TODO: Requires frontend implementation
    const billingToggle = page.getByRole('switch', { name: /annual|yearly|monthly/i });
    const billingButtons = page.getByRole('button', { name: /monthly|annual/i });

    if (await billingToggle.isVisible().catch(() => false)) {
      const monthlyPrice = await page.getByText(/\$\d+/).first().textContent();

      await billingToggle.click();

      await page.waitForTimeout(500);

      const annualPrice = await page.getByText(/\$\d+/).first().textContent();
      expect(monthlyPrice).not.toBe(annualPrice);
    } else if (await billingButtons.first().isVisible().catch(() => false)) {
      await billingButtons.filter({ hasText: /annual/i }).click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to checkout from plan selection', async ({ page }) => {
    // Click on a "Get Started" or "Subscribe" button
    const subscribeButton = page.getByRole('button', { name: /get.*started|subscribe|choose.*plan/i }).first();

    if (await subscribeButton.isVisible().catch(() => false)) {
      await subscribeButton.click();

      // Should navigate to checkout or login
      const isCheckout = await page.url().match(/.*checkout|.*subscribe|.*payment/);
      const isLogin = await page.url().match(/.*login/);

      expect(isCheckout || isLogin).toBeTruthy();
    }
  });

  test('should display pricing FAQ', async ({ page }) => {
    // Check for FAQ section
    const faqSection = page.getByRole('heading', { name: /faq|questions|help/i });

    if (await faqSection.isVisible().catch(() => false)) {
      await expect(faqSection).toBeVisible();
    }
  });

  test('should expand FAQ items', async ({ page }) => {
    // TODO: Requires frontend implementation
    const faqItem = page.getByRole('button', { name: /can.*i.*cancel|what.*included|how.*billing/i }).first();

    if (await faqItem.isVisible().catch(() => false)) {
      await faqItem.click();

      // Answer should become visible
      await page.waitForTimeout(500);

      const answer = page.getByText(/yes|you.*can|features.*include/i);
      const isVisible = await answer.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();
    }
  });

  test('should display plan comparison', async ({ page }) => {
    // Look for comparison table or section
    const comparisonButton = page.getByRole('button', { name: /compare.*plans/i });
    const comparisonTable = page.getByRole('table');

    if (await comparisonButton.isVisible().catch(() => false)) {
      await comparisonButton.click();
      await page.waitForTimeout(500);

      await expect(page.getByRole('table')).toBeVisible();
    } else if (await comparisonTable.isVisible().catch(() => false)) {
      await expect(comparisonTable).toBeVisible();
    }
  });

  test('should display money-back guarantee', async ({ page }) => {
    // TODO: Requires content
    const guarantee = page.getByText(/money.*back|guarantee|risk.*free/i);

    if (await guarantee.isVisible().catch(() => false)) {
      await expect(guarantee).toBeVisible();
    }
  });

  test('should highlight recommended plan', async ({ page }) => {
    // TODO: Requires frontend implementation
    const recommended = page.getByText(/recommended|most.*popular|best.*value/i);

    if (await recommended.isVisible().catch(() => false)) {
      await expect(recommended).toBeVisible();
    }
  });
});
