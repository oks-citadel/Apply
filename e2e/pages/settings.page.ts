import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Settings Page
 */
export class SettingsPage {
  readonly page: Page;

  // Navigation tabs
  readonly profileTab: Locator;
  readonly preferencesTab: Locator;
  readonly notificationsTab: Locator;
  readonly securityTab: Locator;
  readonly subscriptionTab: Locator;
  readonly autoApplyTab: Locator;

  // Profile section
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly locationInput: Locator;
  readonly bioTextarea: Locator;
  readonly linkedinInput: Locator;
  readonly githubInput: Locator;
  readonly websiteInput: Locator;
  readonly uploadPhotoButton: Locator;
  readonly photoPreview: Locator;
  readonly saveProfileButton: Locator;

  // Preferences section
  readonly jobTypesCheckboxes: Locator;
  readonly remotePreferenceCheckbox: Locator;
  readonly preferredLocationsInput: Locator;
  readonly salaryMinInput: Locator;
  readonly salaryMaxInput: Locator;
  readonly salaryCurrencySelect: Locator;
  readonly savePreferencesButton: Locator;

  // Notifications section
  readonly emailApplicationsCheckbox: Locator;
  readonly emailInterviewsCheckbox: Locator;
  readonly emailOffersCheckbox: Locator;
  readonly emailRejectionsCheckbox: Locator;
  readonly emailWeeklyDigestCheckbox: Locator;
  readonly pushApplicationsCheckbox: Locator;
  readonly pushInterviewsCheckbox: Locator;
  readonly pushOffersCheckbox: Locator;
  readonly saveNotificationsButton: Locator;

  // Security section
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmNewPasswordInput: Locator;
  readonly changePasswordButton: Locator;
  readonly enableMfaButton: Locator;
  readonly disableMfaButton: Locator;
  readonly mfaStatus: Locator;
  readonly sessionsTable: Locator;
  readonly revokeSessionButtons: Locator;

  // Subscription section
  readonly currentPlanCard: Locator;
  readonly planName: Locator;
  readonly planPrice: Locator;
  readonly planFeatures: Locator;
  readonly upgradeButton: Locator;
  readonly cancelSubscriptionButton: Locator;
  readonly usageSection: Locator;
  readonly resumesUsage: Locator;
  readonly applicationsUsage: Locator;
  readonly aiCreditsUsage: Locator;

  // Auto-apply settings
  readonly autoApplyEnabled: Locator;
  readonly keywordsInput: Locator;
  readonly autoApplyLocationsInput: Locator;
  readonly autoApplyJobTypes: Locator;
  readonly autoApplyRemote: Locator;
  readonly autoApplySalaryMin: Locator;
  readonly autoApplyExperienceLevels: Locator;
  readonly maxApplicationsPerDay: Locator;
  readonly saveAutoApplyButton: Locator;

  // Messages
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation tabs
    this.profileTab = page.locator('[data-tab="profile"]');
    this.preferencesTab = page.locator('[data-tab="preferences"]');
    this.notificationsTab = page.locator('[data-tab="notifications"]');
    this.securityTab = page.locator('[data-tab="security"]');
    this.subscriptionTab = page.locator('[data-tab="subscription"]');
    this.autoApplyTab = page.locator('[data-tab="auto-apply"]');

    // Profile section
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.phoneInput = page.locator('input[name="phone"]');
    this.locationInput = page.locator('input[name="location"]');
    this.bioTextarea = page.locator('textarea[name="bio"]');
    this.linkedinInput = page.locator('input[name="linkedin"]');
    this.githubInput = page.locator('input[name="github"]');
    this.websiteInput = page.locator('input[name="website"]');
    this.uploadPhotoButton = page.locator('button:has-text("Upload Photo")');
    this.photoPreview = page.locator('[data-testid="photo-preview"]');
    this.saveProfileButton = page.locator('button:has-text("Save Profile")');

    // Preferences section
    this.jobTypesCheckboxes = page.locator('input[name="jobTypes"]');
    this.remotePreferenceCheckbox = page.locator('input[name="remotePreference"]');
    this.preferredLocationsInput = page.locator('input[name="preferredLocations"]');
    this.salaryMinInput = page.locator('input[name="salaryExpectationMin"]');
    this.salaryMaxInput = page.locator('input[name="salaryExpectationMax"]');
    this.salaryCurrencySelect = page.locator('select[name="currency"]');
    this.savePreferencesButton = page.locator('button:has-text("Save Preferences")');

