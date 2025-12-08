import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Email Verification Page
 */
export class EmailVerificationPage {
  readonly page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly verificationMessage: Locator;
  readonly emailDisplay: Locator;
  readonly verificationCodeInput: Locator;
  readonly verifyButton: Locator;
  readonly resendCodeButton: Locator;
  readonly changeEmailLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly countdown: Locator;

  // Success state
  readonly successIcon: Locator;
  readonly continueButton: Locator;
  readonly skipButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.pageTitle = page.locator('h1:has-text("Verify")');
    this.verificationMessage = page.locator('[data-testid="verification-message"]');
    this.emailDisplay = page.locator('[data-testid="email-display"]');
    this.verificationCodeInput = page.locator('input[name="verificationCode"]');
    this.verifyButton = page.locator('button:has-text("Verify")');
    this.resendCodeButton = page.locator('button:has-text("Resend")');
    this.changeEmailLink = page.locator('a:has-text("Change Email")');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.countdown = page.locator('[data-testid="countdown"]');

    // Success state
    this.successIcon = page.locator('[data-testid="success-icon"]');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.skipButton = page.locator('button:has-text("Skip")');
  }

  /**
   * Navigate to email verification page
   */
  async goto() {
    await this.page.goto('/verify-email');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Enter verification code
   */
  async enterCode(code: string) {
    await this.verificationCodeInput.fill(code);
  }

  /**
   * Submit verification code
   */
  async submitCode(code: string) {
    await this.enterCode(code);
    await this.verifyButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click resend code button
   */
  async resendCode() {
    await this.resendCodeButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Change email address
   */
  async changeEmail() {
    await this.changeEmailLink.click();
  }

  /**
   * Continue after successful verification
   */
  async continue() {
    await this.continueButton.click();
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Skip verification
   */
  async skip() {
    await this.skipButton.click();
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Get displayed email
   */
  async getDisplayedEmail(): Promise<string> {
    return (await this.emailDisplay.textContent()) || '';
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return (await this.errorMessage.textContent()) || '';
  }

  /**
   * Check if verification was successful
   */
  async isVerificationSuccessful(): Promise<boolean> {
    try {
      await this.successIcon.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get countdown time
   */
  async getCountdownTime(): Promise<number> {
    const text = await this.countdown.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Assert verification page is displayed
   */
  async assertVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.verificationCodeInput).toBeVisible();
    await expect(this.verifyButton).toBeVisible();
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
   * Assert success message is displayed
   */
  async assertSuccess() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successIcon).toBeVisible();
  }

  /**
   * Assert resend button is disabled
   */
  async assertResendDisabled() {
    await expect(this.resendCodeButton).toBeDisabled();
  }

  /**
   * Assert resend button is enabled
   */
  async assertResendEnabled() {
    await expect(this.resendCodeButton).toBeEnabled();
  }
}
