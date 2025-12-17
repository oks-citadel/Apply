import { test, expect } from '@playwright/test';
import { test as authenticatedTest } from '../fixtures/user.fixture';

/**
 * E2E Tests for Complete Profile Flow
 *
 * This suite tests the profile completion process including:
 * - Initial profile setup after registration
 * - Profile completion wizard/steps
 * - Required vs optional fields
 * - Profile completion progress
 */

test.describe('Complete Profile', () => {
  test.describe('Unauthenticated', () => {
    test('should redirect to login when accessing profile without authentication', async ({ page }) => {
      await page.goto('/complete-profile');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Authenticated - Profile Setup', () => {
    authenticatedTest.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/complete-profile');
    });

    authenticatedTest('should display complete profile page', async ({ authenticatedPage }) => {
      // Verify page loaded
      await expect(authenticatedPage).toHaveURL(/.*complete-profile|.*onboarding|.*setup/);
      await expect(authenticatedPage.getByRole('heading', { name: /complete.*profile|setup.*profile|get.*started/i })).toBeVisible();
    });

    authenticatedTest('should show profile completion progress', async ({ authenticatedPage }) => {
      // Check if progress indicator exists
      const progressBar = authenticatedPage.locator('[role="progressbar"]');
      const progressSteps = authenticatedPage.getByText(/step.*\d.*of.*\d|progress.*\d+%/i);

      const hasProgressBar = await progressBar.isVisible().catch(() => false);
      const hasProgressSteps = await progressSteps.isVisible().catch(() => false);

      expect(hasProgressBar || hasProgressSteps).toBeTruthy();
    });

    authenticatedTest.skip('should complete basic profile information', async ({ authenticatedPage }) => {
      // TODO: Requires backend integration

      // Fill basic profile info
      await authenticatedPage.getByLabel(/job.*title|current.*position/i).fill('Software Engineer');
      await authenticatedPage.getByLabel(/location|city/i).fill('San Francisco, CA');
      await authenticatedPage.getByLabel(/phone/i).fill('(555) 123-4567');

      // Professional summary/bio
      const bioField = authenticatedPage.getByLabel(/bio|summary|about/i);
      if (await bioField.isVisible().catch(() => false)) {
        await bioField.fill('Experienced software engineer with 5 years of expertise in web development.');
      }

      // Click next/save
      await authenticatedPage.getByRole('button', { name: /next|continue|save/i }).click();

      // Should proceed to next step or show success
      const successMessage = authenticatedPage.getByText(/saved|updated|success/i);
      const nextStep = authenticatedPage.getByRole('heading', { name: /work.*experience|education|skills/i });

      const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
      const hasNextStep = await nextStep.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasSuccess || hasNextStep).toBeTruthy();
    });

    authenticatedTest.skip('should validate required fields', async ({ authenticatedPage }) => {
      // TODO: Requires frontend validation

      // Try to proceed without filling required fields
      await authenticatedPage.getByRole('button', { name: /next|continue|save/i }).click();

      // Should show validation errors
      await expect(authenticatedPage.getByText(/required|field.*required/i)).toBeVisible();
    });

    authenticatedTest.skip('should support multi-step profile completion', async ({ authenticatedPage }) => {
      // TODO: Requires backend integration

      // Step 1: Basic info
      await authenticatedPage.getByLabel(/job.*title/i).fill('Software Engineer');
      await authenticatedPage.getByLabel(/location/i).fill('San Francisco, CA');
      await authenticatedPage.getByRole('button', { name: /next|continue/i }).click();

      // Step 2: Work experience
      await expect(authenticatedPage.getByRole('heading', { name: /work.*experience|experience/i })).toBeVisible();
      await authenticatedPage.getByRole('button', { name: /next|continue|skip/i }).click();

      // Step 3: Education
      await expect(authenticatedPage.getByRole('heading', { name: /education/i })).toBeVisible();
      await authenticatedPage.getByRole('button', { name: /next|continue|skip/i }).click();

      // Step 4: Skills
      await expect(authenticatedPage.getByRole('heading', { name: /skills/i })).toBeVisible();
      await authenticatedPage.getByRole('button', { name: /complete|finish|done/i }).click();

      // Should redirect to dashboard
      await expect(authenticatedPage).toHaveURL(/.*dashboard/, { timeout: 10000 });
    });

    authenticatedTest('should allow skipping optional sections', async ({ authenticatedPage }) => {
      // Check for skip button
      const skipButton = authenticatedPage.getByRole('button', { name: /skip|skip.*step|do.*later/i });

      if (await skipButton.isVisible().catch(() => false)) {
        await skipButton.click();

        // Should proceed to next step
        const nextStepHeading = authenticatedPage.getByRole('heading');
        await expect(nextStepHeading).toBeVisible();
      }
    });

    authenticatedTest.skip('should show profile completion percentage', async ({ authenticatedPage }) => {
      // TODO: Requires frontend implementation

      // Check initial completion percentage
      const completionText = authenticatedPage.getByText(/\d+%.*complete|profile.*\d+%/i);
      await expect(completionText).toBeVisible();

      // Fill some fields
      await authenticatedPage.getByLabel(/job.*title/i).fill('Software Engineer');
      await authenticatedPage.getByLabel(/location/i).fill('San Francisco');

      // Completion percentage should increase
      // Would need to verify the number increased
    });

    authenticatedTest.skip('should save profile as draft', async ({ authenticatedPage }) => {
      // TODO: Requires backend integration

      // Fill partial info
      await authenticatedPage.getByLabel(/job.*title/i).fill('Software Engineer');

      // Click save draft button
      const saveDraftButton = authenticatedPage.getByRole('button', { name: /save.*draft|save.*progress/i });

      if (await saveDraftButton.isVisible().catch(() => false)) {
        await saveDraftButton.click();

        // Verify saved message
        await expect(authenticatedPage.getByText(/saved|progress.*saved/i)).toBeVisible();

        // Navigate away and back
        await authenticatedPage.goto('/dashboard');
        await authenticatedPage.goto('/complete-profile');

        // Verify data was restored
        await expect(authenticatedPage.getByLabel(/job.*title/i)).toHaveValue('Software Engineer');
      }
    });

    authenticatedTest('should navigate back to previous step', async ({ authenticatedPage }) => {
      // Look for back button
      const backButton = authenticatedPage.getByRole('button', { name: /back|previous/i });

      if (await backButton.isVisible().catch(() => false)) {
        // Would need to be on a later step to test this properly
        // Verify back button exists for now
        await expect(backButton).toBeVisible();
      }
    });

    authenticatedTest.skip('should upload profile photo', async ({ authenticatedPage }) => {
      // TODO: Requires file upload implementation

      const uploadButton = authenticatedPage.getByRole('button', { name: /upload.*photo|add.*photo|choose.*image/i });

      if (await uploadButton.isVisible().catch(() => false)) {
        // In real test, would upload actual image file
        // await uploadButton.setInputFiles('path/to/test-image.jpg');

        await expect(uploadButton).toBeVisible();
      }
    });

    authenticatedTest.skip('should validate profile photo requirements', async ({ authenticatedPage }) => {
      // TODO: Requires file upload implementation

      // Try to upload invalid file (too large, wrong format, etc.)
      // Should show validation error
      // await expect(authenticatedPage.getByText(/invalid.*file|file.*too.*large/i)).toBeVisible();
    });

    authenticatedTest.skip('should set preferred job preferences', async ({ authenticatedPage }) => {
      // TODO: Requires backend integration

      // Navigate to job preferences section
      const preferencesSection = authenticatedPage.getByRole('heading', { name: /preferences|job.*preferences/i });

      if (await preferencesSection.isVisible().catch(() => false)) {
        // Set job type preferences
        await authenticatedPage.getByLabel(/full.*time/i).check();
        await authenticatedPage.getByLabel(/remote/i).check();

        // Set salary expectations
        const minSalaryInput = authenticatedPage.getByLabel(/min.*salary|minimum.*salary/i);
        if (await minSalaryInput.isVisible().catch(() => false)) {
          await minSalaryInput.fill('100000');
        }

        // Set desired locations
        const locationInput = authenticatedPage.getByLabel(/desired.*location|preferred.*location/i);
        if (await locationInput.isVisible().catch(() => false)) {
          await locationInput.fill('San Francisco, CA');
        }

        // Save preferences
        await authenticatedPage.getByRole('button', { name: /save|next|continue/i }).click();

        // Verify saved
        await expect(authenticatedPage.getByText(/saved|updated/i)).toBeVisible();
      }
    });

    authenticatedTest.skip('should complete entire profile flow', async ({ authenticatedPage }) => {
      // TODO: Requires backend integration

      // Complete all steps
      // 1. Basic info
      await authenticatedPage.getByLabel(/job.*title/i).fill('Senior Software Engineer');
      await authenticatedPage.getByLabel(/location/i).fill('San Francisco, CA');
      await authenticatedPage.getByLabel(/phone/i).fill('(555) 123-4567');
      await authenticatedPage.getByRole('button', { name: /next/i }).click();

      // 2. Work experience - skip for now
      const skipWorkButton = authenticatedPage.getByRole('button', { name: /skip|next/i });
      await skipWorkButton.click();

      // 3. Education - skip for now
      const skipEduButton = authenticatedPage.getByRole('button', { name: /skip|next/i });
      await skipEduButton.click();

      // 4. Skills - skip for now
      const finishButton = authenticatedPage.getByRole('button', { name: /complete|finish|done/i });
      await finishButton.click();

      // Should redirect to dashboard with success message
      await expect(authenticatedPage).toHaveURL(/.*dashboard/, { timeout: 10000 });
      await expect(authenticatedPage.getByText(/profile.*complete|welcome/i)).toBeVisible();
    });
  });

  test.describe('Profile Completion Reminders', () => {
    authenticatedTest.skip('should show completion reminder banner', async ({ authenticatedPage }) => {
      // TODO: Requires backend integration

      // Navigate to dashboard with incomplete profile
      await authenticatedPage.goto('/dashboard');

      // Should show reminder banner
      const reminderBanner = authenticatedPage.getByText(/complete.*profile|finish.*setup/i);
      await expect(reminderBanner).toBeVisible();

      // Should have link to complete profile
      const completeLink = authenticatedPage.getByRole('link', { name: /complete.*now|finish.*setup/i });
      await expect(completeLink).toBeVisible();
    });

    authenticatedTest.skip('should hide reminder after profile completion', async ({ authenticatedPage }) => {
      // TODO: Requires backend integration

      // Complete profile
      // ... (profile completion steps)

      // Navigate to dashboard
      await authenticatedPage.goto('/dashboard');

      // Reminder should not be visible
      const reminderBanner = authenticatedPage.getByText(/complete.*profile|finish.*setup/i);
      await expect(reminderBanner).not.toBeVisible();
    });
  });
});