    // Notifications section
    this.emailApplicationsCheckbox = page.locator('input[name="emailApplications"]');
    this.emailInterviewsCheckbox = page.locator('input[name="emailInterviews"]');
    this.emailOffersCheckbox = page.locator('input[name="emailOffers"]');
    this.emailRejectionsCheckbox = page.locator('input[name="emailRejections"]');
    this.emailWeeklyDigestCheckbox = page.locator('input[name="emailWeeklyDigest"]');
    this.pushApplicationsCheckbox = page.locator('input[name="pushApplications"]');
    this.pushInterviewsCheckbox = page.locator('input[name="pushInterviews"]');
    this.pushOffersCheckbox = page.locator('input[name="pushOffers"]');
    this.saveNotificationsButton = page.locator('button:has-text("Save Notifications")');

    // Security section
    this.currentPasswordInput = page.locator('input[name="currentPassword"]');
    this.newPasswordInput = page.locator('input[name="newPassword"]');
    this.confirmNewPasswordInput = page.locator('input[name="confirmNewPassword"]');
    this.changePasswordButton = page.locator('button:has-text("Change Password")');
    this.enableMfaButton = page.locator('button:has-text("Enable MFA")');
    this.disableMfaButton = page.locator('button:has-text("Disable MFA")');
    this.mfaStatus = page.locator('[data-testid="mfa-status"]');
    this.sessionsTable = page.locator('[data-testid="sessions-table"]');
    this.revokeSessionButtons = page.locator('[data-testid="revoke-session"]');

    // Subscription section
    this.currentPlanCard = page.locator('[data-testid="current-plan"]');
    this.planName = page.locator('[data-testid="plan-name"]');
    this.planPrice = page.locator('[data-testid="plan-price"]');
    this.planFeatures = page.locator('[data-testid="plan-features"]');
    this.upgradeButton = page.locator('button:has-text("Upgrade")');
    this.cancelSubscriptionButton = page.locator('button:has-text("Cancel Subscription")');
    this.usageSection = page.locator('[data-testid="usage-section"]');
    this.resumesUsage = page.locator('[data-testid="resumes-usage"]');
    this.applicationsUsage = page.locator('[data-testid="applications-usage"]');
    this.aiCreditsUsage = page.locator('[data-testid="ai-credits-usage"]');

    // Auto-apply settings
    this.autoApplyEnabled = page.locator('input[name="autoApplyEnabled"]');
    this.keywordsInput = page.locator('input[name="keywords"]');
    this.autoApplyLocationsInput = page.locator('input[name="autoApplyLocations"]');
    this.autoApplyJobTypes = page.locator('input[name="autoApplyJobTypes"]');
    this.autoApplyRemote = page.locator('input[name="autoApplyRemote"]');
    this.autoApplySalaryMin = page.locator('input[name="autoApplySalaryMin"]');
    this.autoApplyExperienceLevels = page.locator('input[name="experienceLevels"]');
    this.maxApplicationsPerDay = page.locator('input[name="maxApplicationsPerDay"]');
    this.saveAutoApplyButton = page.locator('button:has-text("Save Auto-Apply Settings")');

