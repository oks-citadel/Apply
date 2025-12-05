import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Applications Page
 */
export class ApplicationsPage {
  readonly page: Page;

  // Header
  readonly pageTitle: Locator;
  readonly analyticsButton: Locator;

  // Filters
  readonly statusFilter: Locator;
  readonly dateRangeFilter: Locator;
  readonly companyFilter: Locator;
  readonly searchInput: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;

  // Application cards
  readonly applicationCards: Locator;
  readonly emptyState: Locator;

  // Application card elements
  readonly jobTitles: Locator;
  readonly companyNames: Locator;
  readonly statuses: Locator;
  readonly appliedDates: Locator;
  readonly viewDetailsButtons: Locator;
  readonly updateStatusButtons: Locator;
  readonly deleteButtons: Locator;

  // Status update modal
  readonly statusModal: Locator;
  readonly statusDropdown: Locator;
  readonly notesTextarea: Locator;
  readonly saveStatusButton: Locator;
  readonly cancelStatusButton: Locator;

  // Application detail modal
  readonly detailModal: Locator;
  readonly detailJobTitle: Locator;
  readonly detailCompanyName: Locator;
  readonly detailStatus: Locator;
  readonly detailAppliedDate: Locator;
  readonly detailResume: Locator;
  readonly detailCoverLetter: Locator;
  readonly detailNotes: Locator;
  readonly detailTimeline: Locator;
  readonly closeDetailButton: Locator;

  // Sort
  readonly sortDropdown: Locator;

  // Bulk actions
  readonly selectAllCheckbox: Locator;
  readonly bulkDeleteButton: Locator;
  readonly bulkUpdateStatusButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1:has-text("Applications")');
    this.analyticsButton = page.locator('button:has-text("Analytics")');

    // Filters
    this.statusFilter = page.locator('select[name="status"]');
    this.dateRangeFilter = page.locator('select[name="dateRange"]');
    this.companyFilter = page.locator('input[name="company"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.applyFiltersButton = page.locator('button:has-text("Apply Filters")');
    this.clearFiltersButton = page.locator('button:has-text("Clear")');

    // Application cards
    this.applicationCards = page.locator('[data-testid="application-card"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');

    // Application card elements
    this.jobTitles = page.locator('[data-testid="job-title"]');
    this.companyNames = page.locator('[data-testid="company-name"]');
    this.statuses = page.locator('[data-testid="status"]');
    this.appliedDates = page.locator('[data-testid="applied-date"]');
    this.viewDetailsButtons = page.locator('[data-testid="view-details"]');
    this.updateStatusButtons = page.locator('[data-testid="update-status"]');
    this.deleteButtons = page.locator('[data-testid="delete-application"]');

    // Status update modal
    this.statusModal = page.locator('[data-testid="status-modal"]');
    this.statusDropdown = page.locator('select[name="newStatus"]');
    this.notesTextarea = page.locator('textarea[name="notes"]');
    this.saveStatusButton = page.locator('button:has-text("Save")');
    this.cancelStatusButton = page.locator('button:has-text("Cancel")');

    // Application detail modal
    this.detailModal = page.locator('[data-testid="detail-modal"]');
    this.detailJobTitle = page.locator('[data-testid="detail-job-title"]');
    this.detailCompanyName = page.locator('[data-testid="detail-company"]');
    this.detailStatus = page.locator('[data-testid="detail-status"]');
    this.detailAppliedDate = page.locator('[data-testid="detail-applied-date"]');
    this.detailResume = page.locator('[data-testid="detail-resume"]');
    this.detailCoverLetter = page.locator('[data-testid="detail-cover-letter"]');
    this.detailNotes = page.locator('[data-testid="detail-notes"]');
    this.detailTimeline = page.locator('[data-testid="detail-timeline"]');
    this.closeDetailButton = page.locator('[data-testid="close-detail"]');

    // Sort
    this.sortDropdown = page.locator('select[name="sort"]');

    // Bulk actions
    this.selectAllCheckbox = page.locator('input[name="selectAll"]');
    this.bulkDeleteButton = page.locator('button:has-text("Delete Selected")');
    this.bulkUpdateStatusButton = page.locator('button:has-text("Update Selected")');
  }

