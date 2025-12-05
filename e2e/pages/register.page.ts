import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Registration Page
 */
export class RegisterPage {
  readonly page: Page;

  // Locators
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly newsletterCheckbox: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly passwordStrengthIndicator: Locator;
  readonly googleRegisterButton: Locator;
  readonly linkedinRegisterButton: Locator;

  // Field error locators
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;
  readonly termsError: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    this.termsCheckbox = page.locator('input[name="acceptTerms"]');
    this.newsletterCheckbox = page.locator('input[name="newsletter"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.loginLink = page.locator('a[href*="login"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.passwordStrengthIndicator = page.locator(
      '[data-testid="password-strength"]'
    );
    this.googleRegisterButton = page.locator('button:has-text("Google")');
    this.linkedinRegisterButton = page.locator('button:has-text("LinkedIn")');

    // Field errors
    this.firstNameError = page.locator('[data-testid="firstName-error"]');
    this.lastNameError = page.locator('[data-testid="lastName-error"]');
    this.emailError = page.locator('[data-testid="email-error"]');
    this.passwordError = page.locator('[data-testid="password-error"]');
    this.confirmPasswordError = page.locator(
      '[data-testid="confirmPassword-error"]'
    );
    this.termsError = page.locator('[data-testid="terms-error"]');
  }

  /**
   * Navigate to registration page
   */
  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill registration form
   */
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    newsletter?: boolean;
  }) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(
      data.confirmPassword || data.password
    );

    if (data.acceptTerms !== false) {
      await this.termsCheckbox.check();
    }

    if (data.newsletter) {
      await this.newsletterCheckbox.check();
    }
  }

  /**
   * Submit registration form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Register and submit
   */
  async registerAndSubmit(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    newsletter?: boolean;
  }) {
    await this.register(data);
    await this.submit();
  }

  /**
   * Click login link
   */
  async clickLogin() {
    await this.loginLink.click();
    await this.page.waitForURL('**/login');
  }

  /**
   * Register with Google
   */
  async registerWithGoogle() {
    await this.googleRegisterButton.click();
    // Handle OAuth popup/redirect
  }

  /**
   * Register with LinkedIn
   */
  async registerWithLinkedIn() {
    await this.linkedinRegisterButton.click();
    // Handle OAuth popup/redirect
  }

  /**
   * Get password strength
   */
  async getPasswordStrength(): Promise<string> {
    const strength = await this.passwordStrengthIndicator.textContent();
    return strength || '';
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return (await this.errorMessage.textContent()) || '';
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    await this.successMessage.waitFor({ state: 'visible' });
    return (await this.successMessage.textContent()) || '';
  }

  /**
   * Check if field has error
   */
  async hasFieldError(field: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'terms'): Promise<boolean> {
    const errorLocator = this[`${field}Error`];
    try {
      await errorLocator.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get field error message
   */
  async getFieldError(field: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'terms'): Promise<string> {
    const errorLocator = this[`${field}Error`];
    return (await errorLocator.textContent()) || '';
  }

  /**
   * Assert registration page is displayed
   */
  async assertVisible() {
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
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
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
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
   * Assert field error is displayed
   */
  async assertFieldError(field: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'terms', expectedMessage?: string) {
    const errorLocator = this[`${field}Error`];
    await expect(errorLocator).toBeVisible();
    if (expectedMessage) {
      await expect(errorLocator).toContainText(expectedMessage);
    }
  }

  /**
   * Assert submit button is disabled
   */
  async assertSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Assert password strength
   */
  async assertPasswordStrength(expectedStrength: 'weak' | 'medium' | 'strong') {
    await expect(this.passwordStrengthIndicator).toContainText(
      expectedStrength,
      { ignoreCase: true }
    );
  }
}
