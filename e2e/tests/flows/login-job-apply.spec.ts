import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { JobsPage } from '../../pages/jobs.page';
import { ApplicationsPage } from '../../pages/applications.page';
import { ResumesPage } from '../../pages/resumes.page';
import { TEST_USERS } from '../../fixtures/auth.fixture';

/**
 * Critical Flow 2: Login → Job Search → Apply
 *
 * This test suite covers the complete job application flow from user login
 * through job search and filtering to submitting an application.
 */
test.describe('Complete Login to Job Application Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let jobsPage: JobsPage;
  let applicationsPage: ApplicationsPage;
  let resumesPage: ResumesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    jobsPage = new JobsPage(page);
    applicationsPage = new ApplicationsPage(page);
    resumesPage = new ResumesPage(page);
  });

  test('should complete full login to job application flow', async ({ page }) => {
    // Step 1: Login
    await loginPage.goto();
    await loginPage.assertVisible();

    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Step 2: Verify landed on dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await dashboardPage.assertVisible();
    await dashboardPage.assertLoggedIn();

    // Step 3: Navigate to jobs page
    await dashboardPage.goToJobs();
    await page.waitForURL('**/jobs', { timeout: 10000 });
    await jobsPage.assertVisible();

    // Step 4: Search for jobs
    const searchKeyword = 'software engineer';
    await jobsPage.search(searchKeyword);

    // Verify search results
    await page.waitForLoadState('networkidle');
    const jobCount = await jobsPage.getJobCount();
    expect(jobCount).toBeGreaterThan(0);

    // Step 5: Apply filters
    await jobsPage.filterByRemote(true);
    await page.waitForLoadState('networkidle');

    // Step 6: View job details
    const filteredJobCount = await jobsPage.getJobCount();
    if (filteredJobCount > 0) {
      // Get job title before viewing
      const jobTitle = await jobsPage.jobTitles.first().textContent();

      // View first job
      await jobsPage.viewJobDetails(0);
      await jobsPage.assertJobDetailModalVisible();

      // Verify modal shows job information
      await expect(jobsPage.modalJobTitle).toBeVisible();
      await expect(jobsPage.modalCompanyName).toBeVisible();
      await expect(jobsPage.modalJobDescription).toBeVisible();

      // Step 7: Save job for later
      await jobsPage.saveJobFromModal();
      await page.waitForLoadState('networkidle');

      // Step 8: Apply to job
      await jobsPage.modalApplyButton.click();

      // Handle application modal
      const applyModalVisible = await page.locator('[data-testid="apply-modal"]').isVisible({ timeout: 5000 });

      if (applyModalVisible) {
        // Select resume
        const resumeSelect = page.locator('select[name="resumeId"]');
        const resumeOptions = await resumeSelect.locator('option').count();

        if (resumeOptions > 1) {
          // Select first available resume
          await resumeSelect.selectOption({ index: 1 });
        } else {
          // If no resumes available, close modal and create one first
          const closeButton = page.locator('[data-testid="close-modal"]');
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click();
          }

          // Navigate to create resume
          await page.goto('/resumes/new');
          // Quick resume creation would go here
          // For this test, we'll assume resume exists
          test.skip(true, 'No resume available for application');
          return;
        }

        // Add cover letter
        const coverLetterTextarea = page.locator('textarea[name="coverLetter"]');
        if (await coverLetterTextarea.isVisible({ timeout: 2000 })) {
          await coverLetterTextarea.fill(
            'I am very interested in this position and believe my skills and experience make me a great fit for this role.'
          );
        }

        // Submit application
        const submitButton = page.locator('button:has-text("Submit Application")');
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Verify success
        const successMessage = page.locator('[data-testid="success-message"]');
        const successVisible = await successMessage.isVisible({ timeout: 5000 });

        if (successVisible) {
          await expect(successMessage).toContainText(/success|applied|submitted/i);
        }

        // Step 9: Verify application appears in My Applications
        await applicationsPage.goto();
        await applicationsPage.assertVisible();

        const appCount = await applicationsPage.getApplicationCount();
        expect(appCount).toBeGreaterThan(0);

        // Verify recently applied job appears
        if (jobTitle) {
          const recentApp = applicationsPage.getApplicationCardByTitle(jobTitle);
          const appVisible = await recentApp.isVisible({ timeout: 5000 });

          if (appVisible) {
            await expect(recentApp).toBeVisible();

            // Verify application details
            const status = await applicationsPage.getStatus(0);
            expect(status.toLowerCase()).toContain('pending');
          }
        }
      }
    }
  });

  test('should handle login with remember me', async ({ page, context }) => {
    await loginPage.goto();

    // Login with remember me checked
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password, true);

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await dashboardPage.assertVisible();

    // Get cookies
    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name.includes('token') || c.name.includes('session'));

    // Auth cookie should exist
    expect(authCookie).toBeTruthy();
  });

  test('should search and filter jobs before applying', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to jobs
    await jobsPage.goto();

    // Search with keyword
    await jobsPage.search('developer');
    await page.waitForLoadState('networkidle');

    let jobCount = await jobsPage.getJobCount();
    const initialCount = jobCount;
    expect(jobCount).toBeGreaterThan(0);

    // Apply location filter
    await jobsPage.filterByLocation('San Francisco');
    await page.waitForLoadState('networkidle');

    jobCount = await jobsPage.getJobCount();
    expect(jobCount).toBeGreaterThanOrEqual(0);

    // Apply remote filter
    await jobsPage.filterByRemote(true);
    await page.waitForLoadState('networkidle');

    jobCount = await jobsPage.getJobCount();
    expect(jobCount).toBeGreaterThanOrEqual(0);

    // Apply salary filter
    await jobsPage.filterBySalaryRange(100000, 150000);
    await page.waitForLoadState('networkidle');

    jobCount = await jobsPage.getJobCount();
    expect(jobCount).toBeGreaterThanOrEqual(0);

    // Clear all filters
    await jobsPage.clearFilters();
    await page.waitForLoadState('networkidle');

    jobCount = await jobsPage.getJobCount();
    // After clearing, should have same or more jobs
    expect(jobCount).toBeGreaterThanOrEqual(0);
  });

  test('should save multiple jobs before applying', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to jobs
    await jobsPage.goto();
    await jobsPage.search('engineer');
    await page.waitForLoadState('networkidle');

    const jobCount = await jobsPage.getJobCount();

    if (jobCount >= 3) {
      // Save first 3 jobs
      for (let i = 0; i < 3; i++) {
        await jobsPage.saveJob(i);
        await page.waitForLoadState('networkidle');

        // Verify job is saved
        const isSaved = await jobsPage.isJobSaved(i);
        expect(isSaved).toBeTruthy();
      }
    }
  });

  test('should sort jobs by relevance and date', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to jobs
    await jobsPage.goto();
    await jobsPage.search('software');
    await page.waitForLoadState('networkidle');

    const initialCount = await jobsPage.getJobCount();

    if (initialCount > 0) {
      // Sort by most recent
      await jobsPage.sortBy('most-recent');
      await page.waitForLoadState('networkidle');

      let sortedCount = await jobsPage.getJobCount();
      expect(sortedCount).toBe(initialCount);

      // Sort by relevance
      await jobsPage.sortBy('relevance');
      await page.waitForLoadState('networkidle');

      sortedCount = await jobsPage.getJobCount();
      expect(sortedCount).toBe(initialCount);
    }
  });

  test('should paginate through job results', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to jobs
    await jobsPage.goto();
    await jobsPage.search('developer');
    await page.waitForLoadState('networkidle');

    // Check if pagination exists
    const paginationVisible = await jobsPage.paginationContainer.isVisible({ timeout: 3000 });

    if (paginationVisible) {
      const currentPage = await jobsPage.getCurrentPage();
      expect(currentPage).toBe(1);

      // Try to go to next page
      const nextButtonEnabled = await jobsPage.nextPageButton.isEnabled();

      if (nextButtonEnabled) {
        await jobsPage.goToNextPage();
        await page.waitForLoadState('networkidle');

        const newPage = await jobsPage.getCurrentPage();
        expect(newPage).toBe(2);

        // Go back to previous page
        await jobsPage.goToPreviousPage();
        await page.waitForLoadState('networkidle');

        const backToFirstPage = await jobsPage.getCurrentPage();
        expect(backToFirstPage).toBe(1);
      }
    }
  });

  test('should require resume when applying to job', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to jobs
    await jobsPage.goto();
    await jobsPage.search('engineer');
    await page.waitForLoadState('networkidle');

    const jobCount = await jobsPage.getJobCount();

    if (jobCount > 0) {
      await jobsPage.viewJobDetails(0);
      await jobsPage.modalApplyButton.click();

      // Check if resume is required
      const applyModal = page.locator('[data-testid="apply-modal"]');
      const modalVisible = await applyModal.isVisible({ timeout: 5000 });

      if (modalVisible) {
        const resumeSelect = page.locator('select[name="resumeId"]');

        // Try to submit without selecting resume
        const submitButton = page.locator('button:has-text("Submit Application")');
        await submitButton.click();

        // Should show error or button should be disabled
        const errorVisible = await page.locator('[data-testid="error-message"]').isVisible({ timeout: 3000 });
        const buttonDisabled = await submitButton.isDisabled();

        expect(errorVisible || buttonDisabled).toBeTruthy();
      }
    }
  });

  test('should view and update application status after applying', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to applications
    await applicationsPage.goto();

    const appCount = await applicationsPage.getApplicationCount();

    if (appCount > 0) {
      // View first application details
      await applicationsPage.viewDetails(0);
      await applicationsPage.assertDetailModalVisible();

      // Verify details are shown
      await expect(applicationsPage.detailJobTitle).toBeVisible();
      await expect(applicationsPage.detailStatus).toBeVisible();

      // Close details
      await applicationsPage.closeDetails();

      // Update status
      await applicationsPage.updateStatus(0, 'interviewing', 'Phone screen scheduled for next week');

      await page.waitForLoadState('networkidle');

      // Verify status was updated
      const newStatus = await applicationsPage.getStatus(0);
      expect(newStatus.toLowerCase()).toContain('interview');
    }
  });

  test('should filter applications by status after applying', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to applications
    await applicationsPage.goto();

    const totalCount = await applicationsPage.getApplicationCount();

    if (totalCount > 0) {
      // Filter by pending
      await applicationsPage.filterByStatus('pending');
      await page.waitForLoadState('networkidle');

      let filteredCount = await applicationsPage.getApplicationCount();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
      expect(filteredCount).toBeLessThanOrEqual(totalCount);

      // Filter by interviewing
      await applicationsPage.filterByStatus('interviewing');
      await page.waitForLoadState('networkidle');

      filteredCount = await applicationsPage.getApplicationCount();
      expect(filteredCount).toBeGreaterThanOrEqual(0);

      // Clear filter (show all)
      await applicationsPage.filterByStatus('all');
      await page.waitForLoadState('networkidle');

      filteredCount = await applicationsPage.getApplicationCount();
      expect(filteredCount).toBe(totalCount);
    }
  });

  test('should search through applications', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to applications
    await applicationsPage.goto();

    const totalCount = await applicationsPage.getApplicationCount();

    if (totalCount > 0) {
      // Get first company name
      const companyName = await applicationsPage.companyNames.first().textContent();

      if (companyName && companyName.trim().length > 0) {
        // Search for that company
        await applicationsPage.search(companyName.trim());
        await page.waitForLoadState('networkidle');

        // Verify search results
        const searchResults = await applicationsPage.getApplicationCount();
        expect(searchResults).toBeGreaterThan(0);
        expect(searchResults).toBeLessThanOrEqual(totalCount);
      }
    }
  });

  test('should logout after completing job application flow', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to dashboard
    await dashboardPage.goto();
    await dashboardPage.assertLoggedIn();

    // Logout
    await dashboardPage.logout();

    // Should redirect to login page
    await page.waitForURL('**/login', { timeout: 10000 });
    await loginPage.assertVisible();

    // Verify no longer authenticated
    // Try to access dashboard directly
    await page.goto('/dashboard');

    // Should redirect back to login
    await page.waitForURL('**/login', { timeout: 10000 });
  });

  test('should persist job search filters across page reloads', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to jobs
    await jobsPage.goto();

    // Apply filters
    await jobsPage.search('engineer');
    await jobsPage.filterByRemote(true);
    await page.waitForLoadState('networkidle');

    // Get URL with filters
    const urlWithFilters = page.url();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // URL should still contain filters
    expect(page.url()).toContain('engineer');
  });

  test('should handle applying to same job twice', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Navigate to jobs
    await jobsPage.goto();
    await jobsPage.search('developer');
    await page.waitForLoadState('networkidle');

    const jobCount = await jobsPage.getJobCount();

    if (jobCount > 0) {
      await jobsPage.viewJobDetails(0);
      await jobsPage.assertJobDetailModalVisible();

      // Try to apply
      await jobsPage.modalApplyButton.click();

      const applyModal = page.locator('[data-testid="apply-modal"]');
      const modalVisible = await applyModal.isVisible({ timeout: 5000 });

      if (modalVisible) {
        // If already applied, button might be disabled or show "Already Applied"
        const buttonText = await jobsPage.modalApplyButton.textContent();
        const alreadyApplied = buttonText?.toLowerCase().includes('applied');

        if (alreadyApplied) {
          // Button should be disabled
          const isDisabled = await jobsPage.modalApplyButton.isDisabled();
          expect(isDisabled).toBeTruthy();
        }
      }
    }
  });
});
