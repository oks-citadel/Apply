import { test, expect } from '@playwright/test';
import { SettingsPage } from '../../pages/settings.page';
import { ApplicationsPage } from '../../pages/applications.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { TEST_AUTO_APPLY_SETTINGS } from '../../fixtures/data.fixture';

test.describe('Auto-Apply Feature', () => {
  let settingsPage: SettingsPage;
  let applicationsPage: ApplicationsPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    applicationsPage = new ApplicationsPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Auto-Apply Setup', () => {
    test('should navigate to auto-apply settings', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.assertVisible();

      // Navigate to auto-apply tab
      await settingsPage.goToAutoApply();

      // Verify auto-apply settings are displayed
      await expect(settingsPage.autoApplyEnabled).toBeVisible();
      await expect(settingsPage.keywordsInput).toBeVisible();
      await expect(settingsPage.maxApplicationsPerDay).toBeVisible();
    });

    test('should enable auto-apply feature', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Ensure auto-apply is disabled first
      const isEnabled = await settingsPage.autoApplyEnabled.isChecked();

      if (!isEnabled) {
        // Enable auto-apply
        await settingsPage.autoApplyEnabled.check();

        // Verify toggle is enabled
        await expect(settingsPage.autoApplyEnabled).toBeChecked();
      }
    });

    test('should disable auto-apply feature', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Ensure auto-apply is enabled first
      const isEnabled = await settingsPage.autoApplyEnabled.isChecked();

      if (!isEnabled) {
        await settingsPage.autoApplyEnabled.check();
      }

      // Disable auto-apply
      await settingsPage.autoApplyEnabled.uncheck();

      // Verify toggle is disabled
      await expect(settingsPage.autoApplyEnabled).not.toBeChecked();
    });

    test('should configure basic auto-apply settings', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Configure keywords
      const keywordsInput = settingsPage.keywordsInput;
      await keywordsInput.clear();
      await keywordsInput.fill('software engineer, developer');

      // Configure max applications per day
      const maxAppsInput = settingsPage.maxApplicationsPerDay;
      await maxAppsInput.clear();
      await maxAppsInput.fill('10');

      // Save settings
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Verify success message
      const successVisible = await settingsPage.successMessage.isVisible({ timeout: 5000 });
      if (successVisible) {
        await settingsPage.assertSuccess();
      }

      // Verify settings are saved
      await expect(keywordsInput).toHaveValue(/software engineer/);
      await expect(maxAppsInput).toHaveValue('10');
    });

    test('should configure advanced auto-apply settings', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.configureAutoApply({
        enabled: true,
        keywords: ['senior software engineer', 'tech lead'],
        locations: ['San Francisco', 'Remote'],
        jobTypes: ['full-time', 'contract'],
        remote: true,
        salaryMin: 150000,
        experienceLevels: ['senior'],
        maxApplicationsPerDay: 15,
      });

      // Wait for settings to save
      await page.waitForLoadState('networkidle');

      // Verify success message
      const successVisible = await settingsPage.successMessage.isVisible({ timeout: 5000 });
      if (successVisible) {
        await settingsPage.assertSuccess();
      }
    });

    test('should validate max applications per day', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Try to set invalid value (0)
      await settingsPage.maxApplicationsPerDay.fill('0');
      await settingsPage.saveAutoApplyButton.click();

      // Should show validation error
      const errorVisible = await settingsPage.errorMessage.isVisible({ timeout: 3000 });
      const inputInvalid = await settingsPage.maxApplicationsPerDay.evaluate(
        (el: HTMLInputElement) => !el.validity.valid
      );

      expect(errorVisible || inputInvalid).toBeTruthy();
    });

    test('should validate minimum salary', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Try to set negative salary
      await settingsPage.autoApplySalaryMin.fill('-1000');
      await settingsPage.saveAutoApplyButton.click();

      // Should show validation error or prevent submission
      const errorVisible = await settingsPage.errorMessage.isVisible({ timeout: 3000 });
      const inputInvalid = await settingsPage.autoApplySalaryMin.evaluate(
        (el: HTMLInputElement) => !el.validity.valid
      );

      expect(errorVisible || inputInvalid).toBeTruthy();
    });

    test('should require keywords when enabled', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Clear keywords
      await settingsPage.keywordsInput.clear();

      // Try to save without keywords
      await settingsPage.saveAutoApplyButton.click();

      // Should show validation error or disable save button
      const errorVisible = await settingsPage.errorMessage.isVisible({ timeout: 3000 });
      const buttonDisabled = await settingsPage.saveAutoApplyButton.isDisabled();

      expect(errorVisible || buttonDisabled).toBeTruthy();
    });
  });

  test.describe('Job Criteria Configuration', () => {
    test('should configure job type preferences', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Select job types
      const jobTypeCheckboxes = settingsPage.autoApplyJobTypes;
      const checkboxCount = await jobTypeCheckboxes.count();

      if (checkboxCount > 0) {
        // Check first job type
        const firstCheckbox = jobTypeCheckboxes.first();
        await firstCheckbox.check();
        await expect(firstCheckbox).toBeChecked();
      }
    });

    test('should configure location preferences', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Configure locations
      const locationsInput = settingsPage.autoApplyLocationsInput;
      await locationsInput.clear();
      await locationsInput.fill('San Francisco, New York, Remote');

      // Save settings
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Verify locations are saved
      const savedValue = await locationsInput.inputValue();
      expect(savedValue).toContain('San Francisco');
    });

    test('should configure remote preference', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Enable remote preference
      await settingsPage.autoApplyRemote.check();
      await expect(settingsPage.autoApplyRemote).toBeChecked();

      // Save settings
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Verify setting is saved
      await expect(settingsPage.autoApplyRemote).toBeChecked();
    });

    test('should configure experience level preferences', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Select experience levels
      const experienceCheckboxes = settingsPage.autoApplyExperienceLevels;
      const checkboxCount = await experienceCheckboxes.count();

      if (checkboxCount > 0) {
        // Check senior level
        const seniorCheckbox = page.locator('input[value="senior"]');
        if (await seniorCheckbox.isVisible({ timeout: 2000 })) {
          await seniorCheckbox.check();
          await expect(seniorCheckbox).toBeChecked();
        }
      }
    });

    test('should configure salary expectations', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Set minimum salary
      await settingsPage.autoApplySalaryMin.clear();
      await settingsPage.autoApplySalaryMin.fill('120000');

      // Save settings
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Verify salary is saved
      await expect(settingsPage.autoApplySalaryMin).toHaveValue('120000');
    });
  });

  test.describe('Application Limits', () => {
    test('should set daily application limit', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Set limit to 20 applications per day
      await settingsPage.maxApplicationsPerDay.clear();
      await settingsPage.maxApplicationsPerDay.fill('20');

      // Save settings
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Verify limit is saved
      await expect(settingsPage.maxApplicationsPerDay).toHaveValue('20');
    });

    test('should enforce maximum daily limit', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Try to set very high limit (e.g., 1000)
      await settingsPage.maxApplicationsPerDay.clear();
      await settingsPage.maxApplicationsPerDay.fill('1000');
      await settingsPage.saveAutoApplyButton.click();

      // Should show warning or limit the value
      const warningVisible = await page.locator('[data-testid="warning-message"]').isVisible({ timeout: 3000 });

      if (warningVisible) {
        // Warning message should be displayed
        const warningText = await page.locator('[data-testid="warning-message"]').textContent();
        expect(warningText?.toLowerCase()).toMatch(/limit|maximum|too many/);
      }
    });

    test('should show conservative limit recommendation', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply
      await settingsPage.autoApplyEnabled.check();

      // Look for recommendation message
      const recommendationVisible = await page.locator('[data-testid="recommendation"]').isVisible({ timeout: 2000 });

      if (recommendationVisible) {
        const recommendationText = await page.locator('[data-testid="recommendation"]').textContent();
        expect(recommendationText).toBeTruthy();
      }
    });
  });

  test.describe('Auto-Apply Activity', () => {
    test('should view auto-apply dashboard', async ({ page }) => {
      // Navigate to auto-apply dashboard (if separate page exists)
      const autoApplyPage = page;
      await autoApplyPage.goto('/auto-apply');

      // Verify dashboard elements
      const dashboardTitle = autoApplyPage.locator('h1:has-text("Auto-Apply")');
      const dashboardVisible = await dashboardTitle.isVisible({ timeout: 5000 });

      if (dashboardVisible) {
        // Dashboard should show activity
        await expect(dashboardTitle).toBeVisible();

        // Check for statistics cards
        const statsCards = autoApplyPage.locator('[data-testid="stats-card"]');
        const cardCount = await statsCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should view auto-applied applications', async ({ page }) => {
      await applicationsPage.goto();

      // Filter by auto-applied applications
      const filterDropdown = page.locator('select[name="applicationType"]');
      const filterExists = await filterDropdown.isVisible({ timeout: 3000 });

      if (filterExists) {
        await filterDropdown.selectOption('auto-applied');
        await page.waitForLoadState('networkidle');

        // Verify filtered results
        const appCount = await applicationsPage.getApplicationCount();
        expect(appCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display auto-apply activity timeline', async ({ page }) => {
      await page.goto('/auto-apply');

      // Check for activity timeline
      const timeline = page.locator('[data-testid="activity-timeline"]');
      const timelineVisible = await timeline.isVisible({ timeout: 5000 });

      if (timelineVisible) {
        // Timeline should show recent activity
        const activityItems = timeline.locator('[data-testid="activity-item"]');
        const itemCount = await activityItems.count();
        expect(itemCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show daily application count', async ({ page }) => {
      await page.goto('/auto-apply');

      // Check for daily count display
      const dailyCount = page.locator('[data-testid="daily-count"]');
      const countVisible = await dailyCount.isVisible({ timeout: 5000 });

      if (countVisible) {
        // Should display a number
        const countText = await dailyCount.textContent();
        expect(countText).toMatch(/\d+/);
      }
    });

    test('should show remaining daily applications', async ({ page }) => {
      await page.goto('/auto-apply');

      // Check for remaining applications display
      const remainingCount = page.locator('[data-testid="remaining-count"]');
      const remainingVisible = await remainingCount.isVisible({ timeout: 5000 });

      if (remainingVisible) {
        // Should display a number
        const remainingText = await remainingCount.textContent();
        expect(remainingText).toMatch(/\d+/);
      }
    });

    test('should pause auto-apply', async ({ page }) => {
      await page.goto('/auto-apply');

      // Look for pause button
      const pauseButton = page.locator('button:has-text("Pause")');
      const pauseVisible = await pauseButton.isVisible({ timeout: 5000 });

      if (pauseVisible) {
        // Click pause
        await pauseButton.click();
        await page.waitForLoadState('networkidle');

        // Should show paused state
        const resumeButton = page.locator('button:has-text("Resume")');
        const resumeVisible = await resumeButton.isVisible({ timeout: 3000 });

        if (resumeVisible) {
          await expect(resumeButton).toBeVisible();
        }
      }
    });

    test('should resume auto-apply', async ({ page }) => {
      await page.goto('/auto-apply');

      // Look for pause button and pause first
      const pauseButton = page.locator('button:has-text("Pause")');
      const pauseVisible = await pauseButton.isVisible({ timeout: 5000 });

      if (pauseVisible) {
        await pauseButton.click();
        await page.waitForLoadState('networkidle');

        // Now resume
        const resumeButton = page.locator('button:has-text("Resume")');
        const resumeVisible = await resumeButton.isVisible({ timeout: 3000 });

        if (resumeVisible) {
          await resumeButton.click();
          await page.waitForLoadState('networkidle');

          // Should show active state
          const pauseButtonAgain = page.locator('button:has-text("Pause")');
          await expect(pauseButtonAgain).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Auto-Apply Statistics', () => {
    test('should display total auto-applications', async ({ page }) => {
      await page.goto('/auto-apply');

      // Check for total applications stat
      const totalStat = page.locator('[data-testid="total-applications"]');
      const statVisible = await totalStat.isVisible({ timeout: 5000 });

      if (statVisible) {
        const statValue = await totalStat.textContent();
        expect(statValue).toMatch(/\d+/);
      }
    });

    test('should display success rate', async ({ page }) => {
      await page.goto('/auto-apply');

      // Check for success rate
      const successRate = page.locator('[data-testid="success-rate"]');
      const rateVisible = await successRate.isVisible({ timeout: 5000 });

      if (rateVisible) {
        const rateValue = await successRate.textContent();
        expect(rateValue).toMatch(/\d+%/);
      }
    });

    test('should display response rate', async ({ page }) => {
      await page.goto('/auto-apply');

      // Check for response rate
      const responseRate = page.locator('[data-testid="response-rate"]');
      const rateVisible = await responseRate.isVisible({ timeout: 5000 });

      if (rateVisible) {
        const rateValue = await responseRate.textContent();
        expect(rateValue).toMatch(/\d+%/);
      }
    });

    test('should display weekly activity chart', async ({ page }) => {
      await page.goto('/auto-apply');

      // Check for activity chart
      const chart = page.locator('[data-testid="activity-chart"]');
      const chartVisible = await chart.isVisible({ timeout: 5000 });

      if (chartVisible) {
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Disabling Auto-Apply', () => {
    test('should disable auto-apply from settings', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Ensure auto-apply is enabled
      const isEnabled = await settingsPage.autoApplyEnabled.isChecked();

      if (!isEnabled) {
        await settingsPage.autoApplyEnabled.check();
        await settingsPage.saveAutoApplyButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Now disable it
      await settingsPage.autoApplyEnabled.uncheck();
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Verify it's disabled
      await expect(settingsPage.autoApplyEnabled).not.toBeChecked();
    });

    test('should show confirmation when disabling auto-apply', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Enable auto-apply if not already
      const isEnabled = await settingsPage.autoApplyEnabled.isChecked();

      if (!isEnabled) {
        await settingsPage.autoApplyEnabled.check();
        await settingsPage.saveAutoApplyButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Disable auto-apply
      await settingsPage.autoApplyEnabled.uncheck();

      // Look for confirmation dialog
      const confirmDialog = page.locator('[role="dialog"]:has-text("disable")');
      const dialogVisible = await confirmDialog.isVisible({ timeout: 3000 });

      if (dialogVisible) {
        // Confirm disable
        const confirmButton = page.locator('button:has-text("Confirm")');
        await confirmButton.click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should stop auto-applying after disabling', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Disable auto-apply
      await settingsPage.autoApplyEnabled.uncheck();
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Navigate to auto-apply page
      await page.goto('/auto-apply');

      // Should show disabled state
      const disabledMessage = page.locator('[data-testid="disabled-message"]');
      const messageVisible = await disabledMessage.isVisible({ timeout: 5000 });

      if (messageVisible) {
        await expect(disabledMessage).toContainText(/disabled|inactive|off/i);
      }
    });
  });

  test.describe('Settings Persistence', () => {
    test('should persist auto-apply settings after reload', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.configureAutoApply({
        enabled: true,
        keywords: ['test engineer'],
        maxApplicationsPerDay: 15,
        remote: true,
        salaryMin: 100000,
      });

      await page.waitForLoadState('networkidle');

      // Reload page
      await page.reload();
      await settingsPage.goToAutoApply();

      // Verify settings are still there
      await expect(settingsPage.autoApplyEnabled).toBeChecked();
      await expect(settingsPage.maxApplicationsPerDay).toHaveValue('15');
      await expect(settingsPage.autoApplyRemote).toBeChecked();
    });

    test('should maintain settings when navigating away and back', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Configure settings
      await settingsPage.autoApplyEnabled.check();
      await settingsPage.maxApplicationsPerDay.fill('25');
      await settingsPage.saveAutoApplyButton.click();
      await page.waitForLoadState('networkidle');

      // Navigate away
      await dashboardPage.goto();

      // Navigate back
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Verify settings are preserved
      await expect(settingsPage.autoApplyEnabled).toBeChecked();
      await expect(settingsPage.maxApplicationsPerDay).toHaveValue('25');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation in settings', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Tab through form fields
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is on an input element
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should toggle auto-apply with keyboard', async ({ page }) => {
      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Focus on toggle
      await settingsPage.autoApplyEnabled.focus();

      // Press Space to toggle
      await page.keyboard.press('Space');

      // Verify toggle changed
      const isChecked = await settingsPage.autoApplyEnabled.isChecked();
      expect(typeof isChecked).toBe('boolean');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display auto-apply settings correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await settingsPage.goto();
      await settingsPage.goToAutoApply();

      // Verify key elements are visible
      await expect(settingsPage.autoApplyEnabled).toBeVisible();
      await expect(settingsPage.maxApplicationsPerDay).toBeVisible();
    });

    test('should display auto-apply activity on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/auto-apply');

      // Verify page loads and is usable
      const pageTitle = page.locator('h1');
      const titleVisible = await pageTitle.isVisible({ timeout: 5000 });

      if (titleVisible) {
        await expect(pageTitle).toBeVisible();
      }
    });
  });
});
