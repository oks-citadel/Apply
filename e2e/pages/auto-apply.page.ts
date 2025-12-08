import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Auto-Apply Dashboard Page
 */
export class AutoApplyPage {
  readonly page: Page;

  // Header
  readonly pageTitle: Locator;
  readonly statusBadge: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly settingsButton: Locator;

  // Statistics cards
  readonly totalApplicationsCard: Locator;
  readonly dailyApplicationsCard: Locator;
  readonly remainingApplicationsCard: Locator;
  readonly successRateCard: Locator;
  readonly responseRateCard: Locator;

  // Activity timeline
  readonly activityTimeline: Locator;
  readonly activityItems: Locator;

  // Charts
  readonly weeklyChart: Locator;
  readonly statusChart: Locator;

  // Recent auto-applications
  readonly recentApplicationsSection: Locator;
  readonly recentApplicationCards: Locator;

  // Filters
  readonly statusFilter: Locator;
  readonly dateFilter: Locator;

  // Messages
  readonly disabledMessage: Locator;
  readonly pausedMessage: Locator;
  readonly limitReachedMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1:has-text("Auto-Apply")');
    this.statusBadge = page.locator('[data-testid="status-badge"]');
    this.pauseButton = page.locator('button:has-text("Pause")');
    this.resumeButton = page.locator('button:has-text("Resume")');
    this.settingsButton = page.locator('button:has-text("Settings")');

    // Statistics cards
    this.totalApplicationsCard = page.locator('[data-testid="total-applications"]');
    this.dailyApplicationsCard = page.locator('[data-testid="daily-count"]');
    this.remainingApplicationsCard = page.locator('[data-testid="remaining-count"]');
    this.successRateCard = page.locator('[data-testid="success-rate"]');
    this.responseRateCard = page.locator('[data-testid="response-rate"]');

    // Activity timeline
    this.activityTimeline = page.locator('[data-testid="activity-timeline"]');
    this.activityItems = page.locator('[data-testid="activity-item"]');

    // Charts
    this.weeklyChart = page.locator('[data-testid="activity-chart"]');
    this.statusChart = page.locator('[data-testid="status-chart"]');

    // Recent applications
    this.recentApplicationsSection = page.locator('[data-testid="recent-applications"]');
    this.recentApplicationCards = page.locator('[data-testid="application-card"]');

    // Filters
    this.statusFilter = page.locator('select[name="status"]');
    this.dateFilter = page.locator('select[name="dateRange"]');

    // Messages
    this.disabledMessage = page.locator('[data-testid="disabled-message"]');
    this.pausedMessage = page.locator('[data-testid="paused-message"]');
    this.limitReachedMessage = page.locator('[data-testid="limit-reached"]');
  }

  /**
   * Navigate to auto-apply dashboard
   */
  async goto() {
    await this.page.goto('/auto-apply');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Pause auto-apply
   */
  async pause() {
    await this.pauseButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Resume auto-apply
   */
  async resume() {
    await this.resumeButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to settings
   */
  async goToSettings() {
    await this.settingsButton.click();
    await this.page.waitForURL('**/settings');
  }

  /**
   * Get total applications count
   */
  async getTotalApplications(): Promise<number> {
    const text = await this.totalApplicationsCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get daily applications count
   */
  async getDailyApplications(): Promise<number> {
    const text = await this.dailyApplicationsCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get remaining applications
   */
  async getRemainingApplications(): Promise<number> {
    const text = await this.remainingApplicationsCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get success rate
   */
  async getSuccessRate(): Promise<number> {
    const text = await this.successRateCard.textContent();
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get response rate
   */
  async getResponseRate(): Promise<number> {
    const text = await this.responseRateCard.textContent();
    const match = text?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get activity items count
   */
  async getActivityItemsCount(): Promise<number> {
    return await this.activityItems.count();
  }

  /**
   * Get status
   */
  async getStatus(): Promise<string> {
    const status = await this.statusBadge.textContent();
    return status?.toLowerCase() || '';
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
  async filterByDate(range: string) {
    await this.dateFilter.selectOption(range);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if auto-apply is active
   */
  async isActive(): Promise<boolean> {
    const status = await this.getStatus();
    return status.includes('active') || status.includes('running');
  }

  /**
   * Check if auto-apply is paused
   */
  async isPaused(): Promise<boolean> {
    const status = await this.getStatus();
    return status.includes('pause');
  }

  /**
   * Check if auto-apply is disabled
   */
  async isDisabled(): Promise<boolean> {
    try {
      await this.disabledMessage.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Assert auto-apply page is displayed
   */
  async assertVisible() {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * Assert status badge shows active
   */
  async assertActive() {
    const status = await this.getStatus();
    expect(status).toMatch(/active|running/);
  }

  /**
   * Assert status badge shows paused
   */
  async assertPaused() {
    await expect(this.pausedMessage).toBeVisible();
  }

  /**
   * Assert auto-apply is disabled
   */
  async assertDisabled() {
    await expect(this.disabledMessage).toBeVisible();
  }

  /**
   * Assert daily limit reached
   */
  async assertLimitReached() {
    await expect(this.limitReachedMessage).toBeVisible();
  }

  /**
   * Assert statistics are visible
   */
  async assertStatsVisible() {
    await expect(this.totalApplicationsCard).toBeVisible();
    await expect(this.dailyApplicationsCard).toBeVisible();
    await expect(this.remainingApplicationsCard).toBeVisible();
  }

  /**
   * Assert activity timeline is visible
   */
  async assertTimelineVisible() {
    await expect(this.activityTimeline).toBeVisible();
  }

  /**
   * Assert charts are visible
   */
  async assertChartsVisible() {
    await expect(this.weeklyChart).toBeVisible();
  }
}
