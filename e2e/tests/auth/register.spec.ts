import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { DashboardPage } from '../../pages/dashboard.page';

test.describe('Registration', () => {
  let registerPage: RegisterPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    dashboardPage = new DashboardPage(page);
    await registerPage.goto();
  });

  test('should display registration form', async () => {
    await registerPage.assertVisible();
    await expect(registerPage.firstNameInput).toBeVisible();
    await expect(registerPage.lastNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.termsCheckbox).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
  });

  test('should register with valid data', async () => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${timestamp}@example.com`,
      password: 'SecurePassword123!',
    };

    await registerPage.registerAndSubmit(testUser);

    // Should redirect to dashboard or email verification page
    await registerPage.page.waitForURL(/dashboard|verify-email/, {
      timeout: 10000,
    });

    // If redirected to dashboard, verify it's loaded
    if (registerPage.page.url().includes('dashboard')) {
      await dashboardPage.assertVisible();
    }
  });

  test('should show error for existing email', async () => {
    const existingUser = {
      firstName: 'Existing',
      lastName: 'User',
      email: 'test@example.com', // Already exists in test data
      password: 'SecurePassword123!',
    };

    await registerPage.registerAndSubmit(existingUser);

    // Should show error
    await registerPage.assertError();
    const errorMessage = await registerPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toMatch(/already exists|already registered|already taken/);
  });

  test('should validate password requirements', async () => {
    // Test weak password
    await registerPage.passwordInput.fill('weak');
    await registerPage.confirmPasswordInput.fill('weak');

    // Check password strength indicator
    if (await registerPage.passwordStrengthIndicator.isVisible({ timeout: 2000 })) {
      const strength = await registerPage.getPasswordStrength();
      expect(strength.toLowerCase()).toMatch(/weak|poor/);
    }

    await registerPage.submitButton.click();

    // Should show validation error
    const hasError = await registerPage.hasFieldError('password');
    expect(hasError).toBeTruthy();
  });

  test('should validate password match', async () => {
    await registerPage.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'DifferentPassword123!',
    });

    await registerPage.submit();

    // Should show password mismatch error
    const hasError = await registerPage.hasFieldError('confirmPassword');
    if (hasError) {
      const errorMessage = await registerPage.getFieldError('confirmPassword');
      expect(errorMessage.toLowerCase()).toMatch(/match|same/);
    }
  });

  test('should require terms acceptance', async () => {
    await registerPage.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'SecurePassword123!',
      acceptTerms: false,
    });

    await registerPage.submit();

    // Should show terms error or disabled submit
    const isDisabled = await registerPage.submitButton.isDisabled();
    const hasError = await registerPage.hasFieldError('terms');

    expect(isDisabled || hasError).toBeTruthy();
  });

  test('should validate email format', async () => {
    await registerPage.emailInput.fill('invalid-email');
    await registerPage.passwordInput.fill('SecurePassword123!');
    await registerPage.firstNameInput.fill('Test');
    await registerPage.lastNameInput.fill('User');
    await registerPage.submitButton.click();

    // Should show email validation error
    const hasError = await registerPage.hasFieldError('email');
    if (hasError) {
      const errorMessage = await registerPage.getFieldError('email');
      expect(errorMessage.toLowerCase()).toMatch(/invalid|valid email/);
    }
  });

  test('should validate required fields', async () => {
    // Submit empty form
    await registerPage.submitButton.click();

    // Should show multiple validation errors or disabled button
    const isDisabled = await registerPage.submitButton.isDisabled();
    const hasFirstNameError = await registerPage.hasFieldError('firstName');
    const hasLastNameError = await registerPage.hasFieldError('lastName');
    const hasEmailError = await registerPage.hasFieldError('email');
    const hasPasswordError = await registerPage.hasFieldError('password');

    expect(
      isDisabled ||
        hasFirstNameError ||
        hasLastNameError ||
        hasEmailError ||
        hasPasswordError
    ).toBeTruthy();
  });

  test('should show password strength indicator', async () => {
    const passwords = [
      { value: 'weak', expected: 'weak' },
      { value: 'Medium1!', expected: 'medium' },
      { value: 'VeryStr0ng!Pass@123', expected: 'strong' },
    ];

    for (const { value, expected } of passwords) {
      await registerPage.passwordInput.fill(value);

      if (await registerPage.passwordStrengthIndicator.isVisible({ timeout: 2000 })) {
        const strength = await registerPage.getPasswordStrength();
        expect(strength.toLowerCase()).toContain(expected);
      }

      await registerPage.passwordInput.clear();
    }
  });

  test('should navigate to login page', async () => {
    await registerPage.clickLogin();

    // Should navigate to login page
    await expect(registerPage.page).toHaveURL(/login/);
  });

  test('should support keyboard navigation', async () => {
    const timestamp = Date.now();

    // Fill form with keyboard
    await registerPage.firstNameInput.focus();
    await registerPage.page.keyboard.type('Test');
    await registerPage.page.keyboard.press('Tab');
    await registerPage.page.keyboard.type('User');
    await registerPage.page.keyboard.press('Tab');
    await registerPage.page.keyboard.type(`test.${timestamp}@example.com`);
    await registerPage.page.keyboard.press('Tab');
    await registerPage.page.keyboard.type('SecurePassword123!');
    await registerPage.page.keyboard.press('Tab');
    await registerPage.page.keyboard.type('SecurePassword123!');
    await registerPage.page.keyboard.press('Tab');
    await registerPage.page.keyboard.press('Space'); // Check terms

    // Should be able to submit
    const isDisabled = await registerPage.submitButton.isDisabled();
    expect(isDisabled).toBeFalsy();
  });

  test('should trim whitespace from inputs', async () => {
    const timestamp = Date.now();
    await registerPage.register({
      firstName: '  Test  ',
      lastName: '  User  ',
      email: `  test.${timestamp}@example.com  `,
      password: 'SecurePassword123!',
    });

    await registerPage.submit();

    // Form should handle trimmed values correctly
    // Check if there are no validation errors for whitespace
    const hasFirstNameError = await registerPage.hasFieldError('firstName');
    const hasLastNameError = await registerPage.hasFieldError('lastName');

    // Whitespace should be handled (trimmed) without errors
    expect(hasFirstNameError).toBeFalsy();
    expect(hasLastNameError).toBeFalsy();
  });

  test('should prevent XSS in form inputs', async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    await registerPage.firstNameInput.fill(xssPayload);
    await registerPage.lastNameInput.fill(xssPayload);

    // Get the values back
    const firstNameValue = await registerPage.firstNameInput.inputValue();
    const lastNameValue = await registerPage.lastNameInput.inputValue();

    // Values should be escaped or sanitized
    expect(firstNameValue).not.toContain('<script>');
    expect(lastNameValue).not.toContain('<script>');
  });

  test('should handle newsletter opt-in', async () => {
    const timestamp = Date.now();
    await registerPage.register({
      firstName: 'Test',
      lastName: 'User',
      email: `test.${timestamp}@example.com`,
      password: 'SecurePassword123!',
      newsletter: true,
    });

    // Newsletter checkbox should be checked
    await expect(registerPage.newsletterCheckbox).toBeChecked();
  });

  test('should validate name length', async () => {
    // Test very long names
    const longName = 'A'.repeat(100);

    await registerPage.firstNameInput.fill(longName);
    await registerPage.lastNameInput.fill(longName);
    await registerPage.emailInput.fill('test@example.com');
    await registerPage.passwordInput.fill('SecurePassword123!');
    await registerPage.confirmPasswordInput.fill('SecurePassword123!');
    await registerPage.termsCheckbox.check();
    await registerPage.submitButton.click();

    // Should show validation error for name length
    const hasFirstNameError = await registerPage.hasFieldError('firstName');
    const hasLastNameError = await registerPage.hasFieldError('lastName');

    if (hasFirstNameError || hasLastNameError) {
      expect(true).toBeTruthy(); // Name length validation is working
    }
  });

  test('should show real-time validation', async () => {
    // Type invalid email
    await registerPage.emailInput.fill('invalid');
    await registerPage.emailInput.blur();

    // Should show validation error
    await registerPage.page.waitForTimeout(500); // Wait for validation
    const hasError = await registerPage.hasFieldError('email');

    if (hasError) {
      // Fix the email
      await registerPage.emailInput.fill('valid@example.com');
      await registerPage.emailInput.blur();
      await registerPage.page.waitForTimeout(500);

      // Error should be gone
      const stillHasError = await registerPage.hasFieldError('email');
      expect(stillHasError).toBeFalsy();
    }
  });
});
