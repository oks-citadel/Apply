import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Dashboard Page
 */
export class DashboardPage {
  readonly page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  // Navigation
  readonly dashboardLink: Locator;
  readonly resumesLink: Locator;
  readonly jobsLink: Locator;
  readonly applicationsLink: Locator;
  readonly settingsLink: Locator;

  // Stats Cards
  readonly totalApplicationsCard: Locator;
  readonly activeApplicationsCard: Locator;
  readonly interviewsCard: Locator;
  readonly offersCard: Locator;

  // Recent Activity
  readonly recentActivitySection: Locator;
  readonly activityItems: Locator;

  // Quick Actions
  readonly createResumeButton: Locator;
  readonly searchJobsButton: Locator;
  readonly viewApplicationsButton: Locator;
  readonly autoApplyButton: Locator;

  // Charts
  readonly applicationsChart: Locator;
  readonly statusChart: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.pageTitle = page.locator('h1');
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');

    // Navigation
    this.dashboardLink = page.locator('a[href="/dashboard"]');
    this.resumesLink = page.locator('a[href="/resumes"]');
    this.jobsLink = page.locator('a[href="/jobs"]');
    this.applicationsLink = page.locator('a[href="/applications"]');
    this.settingsLink = page.locator('a[href="/settings"]');

    // Stats Cards
    this.totalApplicationsCard = page.locator(
      '[data-testid="stat-total-applications"]'
    );
    this.activeApplicationsCard = page.locator(
      '[data-testid="stat-active-applications"]'
    );
    this.interviewsCard = page.locator('[data-testid="stat-interviews"]');
    this.offersCard = page.locator('[data-testid="stat-offers"]');

    // Recent Activity
    this.recentActivitySection = page.locator(
      '[data-testid="recent-activity"]'
    );
    this.activityItems = page.locator('[data-testid="activity-item"]');

    // Quick Actions
    this.createResumeButton = page.locator(
      'button:has-text("Create Resume")'
    );
    this.searchJobsButton = page.locator('button:has-text("Search Jobs")');
    this.viewApplicationsButton = page.locator(
      'button:has-text("View Applications")'
    );
    this.autoApplyButton = page.locator('button:has-text("Auto Apply")');

    // Charts
    this.applicationsChart = page.locator('[data-testid="applications-chart"]');
    this.statusChart = page.locator('[data-testid="status-chart"]');
  }

  /**
   * Navigate to dashboard page
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to resumes page
   */
  async goToResumes() {
    await this.resumesLink.click();
    await this.page.waitForURL('**/resumes');
  }

  /**
   * Navigate to jobs page
   */
  async goToJobs() {
    await this.jobsLink.click();
    await this.page.waitForURL('**/jobs');
  }

  /**
   * Navigate to applications page
   */
  async goToApplications() {
    await this.applicationsLink.click();
    await this.page.waitForURL('**/applications');
  }

  /**
   * Navigate to settings page
   */
  async goToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL('**/settings');
  }

  /**
   * Logout
   */
  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }

  /**
   * Click create resume button
   */
  async clickCreateResume() {
    await this.createResumeButton.click();
  }

  /**
   * Click search jobs button
   */
  async clickSearchJobs() {
    await this.searchJobsButton.click();
  }

  /**
   * Click view applications button
   */
  async clickViewApplications() {
    await this.viewApplicationsButton.click();
  }

  /**
   * Click auto apply button
   */
  async clickAutoApply() {
    await this.autoApplyButton.click();
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
   * Get active applications count
   */
  async getActiveApplications(): Promise<number> {
    const text = await this.activeApplicationsCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get interviews count
   */
  async getInterviewsCount(): Promise<number> {
    const text = await this.interviewsCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get offers count
   */
  async getOffersCount(): Promise<number> {
    const text = await this.offersCard.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Get recent activity items
   */
  async getRecentActivityItems(): Promise<string[]> {
    const items = await this.activityItems.all();
    const texts = await Promise.all(
      items.map((item) => item.textContent())
    );
    return texts.filter((text): text is string => text !== null);
  }

  /**
   * Assert dashboard is displayed
   */
  async assertVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.welcomeMessage).toBeVisible();
  }

  /**
   * Assert user is logged in
   */
  async assertLoggedIn() {
    await expect(this.userMenu).toBeVisible();
  }

  /**
   * Assert stats cards are visible
   */
  async assertStatsVisible() {
    await expect(this.totalApplicationsCard).toBeVisible();
    await expect(this.activeApplicationsCard).toBeVisible();
    await expect(this.interviewsCard).toBeVisible();
    await expect(this.offersCard).toBeVisible();
  }

  /**
   * Assert welcome message contains user name
   */
  async assertWelcomeMessage(userName: string) {
    await expect(this.welcomeMessage).toContainText(userName);
  }

  /**
   * Assert navigation links are visible
   */
  async assertNavigationVisible() {
    await expect(this.dashboardLink).toBeVisible();
    await expect(this.resumesLink).toBeVisible();
    await expect(this.jobsLink).toBeVisible();
    await expect(this.applicationsLink).toBeVisible();
    await expect(this.settingsLink).toBeVisible();
  }

  /**
   * Assert quick actions are visible
   */
  async assertQuickActionsVisible() {
    await expect(this.createResumeButton).toBeVisible();
    await expect(this.searchJobsButton).toBeVisible();
    await expect(this.viewApplicationsButton).toBeVisible();
    await expect(this.autoApplyButton).toBeVisible();
  }
}
