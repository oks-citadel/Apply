import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';
import { AI_PROMPTS, WAIT_TIMES } from '../utils/test-data';

/**
 * E2E Tests for AI Cover Letter Generator
 *
 * This suite tests AI cover letter generation including:
 * - Generating cover letters
 * - Customizing prompts
 * - Editing generated content
 * - Saving cover letters
 */

authenticatedTest.describe('AI Cover Letter Generator', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ai-tools/cover-letter');
  });

  authenticatedTest.skip('should display cover letter generator page', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    await expect(authenticatedPage).toHaveURL(/.*cover-letter|.*ai-tools/);
    await expect(authenticatedPage.getByRole('heading', { name: /cover.*letter/i })).toBeVisible();
  });

  authenticatedTest.skip('should generate cover letter from job posting', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration with AI service
    const jobUrlInput = authenticatedPage.getByLabel(/job.*url|paste.*job/i);
    await jobUrlInput.fill('https://example.com/job/12345');

    const generateButton = authenticatedPage.getByRole('button', { name: /generate/i });
    await generateButton.click();

    // Show loading state
    await expect(authenticatedPage.getByText(/generating/i)).toBeVisible();

    // Wait for AI response
    const coverLetterOutput = authenticatedPage.getByTestId('cover-letter-output');
    await expect(coverLetterOutput).not.toBeEmpty({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest.skip('should generate cover letter from job description', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const jobDescInput = authenticatedPage.getByLabel(/job.*description/i);
    await jobDescInput.fill('We are looking for a Senior Software Engineer with 5+ years experience...');

    await authenticatedPage.getByRole('button', { name: /generate/i }).click();

    await expect(authenticatedPage.getByText(/generating/i)).toBeVisible();
    await expect(authenticatedPage.getByTestId('cover-letter-output')).not.toBeEmpty({ timeout: WAIT_TIMES.aiGeneration });
  });

  authenticatedTest.skip('should customize tone of cover letter', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const toneSelect = authenticatedPage.getByLabel(/tone|style/i);
    if (await toneSelect.isVisible().catch(() => false)) {
      await toneSelect.selectOption('professional');

      await authenticatedPage.getByRole('button', { name: /generate/i }).click();
      await authenticatedPage.waitForTimeout(WAIT_TIMES.aiGeneration);
    }
  });

  authenticatedTest.skip('should edit generated cover letter', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    // After generation
    const output = authenticatedPage.getByTestId('cover-letter-output');
    await expect(output).toBeVisible();

    // Make it editable
    const editButton = authenticatedPage.getByRole('button', { name: /edit/i });
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();

      await output.fill('Modified cover letter content...');
    }
  });

  authenticatedTest.skip('should save generated cover letter', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const saveButton = authenticatedPage.getByRole('button', { name: /save/i });
    await saveButton.click();

    await expect(authenticatedPage.getByText(/saved/i)).toBeVisible();
  });

  authenticatedTest.skip('should regenerate cover letter', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const regenerateButton = authenticatedPage.getByRole('button', { name: /regenerate|try.*again/i });
    if (await regenerateButton.isVisible().catch(() => false)) {
      await regenerateButton.click();
      await expect(authenticatedPage.getByText(/generating/i)).toBeVisible();
    }
  });

  authenticatedTest.skip('should copy cover letter to clipboard', async ({ authenticatedPage }) => {
    // TODO: Requires backend integration
    const copyButton = authenticatedPage.getByRole('button', { name: /copy/i });
    await copyButton.click();

    await expect(authenticatedPage.getByText(/copied/i)).toBeVisible();
  });
});
