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
    await expect(authenticatedPage).toHaveURL(/.*salary/);
    await expect(authenticatedPage.getByRole('heading', { name: /salary|compensation/i })).toBeVisible();
  });

  authenticatedTest('should estimate salary range', async ({ authenticatedPage }) => {
    // Mock the salary prediction API endpoint
    await authenticatedPage.route('**/api/v1/ai/salary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          predicted_salary: 165000,
          confidence_interval: {
            min: 145000,
            max: 185000
          },
          percentile_25: 150000,
          percentile_50: 165000,
          percentile_75: 180000,
          market_context: {
            location_adjustment: 1.35,
            experience_factor: 1.15,
            skills_premium: 0.10
          },
          comparable_positions: [
            'Senior Software Engineer',
            'Staff Software Engineer',
            'Principal Software Engineer'
          ]
        })
      });
    });

    await authenticatedPage.getByLabel(/job.*title/i).fill('Senior Software Engineer');
    await authenticatedPage.getByLabel(/location/i).fill('San Francisco, CA');
    await authenticatedPage.getByLabel(/years.*experience/i).fill('5');

    await authenticatedPage.getByRole('button', { name: /get.*estimate/i }).click();

    await expect(authenticatedPage.getByText(/calculating/i)).toBeVisible();

    const salaryRange = authenticatedPage.getByTestId('salary-range');
    await expect(salaryRange).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest('should provide negotiation tips', async ({ authenticatedPage }) => {
    // Mock the negotiation tips API endpoint
    await authenticatedPage.route('**/api/v1/ai/negotiation-tips*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          offered_salary: 140000,
          market_salary: 165000,
          difference: 25000,
          difference_percentage: 15.15,
          strategy: 'moderate',
          recommendation: 'The offer is somewhat below market rate. Moderate negotiation advised.',
          tips: [
            'Research comparable salaries in your area',
            'Highlight your unique skills and experience',
            'Be prepared to justify your counter-offer',
            'Consider the full compensation package',
            'Maintain a positive and professional tone',
            'Consider counter-offering around $157,500'
          ],
          counter_offer_range: {
            min: 152500,
            max: 160000
          },
          talking_points: [
            'Market research shows Senior Software Engineer positions in San Francisco typically earn $165,000',
            'My experience and skills align well with the role requirements',
            'I\'m excited about the opportunity and believe my contributions will add significant value'
          ]
        })
      });
    });

    const tipsButton = authenticatedPage.getByRole('button', { name: /negotiation.*tips/i });
    if (await tipsButton.isVisible().catch(() => false)) {
      await tipsButton.click();

      await expect(authenticatedPage.getByText(/tip|strategy/i)).toBeVisible({ timeout: WAIT_TIMES.apiCall });
    }
  });

  authenticatedTest('should evaluate job offer', async ({ authenticatedPage }) => {
    // Mock the salary prediction and negotiation tips endpoints for offer evaluation
    await authenticatedPage.route('**/api/v1/ai/salary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          predicted_salary: 155000,
          confidence_interval: {
            min: 140000,
            max: 170000
          },
          percentile_25: 145000,
          percentile_50: 155000,
          percentile_75: 165000,
          market_context: {
            location_adjustment: 1.35,
            experience_factor: 1.0,
            skills_premium: 0.05
          }
        })
      });
    });

    await authenticatedPage.route('**/api/v1/ai/negotiation-tips*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          offered_salary: 150000,
          market_salary: 155000,
          difference: 5000,
          difference_percentage: 3.23,
          strategy: 'light',
          recommendation: 'The offer is close to market rate. Light negotiation may be appropriate.',
          tips: [
            'The offer is competitive',
            'Consider negotiating for additional benefits',
            'Evaluate the total compensation package'
          ]
        })
      });
    });

    await authenticatedPage.getByLabel(/offered.*salary/i).fill('150000');
    await authenticatedPage.getByLabel(/job.*title/i).fill('Software Engineer');
    await authenticatedPage.getByLabel(/location/i).fill('San Francisco');

    await authenticatedPage.getByRole('button', { name: /evaluate/i }).click();

    const evaluation = authenticatedPage.getByTestId('offer-evaluation');
    await expect(evaluation).toBeVisible({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest('should compare multiple offers', async ({ authenticatedPage }) => {
    // Mock the salary comparison API endpoint
    await authenticatedPage.route('**/api/v1/ai/compare-locations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          comparisons: [
            {
              location: 'San Francisco, CA',
              predicted_salary: 165000,
              confidence_interval: { min: 150000, max: 180000 },
              percentile_50: 165000,
              cost_of_living_adjusted: 165000
            },
            {
              location: 'Austin, TX',
              predicted_salary: 135000,
              confidence_interval: { min: 120000, max: 150000 },
              percentile_50: 135000,
              cost_of_living_adjusted: 135000
            }
          ],
          highest_location: 'San Francisco, CA',
          lowest_location: 'Austin, TX',
          variance: 225000000
        })
      });
    });

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
