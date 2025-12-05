import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Resumes Page
 */
export class ResumesPage {
  readonly page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly createResumeButton: Locator;
  readonly importResumeButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly sortDropdown: Locator;

  // Resume cards
  readonly resumeCards: Locator;
  readonly emptyState: Locator;

  // Actions
  readonly editButtons: Locator;
  readonly duplicateButtons: Locator;
  readonly deleteButtons: Locator;
  readonly downloadButtons: Locator;
  readonly previewButtons: Locator;

  // Modal
  readonly deleteModal: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.pageTitle = page.locator('h1:has-text("Resumes")');
    this.createResumeButton = page.locator(
      'button:has-text("Create Resume")'
    );
    this.importResumeButton = page.locator(
      'button:has-text("Import Resume")'
    );
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');

    // Resume cards
    this.resumeCards = page.locator('[data-testid="resume-card"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');

    // Actions
    this.editButtons = page.locator('[data-testid="edit-resume"]');
    this.duplicateButtons = page.locator('[data-testid="duplicate-resume"]');
    this.deleteButtons = page.locator('[data-testid="delete-resume"]');
    this.downloadButtons = page.locator('[data-testid="download-resume"]');
    this.previewButtons = page.locator('[data-testid="preview-resume"]');

    // Modal
    this.deleteModal = page.locator('[data-testid="delete-modal"]');
    this.confirmDeleteButton = page.locator(
      '[data-testid="confirm-delete"]'
    );
    this.cancelDeleteButton = page.locator('[data-testid="cancel-delete"]');
  }

  /**
   * Navigate to resumes page
   */
  async goto() {
    await this.page.goto('/resumes');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click create resume button
   */
  async clickCreateResume() {
    await this.createResumeButton.click();
    await this.page.waitForURL('**/resumes/new');
  }

  /**
   * Click import resume button
   */
  async clickImportResume() {
    await this.importResumeButton.click();
  }

  /**
   * Search for resumes
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter resumes
   */
  async filterBy(filter: string) {
    await this.filterDropdown.selectOption(filter);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Sort resumes
   */
  async sortBy(sort: string) {
    await this.sortDropdown.selectOption(sort);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get resume count
   */
  async getResumeCount(): Promise<number> {
    return await this.resumeCards.count();
  }

  /**
   * Get resume card by index
   */
  getResumeCard(index: number): Locator {
    return this.resumeCards.nth(index);
  }

  /**
   * Get resume card by title
   */
  getResumeCardByTitle(title: string): Locator {
    return this.page.locator(`[data-testid="resume-card"]:has-text("${title}")`);
  }

  /**
   * Edit resume by index
   */
  async editResume(index: number) {
    await this.editButtons.nth(index).click();
    await this.page.waitForURL('**/resumes/**');
  }

  /**
   * Edit resume by title
   */
  async editResumeByTitle(title: string) {
    const card = this.getResumeCardByTitle(title);
    await card.locator('[data-testid="edit-resume"]').click();
    await this.page.waitForURL('**/resumes/**');
  }

  /**
   * Duplicate resume by index
   */
  async duplicateResume(index: number) {
    await this.duplicateButtons.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete resume by index
   */
  async deleteResume(index: number, confirm: boolean = true) {
    await this.deleteButtons.nth(index).click();
    await this.deleteModal.waitFor({ state: 'visible' });

    if (confirm) {
      await this.confirmDeleteButton.click();
    } else {
      await this.cancelDeleteButton.click();
    }

    await this.deleteModal.waitFor({ state: 'hidden' });
  }

  /**
   * Delete resume by title
   */
  async deleteResumeByTitle(title: string, confirm: boolean = true) {
    const card = this.getResumeCardByTitle(title);
    await card.locator('[data-testid="delete-resume"]').click();
    await this.deleteModal.waitFor({ state: 'visible' });

    if (confirm) {
      await this.confirmDeleteButton.click();
    } else {
      await this.cancelDeleteButton.click();
    }

    await this.deleteModal.waitFor({ state: 'hidden' });
  }

  /**
   * Download resume by index
   */
  async downloadResume(index: number, format: 'pdf' | 'docx' = 'pdf') {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButtons.nth(index).click();

    // If format selector appears, select the format
    const formatSelector = this.page.locator(`[data-format="${format}"]`);
    if (await formatSelector.isVisible({ timeout: 2000 })) {
      await formatSelector.click();
    }

    const download = await downloadPromise;
    return download;
  }

  /**
   * Preview resume by index
   */
  async previewResume(index: number) {
    await this.previewButtons.nth(index).click();
    // Wait for preview modal or new tab
  }

  /**
   * Import resume from file
   */
  async importResumeFromFile(filePath: string) {
    await this.clickImportResume();

    // Handle file upload
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for import to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if empty state is displayed
   */
  async hasEmptyState(): Promise<boolean> {
    try {
      await this.emptyState.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Assert resumes page is displayed
   */
  async assertVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.createResumeButton).toBeVisible();
  }

  /**
   * Assert resume count
   */
  async assertResumeCount(expectedCount: number) {
    await expect(this.resumeCards).toHaveCount(expectedCount);
  }

  /**
   * Assert resume exists by title
   */
  async assertResumeExists(title: string) {
    const card = this.getResumeCardByTitle(title);
    await expect(card).toBeVisible();
  }

  /**
   * Assert resume does not exist by title
   */
  async assertResumeDoesNotExist(title: string) {
    const card = this.getResumeCardByTitle(title);
    await expect(card).not.toBeVisible();
  }

  /**
   * Assert empty state is displayed
   */
  async assertEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Assert delete modal is visible
   */
  async assertDeleteModalVisible() {
    await expect(this.deleteModal).toBeVisible();
  }
}