    // Messages
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  /**
   * Navigate to settings page
   */
  async goto() {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to profile tab
   */
  async goToProfile() {
    await this.profileTab.click();
  }

  /**
   * Navigate to preferences tab
   */
  async goToPreferences() {
    await this.preferencesTab.click();
  }

  /**
   * Navigate to notifications tab
   */
  async goToNotifications() {
    await this.notificationsTab.click();
  }

  /**
   * Navigate to security tab
   */
  async goToSecurity() {
    await this.securityTab.click();
  }

  /**
   * Navigate to subscription tab
   */
  async goToSubscription() {
    await this.subscriptionTab.click();
  }

  /**
   * Navigate to auto-apply tab
   */
  async goToAutoApply() {
    await this.autoApplyTab.click();
  }

  /**
   * Update profile information
   */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    bio?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  }) {
    await this.goToProfile();

    if (data.firstName) await this.firstNameInput.fill(data.firstName);
    if (data.lastName) await this.lastNameInput.fill(data.lastName);
    if (data.phone) await this.phoneInput.fill(data.phone);
    if (data.location) await this.locationInput.fill(data.location);
    if (data.bio) await this.bioTextarea.fill(data.bio);
    if (data.linkedin) await this.linkedinInput.fill(data.linkedin);
    if (data.github) await this.githubInput.fill(data.github);
    if (data.website) await this.websiteInput.fill(data.website);

    await this.saveProfileButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Upload profile photo
   */
  async uploadPhoto(filePath: string) {
    await this.goToProfile();

    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Update job preferences
   */
  async updatePreferences(data: {
    jobTypes?: string[];
    remote?: boolean;
    locations?: string[];
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
  }) {
    await this.goToPreferences();

    if (data.remote !== undefined) {
      if (data.remote) {
        await this.remotePreferenceCheckbox.check();
      } else {
        await this.remotePreferenceCheckbox.uncheck();
      }
    }

    if (data.salaryMin) {
      await this.salaryMinInput.fill(data.salaryMin.toString());
    }

    if (data.salaryMax) {
      await this.salaryMaxInput.fill(data.salaryMax.toString());
    }

    if (data.currency) {
      await this.salaryCurrencySelect.selectOption(data.currency);
    }

    await this.savePreferencesButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Update notification settings
   */
  async updateNotifications(settings: {
    emailApplications?: boolean;
    emailInterviews?: boolean;
    emailOffers?: boolean;
    emailRejections?: boolean;
    emailWeeklyDigest?: boolean;
    pushApplications?: boolean;
    pushInterviews?: boolean;
    pushOffers?: boolean;
  }) {
    await this.goToNotifications();

    const checkboxMap = {
      emailApplications: this.emailApplicationsCheckbox,
      emailInterviews: this.emailInterviewsCheckbox,
      emailOffers: this.emailOffersCheckbox,
      emailRejections: this.emailRejectionsCheckbox,
      emailWeeklyDigest: this.emailWeeklyDigestCheckbox,
      pushApplications: this.pushApplicationsCheckbox,
      pushInterviews: this.pushInterviewsCheckbox,
      pushOffers: this.pushOffersCheckbox,
    };

    for (const [key, value] of Object.entries(settings)) {
      const checkbox = checkboxMap[key as keyof typeof checkboxMap];
      if (value) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }

    await this.saveNotificationsButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    await this.goToSecurity();

    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmNewPasswordInput.fill(newPassword);

    await this.changePasswordButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Enable MFA
   */
  async enableMfa() {
    await this.goToSecurity();
    await this.enableMfaButton.click();
    // Handle MFA setup flow
  }

  /**
   * Disable MFA
   */
  async disableMfa() {
    await this.goToSecurity();
    await this.disableMfaButton.click();
    // Handle MFA disable confirmation
  }

  /**
   * Get MFA status
   */
  async getMfaStatus(): Promise<string> {
    await this.goToSecurity();
    return (await this.mfaStatus.textContent()) || '';
  }

  /**
   * View current plan
   */
  async getCurrentPlan(): Promise<string> {
    await this.goToSubscription();
    return (await this.planName.textContent()) || '';
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription() {
    await this.goToSubscription();
    await this.upgradeButton.click();
    // Handle upgrade flow
  }

  /**
   * Configure auto-apply settings
   */
  async configureAutoApply(settings: {
    enabled: boolean;
    keywords?: string[];
    locations?: string[];
    jobTypes?: string[];
    remote?: boolean;
    salaryMin?: number;
    experienceLevels?: string[];
    maxApplicationsPerDay?: number;
  }) {
    await this.goToAutoApply();

    if (settings.enabled) {
      await this.autoApplyEnabled.check();
    } else {
      await this.autoApplyEnabled.uncheck();
    }

    if (settings.maxApplicationsPerDay) {
      await this.maxApplicationsPerDay.fill(
        settings.maxApplicationsPerDay.toString()
      );
    }

    if (settings.remote !== undefined) {
      if (settings.remote) {
        await this.autoApplyRemote.check();
      } else {
        await this.autoApplyRemote.uncheck();
      }
    }

    if (settings.salaryMin) {
      await this.autoApplySalaryMin.fill(settings.salaryMin.toString());
    }

    await this.saveAutoApplyButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert settings page is displayed
   */
  async assertVisible() {
    await expect(this.profileTab).toBeVisible();
  }

  /**
   * Assert success message is displayed
   */
  async assertSuccess(expectedMessage?: string) {
    await expect(this.successMessage).toBeVisible();
    if (expectedMessage) {
      await expect(this.successMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Assert error message is displayed
   */
  async assertError(expectedMessage?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Assert MFA is enabled
   */
  async assertMfaEnabled() {
    await expect(this.mfaStatus).toContainText('Enabled', { ignoreCase: true });
  }

  /**
   * Assert current plan
   */
  async assertPlan(expectedPlan: string) {
    await expect(this.planName).toContainText(expectedPlan, { ignoreCase: true });
  }
}
