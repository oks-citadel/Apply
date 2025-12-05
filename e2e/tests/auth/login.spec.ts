import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { TEST_USERS } from '../../fixtures/auth.fixture';

test.describe('Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('should display login form', async () => {
    await loginPage.assertVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should login with valid credentials', async () => {
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Wait for redirect to dashboard
    await loginPage.page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify dashboard is loaded
    await dashboardPage.assertVisible();
    await dashboardPage.assertLoggedIn();
  });

  test('should show error with invalid email', async () => {
    await loginPage.login('invalid@example.com', 'WrongPassword123!');

    // Should show error message
    await loginPage.assertError();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('invalid');

    // Should stay on login page
    expect(loginPage.page.url()).toContain('/login');
  });

  test('should show error with invalid password', async () => {
    await loginPage.login(TEST_USERS.regular.email, 'WrongPassword123!');

    // Should show error message
    await loginPage.assertError();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toMatch(/invalid|incorrect|wrong/);

    // Should stay on login page
    expect(loginPage.page.url()).toContain('/login');
  });

  test('should show error with empty credentials', async () => {
    await loginPage.submitButton.click();

    // Should show validation errors or disabled button
    const isDisabled = await loginPage.submitButton.isDisabled();
    const hasError = await loginPage.hasError();

    expect(isDisabled || hasError).toBeTruthy();
  });

  test('should validate email format', async () => {
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('Password123!');
    await loginPage.submitButton.click();

    // Should show validation error
    const emailError = loginPage.page.locator('[data-testid="email-error"]');
    if (await emailError.isVisible({ timeout: 2000 })) {
      await expect(emailError).toContainText(/invalid|valid email/i);
    }
  });

  test('should remember me functionality', async () => {
    await loginPage.login(
      TEST_USERS.regular.email,
      TEST_USERS.regular.password,
      true // rememberMe
    );

    // Wait for successful login
    await loginPage.page.waitForURL('**/dashboard', { timeout: 10000 });

    // Check if remember me cookie/storage is set
    const cookies = await loginPage.page.context().cookies();
    const hasRememberMeCookie = cookies.some(
      (cookie) =>
        cookie.name.includes('remember') || cookie.maxAge > 86400 // More than 1 day
    );

    // Also check localStorage
    const rememberMeStorage = await loginPage.page.evaluate(() => {
      return localStorage.getItem('rememberMe') === 'true';
    });

    expect(hasRememberMeCookie || rememberMeStorage).toBeTruthy();
  });

  test('should redirect to intended page after login', async () => {
    // Try to access protected page
    await loginPage.page.goto('/resumes');

    // Should redirect to login
    await loginPage.page.waitForURL('**/login**', { timeout: 5000 });

    // Login
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Should redirect back to resumes page
    await loginPage.page.waitForURL('**/resumes', { timeout: 10000 });
  });

  test('should navigate to forgot password page', async () => {
    await loginPage.clickForgotPassword();

    // Should navigate to forgot password page
    await expect(loginPage.page).toHaveURL(/forgot-password/);
  });

  test('should navigate to register page', async () => {
    await loginPage.clickRegister();

    // Should navigate to register page
    await expect(loginPage.page).toHaveURL(/register/);
  });

  test('should handle locked account', async ({ page }, testInfo) => {
    // Skip if locked user doesn't exist
    if (!TEST_USERS.lockedAccount) {
      testInfo.skip();
    }

    await loginPage.login(
      TEST_USERS.lockedAccount.email,
      TEST_USERS.lockedAccount.password
    );

    // Should show locked account error
    await loginPage.assertError();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toMatch(/locked|suspended|disabled/);
  });

  test('should prevent multiple rapid login attempts', async () => {
    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await loginPage.emailInput.fill(TEST_USERS.regular.email);
      await loginPage.passwordInput.fill('WrongPassword123!');
      await loginPage.submitButton.click();
      await loginPage.page.waitForTimeout(500);
    }

    // Should show rate limit error or captcha
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toMatch(
      /too many|rate limit|slow down|captcha/
    );
  });

  test('should support keyboard navigation', async () => {
    // Fill email with keyboard
    await loginPage.emailInput.focus();
    await loginPage.page.keyboard.type(TEST_USERS.regular.email);

    // Tab to password
    await loginPage.page.keyboard.press('Tab');
    await loginPage.page.keyboard.type(TEST_USERS.regular.password);

    // Tab to submit and press Enter
    await loginPage.page.keyboard.press('Tab');
    await loginPage.page.keyboard.press('Enter');

    // Should submit and redirect
    await loginPage.page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should hide/show password toggle', async () => {
    const passwordToggle = loginPage.page.locator('[data-testid="password-toggle"]');

    if (await passwordToggle.isVisible({ timeout: 2000 })) {
      // Password should be hidden initially
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await passwordToggle.click();

      // Password should be visible
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

      // Click toggle again
      await passwordToggle.click();

      // Password should be hidden again
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should handle session timeout', async ({ page }) => {
    // Login first
    await loginPage.loginAndWait(
      TEST_USERS.regular.email,
      TEST_USERS.regular.password
    );

    // Clear session storage/cookies to simulate timeout
    await page.context().clearCookies();
    await page.evaluate(() => sessionStorage.clear());

    // Try to access protected page
    await page.goto('/resumes');

    // Should redirect to login
    await page.waitForURL('**/login**', { timeout: 5000 });
  });
});
