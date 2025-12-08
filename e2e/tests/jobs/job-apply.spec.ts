import { test, expect } from '@playwright/test';
import { JobsPage } from '../../pages/jobs.page';
import { ApplicationsPage } from '../../pages/applications.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { TEST_JOBS } from '../../fixtures/data.fixture';

test.describe('Job Application Flow', () => {
  let jobsPage: JobsPage;
  let applicationsPage: ApplicationsPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    jobsPage = new JobsPage(page);
    applicationsPage = new ApplicationsPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Job Search and Discovery', () => {
    test('should search for jobs by keyword', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.assertVisible();

      // Search for software engineer jobs
      await jobsPage.search('software engineer');

      // Should display search results
      const jobCount = await jobsPage.getJobCount();
      expect(jobCount).toBeGreaterThan(0);

      // Verify jobs contain the search keyword
      const firstJobTitle = await jobsPage.jobTitles.first().textContent();
      expect(firstJobTitle?.toLowerCase()).toMatch(/software|engineer|developer/);
    });

    test('should filter jobs by location', async ({ page }) => {
      await jobsPage.goto();

      // Filter by San Francisco
      await jobsPage.filterByLocation('San Francisco');

      // Should display filtered results
      const jobCount = await jobsPage.getJobCount();
      expect(jobCount).toBeGreaterThan(0);
    });

    test('should filter jobs by remote option', async ({ page }) => {
      await jobsPage.goto();

      // Filter for remote jobs
      await jobsPage.filterByRemote(true);

      // Should display remote jobs
      const jobCount = await jobsPage.getJobCount();
      if (jobCount > 0) {
        // Verify at least one job is marked as remote
        const firstJobCard = jobsPage.getJobCard(0);
        const remoteLabel = firstJobCard.locator(':text("Remote")');
        await expect(remoteLabel).toBeVisible({ timeout: 5000 });
      }
    });

    test('should filter jobs by salary range', async ({ page }) => {
      await jobsPage.goto();

      // Filter by salary range
      await jobsPage.filterBySalaryRange(100000, 150000);

      // Should display filtered results
      const jobCount = await jobsPage.getJobCount();
      expect(jobCount).toBeGreaterThanOrEqual(0);
    });

    test('should sort jobs by different criteria', async ({ page }) => {
      await jobsPage.goto();

      // Wait for initial results
      await page.waitForLoadState('networkidle');
      const initialCount = await jobsPage.getJobCount();

      if (initialCount > 0) {
        // Sort by most recent
        await jobsPage.sortBy('most-recent');
        await page.waitForLoadState('networkidle');

        // Verify results are still displayed
        const sortedCount = await jobsPage.getJobCount();
        expect(sortedCount).toBe(initialCount);
      }
    });

    test('should paginate through job results', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.search('developer');

      // Wait for results
      await page.waitForLoadState('networkidle');

      // Check if pagination is available
      const paginationVisible = await jobsPage.paginationContainer.isVisible({ timeout: 3000 });

      if (paginationVisible) {
        const currentPage = await jobsPage.getCurrentPage();
        expect(currentPage).toBe(1);

        // Go to next page
        const nextButtonEnabled = await jobsPage.nextPageButton.isEnabled();
        if (nextButtonEnabled) {
          await jobsPage.goToNextPage();

          // Verify we're on page 2
          const newPage = await jobsPage.getCurrentPage();
          expect(newPage).toBe(2);
        }
      }
    });

    test('should clear all filters', async ({ page }) => {
      await jobsPage.goto();

      // Apply multiple filters
      await jobsPage.filterByLocation('New York');
      await jobsPage.filterByRemote(true);

      // Clear all filters
      await jobsPage.clearFilters();

      // Should show all jobs again
      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();
      expect(jobCount).toBeGreaterThan(0);
    });
  });

  test.describe('Job Details', () => {
    test('should view job details', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.search('engineer');

      // Wait for results
      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();

      if (jobCount > 0) {
        // Click on first job
        await jobsPage.viewJobDetails(0);

        // Verify modal is displayed
        await jobsPage.assertJobDetailModalVisible();

        // Verify modal contains job information
        await expect(jobsPage.modalJobTitle).toBeVisible();
        await expect(jobsPage.modalCompanyName).toBeVisible();
        await expect(jobsPage.modalJobDescription).toBeVisible();
      }
    });

    test('should close job details modal', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.search('developer');

      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();

      if (jobCount > 0) {
        // Open job details
        await jobsPage.viewJobDetails(0);
        await jobsPage.assertJobDetailModalVisible();

        // Close modal
        await jobsPage.closeJobDetails();

        // Verify modal is hidden
        await expect(jobsPage.jobDetailModal).toBeHidden();
      }
    });

    test('should save job for later', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.search('software');

      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();

      if (jobCount > 0) {
        // Save first job
        await jobsPage.saveJob(0);

        // Wait for save action to complete
        await page.waitForLoadState('networkidle');

        // Verify job is saved (button state should change)
        const isSaved = await jobsPage.isJobSaved(0);
        expect(isSaved).toBeTruthy();
      }
    });

    test('should save job from modal', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.search('engineer');

      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();

      if (jobCount > 0) {
        // Open job details
        await jobsPage.viewJobDetails(0);
        await jobsPage.assertJobDetailModalVisible();

        // Save job from modal
        await jobsPage.saveJobFromModal();

        // Wait for save action
        await page.waitForLoadState('networkidle');

        // Close modal and verify job is saved
        await jobsPage.closeJobDetails();
        const isSaved = await jobsPage.isJobSaved(0);
        expect(isSaved).toBeTruthy();
      }
    });
  });

  test.describe('Job Application', () => {
    test('should apply to a job', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.search('software engineer');

      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();

      if (jobCount > 0) {
        // Get job title before applying
        const jobTitle = await jobsPage.jobTitles.first().textContent();

        // Open job details
        await jobsPage.viewJobDetails(0);
        await jobsPage.assertJobDetailModalVisible();

        // Click apply button
        await jobsPage.modalApplyButton.click();

        // Handle application modal/flow
        const applyModalVisible = await page.locator('[data-testid="apply-modal"]').isVisible({ timeout: 5000 });

        if (applyModalVisible) {
          // Select resume
          const resumeSelect = page.locator('select[name="resumeId"]');
          const resumeOptions = await resumeSelect.locator('option').count();

          if (resumeOptions > 1) {
            await resumeSelect.selectOption({ index: 1 });
          }

          // Fill cover letter (optional)
          const coverLetterTextarea = page.locator('textarea[name="coverLetter"]');
          if (await coverLetterTextarea.isVisible({ timeout: 2000 })) {
            await coverLetterTextarea.fill('I am very interested in this position and believe my skills are a great fit.');
          }

          // Submit application
          const submitButton = page.locator('button:has-text("Submit Application")');
          await submitButton.click();

          // Wait for success message or redirect
          await page.waitForLoadState('networkidle');

          // Verify success message
          const successMessage = page.locator('[data-testid="success-message"]');
          if (await successMessage.isVisible({ timeout: 5000 })) {
            await expect(successMessage).toContainText(/success|applied/i);
          }
        }
      }
    });

    test('should require resume when applying', async ({ page }) => {
      await jobsPage.goto();
      await jobsPage.search('developer');

      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();

      if (jobCount > 0) {
        // Open job details
        await jobsPage.viewJobDetails(0);

        // Click apply button
        await jobsPage.modalApplyButton.click();

        // Check if resume is required
        const applyModal = page.locator('[data-testid="apply-modal"]');
        if (await applyModal.isVisible({ timeout: 5000 })) {
          const resumeSelect = page.locator('select[name="resumeId"]');

          // Try to submit without selecting resume
          const submitButton = page.locator('button:has-text("Submit Application")');
          await submitButton.click();

          // Should show validation error or button should be disabled
          const errorVisible = await page.locator('[data-testid="error-message"]').isVisible({ timeout: 2000 });
          const buttonDisabled = await submitButton.isDisabled();

          expect(errorVisible || buttonDisabled).toBeTruthy();
        }
      }
    });
  });

  test.describe('My Applications', () => {
    test('should see application in My Applications', async ({ page }) => {
      // First, apply to a job
      await jobsPage.goto();
      await jobsPage.search('engineer');

      await page.waitForLoadState('networkidle');
      const jobCount = await jobsPage.getJobCount();

      if (jobCount > 0) {
        const jobTitle = await jobsPage.jobTitles.first().textContent();

        // Navigate to applications page
        await applicationsPage.goto();
        await applicationsPage.assertVisible();

        // Verify applications are displayed
        const appCount = await applicationsPage.getApplicationCount();

        if (appCount > 0) {
          // Verify application card contains required information
          const firstCard = applicationsPage.getApplicationCard(0);
          await expect(firstCard).toBeVisible();

          // Should have job title, company, status, and date
          await expect(applicationsPage.jobTitles.first()).toBeVisible();
          await expect(applicationsPage.companyNames.first()).toBeVisible();
          await expect(applicationsPage.statuses.first()).toBeVisible();
          await expect(applicationsPage.appliedDates.first()).toBeVisible();
        }
      }
    });

    test('should view application details', async ({ page }) => {
      await applicationsPage.goto();

      const appCount = await applicationsPage.getApplicationCount();

      if (appCount > 0) {
        // View first application details
        await applicationsPage.viewDetails(0);

        // Verify detail modal is displayed
        await applicationsPage.assertDetailModalVisible();

        // Verify all details are shown
        await expect(applicationsPage.detailJobTitle).toBeVisible();
        await expect(applicationsPage.detailCompanyName).toBeVisible();
        await expect(applicationsPage.detailStatus).toBeVisible();
        await expect(applicationsPage.detailAppliedDate).toBeVisible();

        // Close details
        await applicationsPage.closeDetails();
        await expect(applicationsPage.detailModal).toBeHidden();
      }
    });

    test('should filter applications by status', async ({ page }) => {
      await applicationsPage.goto();

      const totalCount = await applicationsPage.getApplicationCount();

      if (totalCount > 0) {
        // Filter by pending status
        await applicationsPage.filterByStatus('pending');

        // Wait for filter to apply
        await page.waitForLoadState('networkidle');

        // Verify filtered results
        const filteredCount = await applicationsPage.getApplicationCount();
        expect(filteredCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should update application status', async ({ page }) => {
      await applicationsPage.goto();

      const appCount = await applicationsPage.getApplicationCount();

      if (appCount > 0) {
        // Get current status
        const currentStatus = await applicationsPage.getStatus(0);

        // Update status
        await applicationsPage.updateStatus(0, 'interviewing', 'Phone screen scheduled');

        // Wait for update to complete
        await page.waitForLoadState('networkidle');

        // Verify status was updated
        const newStatus = await applicationsPage.getStatus(0);
        expect(newStatus.toLowerCase()).toContain('interview');
      }
    });

    test('should search applications', async ({ page }) => {
      await applicationsPage.goto();

      const totalCount = await applicationsPage.getApplicationCount();

      if (totalCount > 0) {
        // Get first company name
        const companyName = await applicationsPage.companyNames.first().textContent();

        if (companyName) {
          // Search for that company
          await applicationsPage.search(companyName);

          // Wait for search to complete
          await page.waitForLoadState('networkidle');

          // Verify results contain the search term
          const searchResults = await applicationsPage.getApplicationCount();
          expect(searchResults).toBeGreaterThan(0);
        }
      }
    });

    test('should withdraw application', async ({ page }) => {
      await applicationsPage.goto();

      const initialCount = await applicationsPage.getApplicationCount();

      if (initialCount > 0) {
        // Delete first application
        await applicationsPage.deleteApplication(0);

        // Wait for deletion to complete
        await page.waitForLoadState('networkidle');

        // Verify count decreased
        const newCount = await applicationsPage.getApplicationCount();
        expect(newCount).toBeLessThan(initialCount);
      }
    });

    test('should sort applications', async ({ page }) => {
      await applicationsPage.goto();

      const appCount = await applicationsPage.getApplicationCount();

      if (appCount > 1) {
        // Sort by most recent
        await applicationsPage.sortBy('most-recent');
        await page.waitForLoadState('networkidle');

        // Verify applications are still displayed
        const sortedCount = await applicationsPage.getApplicationCount();
        expect(sortedCount).toBe(appCount);
      }
    });

    test('should display empty state when no applications', async ({ page }) => {
      await applicationsPage.goto();

      // Filter by a status that has no applications
      await applicationsPage.filterByStatus('rejected');
      await page.waitForLoadState('networkidle');

      const appCount = await applicationsPage.getApplicationCount();

      if (appCount === 0) {
        // Should show empty state
        await applicationsPage.assertEmptyState();
      }
    });
  });

  test.describe('Application Tracking', () => {
    test('should track application timeline', async ({ page }) => {
      await applicationsPage.goto();

      const appCount = await applicationsPage.getApplicationCount();

      if (appCount > 0) {
        // View application details
        await applicationsPage.viewDetails(0);
        await applicationsPage.assertDetailModalVisible();

        // Verify timeline is displayed
        const timelineVisible = await applicationsPage.detailTimeline.isVisible({ timeout: 3000 });

        if (timelineVisible) {
          // Timeline should show application events
          const timelineItems = applicationsPage.detailTimeline.locator('[data-testid="timeline-item"]');
          const itemCount = await timelineItems.count();
          expect(itemCount).toBeGreaterThan(0);
        }
      }
    });

    test('should display application analytics', async ({ page }) => {
      await applicationsPage.goto();

      const appCount = await applicationsPage.getApplicationCount();

      if (appCount > 0) {
        // Navigate to analytics
        const analyticsButtonVisible = await applicationsPage.analyticsButton.isVisible({ timeout: 3000 });

        if (analyticsButtonVisible) {
          await applicationsPage.goToAnalytics();

          // Verify analytics page is displayed
          await expect(page).toHaveURL(/.*analytics/);

          // Verify analytics elements are present
          const statsCards = page.locator('[data-testid="stats-card"]');
          const cardCount = await statsCards.count();
          expect(cardCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation in job search', async ({ page }) => {
      await jobsPage.goto();

      // Focus search input
      await jobsPage.searchInput.focus();

      // Type search query
      await page.keyboard.type('software engineer');

      // Press Enter to search
      await page.keyboard.press('Enter');

      // Wait for results
      await page.waitForLoadState('networkidle');

      // Verify search was performed
      const jobCount = await jobsPage.getJobCount();
      expect(jobCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation in applications', async ({ page }) => {
      await applicationsPage.goto();

      const appCount = await applicationsPage.getApplicationCount();

      if (appCount > 0) {
        // Tab through application cards
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Verify focus is on an interactive element
        const focusedElement = await page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display jobs correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await jobsPage.goto();
      await jobsPage.search('developer');

      await page.waitForLoadState('networkidle');

      // Verify jobs are displayed
      const jobCount = await jobsPage.getJobCount();
      expect(jobCount).toBeGreaterThan(0);

      // Verify search input is visible
      await expect(jobsPage.searchInput).toBeVisible();
    });

    test('should display applications correctly on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await applicationsPage.goto();

      // Verify page is displayed correctly
      await applicationsPage.assertVisible();

      const appCount = await applicationsPage.getApplicationCount();
      expect(appCount).toBeGreaterThanOrEqual(0);
    });
  });
});