  /**
   * Navigate to applications page
   */
  async goto() {
    await this.page.goto('/applications');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by date range
   */
  async filterByDateRange(range: string) {
    await this.dateRangeFilter.selectOption(range);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by company
   */
  async filterByCompany(company: string) {
    await this.companyFilter.fill(company);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search applications
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
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
   * Sort applications
   */
  async sortBy(sortOption: string) {
    await this.sortDropdown.selectOption(sortOption);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get application count
   */
  async getApplicationCount(): Promise<number> {
    return await this.applicationCards.count();
  }

  /**
   * Get application card by index
   */
  getApplicationCard(index: number): Locator {
    return this.applicationCards.nth(index);
  }

  /**
   * Get application card by job title
   */
  getApplicationCardByTitle(title: string): Locator {
    return this.page.locator(`[data-testid="application-card"]:has-text("${title}")`);
  }

  /**
   * View application details
   */
  async viewDetails(index: number) {
    await this.viewDetailsButtons.nth(index).click();
    await this.detailModal.waitFor({ state: 'visible' });
  }

  /**
   * View application details by title
   */
  async viewDetailsByTitle(title: string) {
    const card = this.getApplicationCardByTitle(title);
    await card.locator('[data-testid="view-details"]').click();
    await this.detailModal.waitFor({ state: 'visible' });
  }

  /**
   * Close application details
   */
  async closeDetails() {
    await this.closeDetailButton.click();
    await this.detailModal.waitFor({ state: 'hidden' });
  }

  /**
   * Update application status
   */
  async updateStatus(index: number, newStatus: string, notes?: string) {
    await this.updateStatusButtons.nth(index).click();
    await this.statusModal.waitFor({ state: 'visible' });

    await this.statusDropdown.selectOption(newStatus);

    if (notes) {
      await this.notesTextarea.fill(notes);
    }

    await this.saveStatusButton.click();
    await this.statusModal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Update status by title
   */
  async updateStatusByTitle(title: string, newStatus: string, notes?: string) {
    const card = this.getApplicationCardByTitle(title);
    await card.locator('[data-testid="update-status"]').click();
    await this.statusModal.waitFor({ state: 'visible' });

    await this.statusDropdown.selectOption(newStatus);

    if (notes) {
      await this.notesTextarea.fill(notes);
    }

    await this.saveStatusButton.click();
    await this.statusModal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete application
   */
  async deleteApplication(index: number) {
    await this.deleteButtons.nth(index).click();
    // Handle confirmation if needed
    const confirmButton = this.page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get application status
   */
  async getStatus(index: number): Promise<string> {
    const status = await this.statuses.nth(index).textContent();
    return status || '';
  }

  /**
   * Get application status by title
   */
  async getStatusByTitle(title: string): Promise<string> {
    const card = this.getApplicationCardByTitle(title);
    const status = await card.locator('[data-testid="status"]').textContent();
    return status || '';
  }

  /**
   * Select all applications
   */
  async selectAll() {
    await this.selectAllCheckbox.check();
  }

  /**
   * Bulk delete applications
   */
  async bulkDelete() {
    await this.bulkDeleteButton.click();
    // Handle confirmation
    const confirmButton = this.page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Bulk update status
   */
  async bulkUpdateStatus(newStatus: string) {
    await this.bulkUpdateStatusButton.click();
    await this.statusModal.waitFor({ state: 'visible' });
    await this.statusDropdown.selectOption(newStatus);
    await this.saveStatusButton.click();
    await this.statusModal.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to analytics
   */
  async goToAnalytics() {
    await this.analyticsButton.click();
    await this.page.waitForURL('**/applications/analytics');
  }

  /**
   * Assert applications page is displayed
   */
  async assertVisible() {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * Assert application count
   */
  async assertApplicationCount(expectedCount: number) {
    await expect(this.applicationCards).toHaveCount(expectedCount);
  }

  /**
   * Assert application exists by title
   */
  async assertApplicationExists(title: string) {
    const card = this.getApplicationCardByTitle(title);
    await expect(card).toBeVisible();
  }

  /**
   * Assert application status
   */
  async assertStatus(index: number, expectedStatus: string) {
    await expect(this.statuses.nth(index)).toContainText(expectedStatus, {
      ignoreCase: true,
    });
  }

  /**
   * Assert empty state is displayed
   */
  async assertEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Assert detail modal is visible
   */
  async assertDetailModalVisible() {
    await expect(this.detailModal).toBeVisible();
  }

  /**
   * Assert status modal is visible
   */
  async assertStatusModalVisible() {
    await expect(this.statusModal).toBeVisible();
  }
}
