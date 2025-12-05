import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Jobs Page
 */
export class JobsPage {
  readonly page: Page;

  // Search and filters
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly locationInput: Locator;
  readonly remoteCheckbox: Locator;
  readonly jobTypeFilter: Locator;
  readonly salaryMinInput: Locator;
  readonly salaryMaxInput: Locator;
  readonly experienceLevelFilter: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;

  // Job listings
  readonly jobCards: Locator;
  readonly jobTitles: Locator;
  readonly companyNames: Locator;
  readonly saveJobButtons: Locator;
  readonly applyButtons: Locator;

  // Pagination
  readonly paginationContainer: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly pageNumbers: Locator;

  // Sort
  readonly sortDropdown: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly noResultsMessage: Locator;

  // Job detail modal
  readonly jobDetailModal: Locator;
  readonly modalJobTitle: Locator;
  readonly modalCompanyName: Locator;
  readonly modalJobDescription: Locator;
  readonly modalRequirements: Locator;
  readonly modalBenefits: Locator;
  readonly modalSalary: Locator;
  readonly modalApplyButton: Locator;
  readonly modalSaveButton: Locator;
  readonly closeModalButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Search and filters
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.searchButton = page.locator('button:has-text("Search")');
    this.locationInput = page.locator('input[name="location"]');
    this.remoteCheckbox = page.locator('input[name="remote"]');
    this.jobTypeFilter = page.locator('select[name="jobType"]');
    this.salaryMinInput = page.locator('input[name="salaryMin"]');
    this.salaryMaxInput = page.locator('input[name="salaryMax"]');
    this.experienceLevelFilter = page.locator('select[name="experienceLevel"]');
    this.applyFiltersButton = page.locator('button:has-text("Apply Filters")');
    this.clearFiltersButton = page.locator('button:has-text("Clear Filters")');

    // Job listings
    this.jobCards = page.locator('[data-testid="job-card"]');
    this.jobTitles = page.locator('[data-testid="job-title"]');
    this.companyNames = page.locator('[data-testid="company-name"]');
    this.saveJobButtons = page.locator('[data-testid="save-job"]');
    this.applyButtons = page.locator('[data-testid="apply-job"]');

    // Pagination
    this.paginationContainer = page.locator('[data-testid="pagination"]');
    this.nextPageButton = page.locator('button[aria-label="Next page"]');
    this.prevPageButton = page.locator('button[aria-label="Previous page"]');
    this.pageNumbers = page.locator('[data-testid="page-number"]');

    // Sort
    this.sortDropdown = page.locator('select[name="sort"]');

    // Empty state
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.noResultsMessage = page.locator('[data-testid="no-results"]');

