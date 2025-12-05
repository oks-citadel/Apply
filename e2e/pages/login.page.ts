import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Login Page
 */
export class LoginPage {
  readonly page: Page;

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly googleLoginButton: Locator;
  readonly linkedinLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.rememberMeCheckbox = page.locator('input[name="rememberMe"]');
    this.forgotPasswordLink = page.locator('a[href*="forgot-password"]');
    this.registerLink = page.locator('a[href*="register"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.googleLoginButton = page.locator('button:has-text("Google")');
    this.linkedinLoginButton = page.locator('button:has-text("LinkedIn")');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.submitButton.click();
  }

  /**
   * Login and wait for dashboard
   */
  async loginAndWait(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL('**/forgot-password');
  }

  /**
   * Click register link
   */
  async clickRegister() {
    await this.registerLink.click();
    await this.page.waitForURL('**/register');
  }

  /**
   * Login with Google
   */
  async loginWithGoogle() {
    await this.googleLoginButton.click();
    // Handle OAuth popup/redirect
  }

  /**
   * Login with LinkedIn
   */
  async loginWithLinkedIn() {
    await this.linkedinLoginButton.click();
    // Handle OAuth popup/redirect
  }

  /**
   * Check if login page is displayed
   */
  async isVisible(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Assert login page is displayed
   */
  async assertVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert error message is displayed
   */
  async assertError(expectedMessage?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (expectedMessage) {
      await expect(this.errorMessage).toHaveText(expectedMessage);
    }
  }

  /**
   * Assert submit button is disabled
   */
  async assertSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Assert submit button is enabled
   */
  async assertSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }
}