    // Job detail modal
    this.jobDetailModal = page.locator('[data-testid="job-detail-modal"]');
    this.modalJobTitle = page.locator('[data-testid="modal-job-title"]');
    this.modalCompanyName = page.locator('[data-testid="modal-company-name"]');
    this.modalJobDescription = page.locator('[data-testid="modal-description"]');
    this.modalRequirements = page.locator('[data-testid="modal-requirements"]');
    this.modalBenefits = page.locator('[data-testid="modal-benefits"]');
    this.modalSalary = page.locator('[data-testid="modal-salary"]');
    this.modalApplyButton = page.locator('[data-testid="modal-apply"]');
    this.modalSaveButton = page.locator('[data-testid="modal-save"]');
    this.closeModalButton = page.locator('[data-testid="close-modal"]');
  }

  /**
   * Navigate to jobs page
   */
  async goto() {
    await this.page.goto('/jobs');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for jobs
   */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by location
   */
  async filterByLocation(location: string) {
    await this.locationInput.fill(location);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by remote
   */
  async filterByRemote(remote: boolean = true) {
    if (remote) {
      await this.remoteCheckbox.check();
    } else {
      await this.remoteCheckbox.uncheck();
    }
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by job type
   */
  async filterByJobType(jobType: string) {
    await this.jobTypeFilter.selectOption(jobType);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by salary range
   */
  async filterBySalaryRange(min: number, max: number) {
    await this.salaryMinInput.fill(min.toString());
    await this.salaryMaxInput.fill(max.toString());
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by experience level
   */
  async filterByExperienceLevel(level: string) {
    await this.experienceLevelFilter.selectOption(level);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.clearFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Sort jobs
   */
  async sortBy(sortOption: string) {
    await this.sortDropdown.selectOption(sortOption);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get job count
   */
  async getJobCount(): Promise<number> {
    return await this.jobCards.count();
  }

  /**
   * Get job card by index
   */
  getJobCard(index: number): Locator {
    return this.jobCards.nth(index);
  }

  /**
   * Get job card by title
   */
  getJobCardByTitle(title: string): Locator {
    return this.page.locator(`[data-testid="job-card"]:has-text("${title}")`);
  }

  /**
   * View job details
   */
  async viewJobDetails(index: number) {
    await this.jobCards.nth(index).click();
    await this.jobDetailModal.waitFor({ state: 'visible' });
  }

  /**
   * View job details by title
   */
  async viewJobDetailsByTitle(title: string) {
    const jobCard = this.getJobCardByTitle(title);
    await jobCard.click();
    await this.jobDetailModal.waitFor({ state: 'visible' });
  }

  /**
   * Close job detail modal
   */
  async closeJobDetails() {
    await this.closeModalButton.click();
    await this.jobDetailModal.waitFor({ state: 'hidden' });
  }

  /**
   * Save job
   */
  async saveJob(index: number) {
    await this.saveJobButtons.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Save job by title
   */
  async saveJobByTitle(title: string) {
    const jobCard = this.getJobCardByTitle(title);
    await jobCard.locator('[data-testid="save-job"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if job is saved
   */
  async isJobSaved(index: number): Promise<boolean> {
    const button = this.saveJobButtons.nth(index);
    const ariaLabel = await button.getAttribute('aria-label');
    return ariaLabel?.includes('Unsave') || ariaLabel?.includes('Saved') || false;
  }

  /**
   * Apply to job from card
   */
  async applyToJob(index: number) {
    await this.applyButtons.nth(index).click();
    // Handle apply modal or redirect
  }

  /**
   * Apply to job from modal
   */
  async applyToJobFromModal() {
    await this.modalApplyButton.click();
    // Handle apply flow
  }

  /**
   * Save job from modal
   */
  async saveJobFromModal() {
    await this.modalSaveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to next page
   */
  async goToNextPage() {
    await this.nextPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage() {
    await this.prevPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to specific page
   */
  async goToPage(pageNumber: number) {
    await this.page
      .locator(`button[data-page="${pageNumber}"]`)
      .click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const activePageButton = this.page.locator('button[aria-current="page"]');
    const pageText = await activePageButton.textContent();
    return pageText ? parseInt(pageText) : 1;
  }

  /**
   * Assert jobs page is displayed
   */
  async assertVisible() {
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /**
   * Assert job count
   */
  async assertJobCount(expectedCount: number) {
    await expect(this.jobCards).toHaveCount(expectedCount);
  }

  /**
   * Assert job exists by title
   */
  async assertJobExists(title: string) {
    const jobCard = this.getJobCardByTitle(title);
    await expect(jobCard).toBeVisible();
  }

  /**
   * Assert no results message is displayed
   */
  async assertNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }

  /**
   * Assert job detail modal is visible
   */
  async assertJobDetailModalVisible() {
    await expect(this.jobDetailModal).toBeVisible();
  }

  /**
   * Assert job is saved
   */
  async assertJobSaved(index: number) {
    const button = this.saveJobButtons.nth(index);
    await expect(button).toHaveAttribute('aria-label', /Saved|Unsave/);
  }

  /**
   * Assert pagination is visible
   */
  async assertPaginationVisible() {
    await expect(this.paginationContainer).toBeVisible();
  }

  /**
   * Assert on specific page
   */
  async assertOnPage(pageNumber: number) {
    const currentPage = await this.getCurrentPage();
    expect(currentPage).toBe(pageNumber);
  }
}
