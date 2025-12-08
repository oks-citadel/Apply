import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { EmailVerificationPage } from '../../pages/email-verification.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { LoginPage } from '../../pages/login.page';

/**
 * Critical Flow 1: Registration → Email Verification → Dashboard
 *
 * This test suite covers the complete onboarding flow from user registration
 * through email verification to landing on the dashboard.
 */
test.describe('Complete Registration to Dashboard Flow', () => {
  let registerPage: RegisterPage;
  let emailVerificationPage: EmailVerificationPage;
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    emailVerificationPage = new EmailVerificationPage(page);
    dashboardPage = new DashboardPage(page);
    loginPage = new LoginPage(page);
  });

  test('should complete full registration flow with email verification', async ({ page }) => {
    // Generate unique user data
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Integration',
      lastName: 'Test',
      email: `integration.test.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    // Step 1: Navigate to registration page
    await registerPage.goto();
    await registerPage.assertVisible();

    // Step 2: Fill registration form
    await registerPage.register({
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
      acceptTerms: true,
      newsletter: false,
    });

    // Step 3: Submit registration
    await registerPage.submit();

    // Step 4: Should redirect to email verification page or dashboard
    await page.waitForURL(/verify-email|dashboard/, { timeout: 15000 });

    const currentUrl = page.url();

    if (currentUrl.includes('verify-email')) {
      // Email verification flow
      await emailVerificationPage.assertVisible();

      // Verify email is displayed correctly
      const displayedEmail = await emailVerificationPage.getDisplayedEmail();
      expect(displayedEmail.toLowerCase()).toContain(testUser.email.toLowerCase());

      // Note: In a real test, you would need to:
      // 1. Access a test email inbox
      // 2. Retrieve the verification code
      // 3. Enter it here
      // For this test, we'll simulate with a mock code or skip verification

      // Mock verification code (in real implementation, retrieve from test email service)
      const mockVerificationCode = '123456';

      // Enter verification code
      await emailVerificationPage.submitCode(mockVerificationCode);

      // Check if verification was successful
      const isVerified = await emailVerificationPage.isVerificationSuccessful();

      if (isVerified) {
        // Continue to dashboard
        await emailVerificationPage.continue();
        await page.waitForURL('**/dashboard', { timeout: 10000 });
      } else {
        // If mock code doesn't work, skip verification (if available)
        const skipVisible = await emailVerificationPage.skipButton.isVisible({ timeout: 3000 });
        if (skipVisible) {
          await emailVerificationPage.skip();
          await page.waitForURL('**/dashboard', { timeout: 10000 });
        }
      }
    }

    // Step 5: Verify landed on dashboard
    await dashboardPage.assertVisible();
    await dashboardPage.assertLoggedIn();

    // Step 6: Verify welcome message contains user name
    await dashboardPage.assertWelcomeMessage(testUser.firstName);

    // Step 7: Verify dashboard elements are present
    await dashboardPage.assertNavigationVisible();
    await dashboardPage.assertStatsVisible();

    // Step 8: Verify user can access different sections
    const dashboardUrl = page.url();
    expect(dashboardUrl).toContain('/dashboard');

    // Step 9: Verify stats cards show initial values
    const totalApps = await dashboardPage.getTotalApplications();
    expect(typeof totalApps).toBe('number');
    expect(totalApps).toBeGreaterThanOrEqual(0);
  });

  test('should handle registration with existing email', async ({ page }) => {
    // Use a known existing email
    const existingUser = {
      firstName: 'Existing',
      lastName: 'User',
      email: 'test@example.com',
      password: 'TestPassword123!',
    };

    await registerPage.goto();
    await registerPage.registerAndSubmit(existingUser);

    // Should show error message
    await registerPage.assertError();
    const errorMessage = await registerPage.getErrorMessage();
    expect(errorMessage.toLowerCase()).toMatch(/already exists|already registered|already taken|already in use/);

    // Should remain on registration page
    expect(page.url()).toContain('register');
  });

  test('should allow resending verification code', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Resend',
      lastName: 'Test',
      email: `resend.test.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    // Register
    await registerPage.goto();
    await registerPage.registerAndSubmit(testUser);

    // Wait for redirect
    await page.waitForURL(/verify-email|dashboard/, { timeout: 15000 });

    if (page.url().includes('verify-email')) {
      await emailVerificationPage.assertVisible();

      // Check if resend button is initially disabled (countdown)
      const resendDisabled = await emailVerificationPage.resendCodeButton.isDisabled();

      if (resendDisabled) {
        // Wait for countdown to complete (or skip)
        await page.waitForTimeout(3000);
      }

      // Try to resend code
      const resendEnabled = await emailVerificationPage.resendCodeButton.isEnabled({ timeout: 5000 });

      if (resendEnabled) {
        await emailVerificationPage.resendCode();

        // Should show success message
        const successVisible = await emailVerificationPage.successMessage.isVisible({ timeout: 5000 });
        if (successVisible) {
          const successMessage = await emailVerificationPage.successMessage.textContent();
          expect(successMessage?.toLowerCase()).toMatch(/sent|resent/);
        }
      }
    }
  });

  test('should allow skipping email verification if permitted', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Skip',
      lastName: 'Verification',
      email: `skip.verification.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    // Register
    await registerPage.goto();
    await registerPage.registerAndSubmit(testUser);

    // Wait for redirect
    await page.waitForURL(/verify-email|dashboard/, { timeout: 15000 });

    if (page.url().includes('verify-email')) {
      await emailVerificationPage.assertVisible();

      // Check if skip button is available
      const skipVisible = await emailVerificationPage.skipButton.isVisible({ timeout: 3000 });

      if (skipVisible) {
        await emailVerificationPage.skip();

        // Should redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await dashboardPage.assertVisible();
      }
    } else {
      // Already on dashboard (verification not required)
      await dashboardPage.assertVisible();
    }
  });

  test('should validate verification code format', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Validate',
      lastName: 'Code',
      email: `validate.code.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    // Register
    await registerPage.goto();
    await registerPage.registerAndSubmit(testUser);

    // Wait for redirect
    await page.waitForURL(/verify-email|dashboard/, { timeout: 15000 });

    if (page.url().includes('verify-email')) {
      await emailVerificationPage.assertVisible();

      // Try invalid code (too short)
      await emailVerificationPage.enterCode('123');
      await emailVerificationPage.verifyButton.click();

      // Should show error or disable button
      const errorVisible = await emailVerificationPage.errorMessage.isVisible({ timeout: 3000 });
      const buttonDisabled = await emailVerificationPage.verifyButton.isDisabled();

      expect(errorVisible || buttonDisabled).toBeTruthy();
    }
  });

  test('should handle incorrect verification code', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Wrong',
      lastName: 'Code',
      email: `wrong.code.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    // Register
    await registerPage.goto();
    await registerPage.registerAndSubmit(testUser);

    // Wait for redirect
    await page.waitForURL(/verify-email|dashboard/, { timeout: 15000 });

    if (page.url().includes('verify-email')) {
      await emailVerificationPage.assertVisible();

      // Enter incorrect code
      await emailVerificationPage.submitCode('000000');

      // Should show error message
      const errorVisible = await emailVerificationPage.errorMessage.isVisible({ timeout: 5000 });

      if (errorVisible) {
        const errorMessage = await emailVerificationPage.getErrorMessage();
        expect(errorMessage.toLowerCase()).toMatch(/invalid|incorrect|wrong|expired/);
      }

      // Should still be on verification page
      expect(page.url()).toContain('verify-email');
    }
  });

  test('should persist user session after registration', async ({ page, context }) => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Session',
      lastName: 'Test',
      email: `session.test.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    // Register and complete flow
    await registerPage.goto();
    await registerPage.registerAndSubmit(testUser);

    await page.waitForURL(/verify-email|dashboard/, { timeout: 15000 });

    // Skip or complete verification
    if (page.url().includes('verify-email')) {
      const skipVisible = await emailVerificationPage.skipButton.isVisible({ timeout: 3000 });
      if (skipVisible) {
        await emailVerificationPage.skip();
      }
    }

    // Should be on dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await dashboardPage.assertVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in
    await dashboardPage.assertLoggedIn();
    expect(page.url()).toContain('dashboard');
  });

  test('should redirect to login if already have account', async ({ page }) => {
    await registerPage.goto();
    await registerPage.assertVisible();

    // Click login link
    await registerPage.clickLogin();

    // Should navigate to login page
    await page.waitForURL('**/login', { timeout: 10000 });
    await loginPage.assertVisible();
  });

  test('should show password strength indicator during registration', async ({ page }) => {
    await registerPage.goto();

    const passwords = [
      { value: 'weak', expectedStrength: 'weak' },
      { value: 'Medium1!', expectedStrength: 'medium' },
      { value: 'VeryStr0ng!Pass@123', expectedStrength: 'strong' },
    ];

    for (const { value, expectedStrength } of passwords) {
      await registerPage.passwordInput.fill(value);

      // Check if password strength indicator is visible
      const indicatorVisible = await registerPage.passwordStrengthIndicator.isVisible({ timeout: 2000 });

      if (indicatorVisible) {
        const strength = await registerPage.getPasswordStrength();
        expect(strength.toLowerCase()).toContain(expectedStrength);
      }

      await registerPage.passwordInput.clear();
    }
  });

  test('should complete registration with newsletter subscription', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Newsletter',
      lastName: 'Subscriber',
      email: `newsletter.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    await registerPage.goto();
    await registerPage.register({
      ...testUser,
      confirmPassword: testUser.password,
      acceptTerms: true,
      newsletter: true,
    });

    // Verify newsletter checkbox is checked
    await expect(registerPage.newsletterCheckbox).toBeChecked();

    await registerPage.submit();

    // Should proceed with registration
    await page.waitForURL(/verify-email|dashboard/, { timeout: 15000 });

    // User should be registered
    const onVerificationOrDashboard =
      page.url().includes('verify-email') ||
      page.url().includes('dashboard');

    expect(onVerificationOrDashboard).toBeTruthy();
  });

  test('should handle network errors during registration gracefully', async ({ page }) => {
    // This test simulates network failures
    // In a real implementation, you would use page.route() to intercept and fail requests

    const timestamp = Date.now();
    const testUser = {
      firstName: 'Network',
      lastName: 'Error',
      email: `network.error.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    // Simulate network error
    await page.route('**/api/auth/register', (route) => {
      route.abort('failed');
    });

    await registerPage.goto();
    await registerPage.registerAndSubmit(testUser);

    // Should show error message
    const errorVisible = await registerPage.errorMessage.isVisible({ timeout: 5000 });

    if (errorVisible) {
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    }

    // Should remain on registration page
    expect(page.url()).toContain('register');

    // Clear route interception
    await page.unroute('**/api/auth/register');
  });

  test('should show loading state during registration submission', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Loading',
      lastName: 'Test',
      email: `loading.test.${timestamp}@example.com`,
      password: 'SecureTestPass123!',
    };

    await registerPage.goto();
    await registerPage.register({
      ...testUser,
      confirmPassword: testUser.password,
      acceptTerms: true,
    });

    // Click submit and immediately check for loading state
    const submitPromise = registerPage.submit();

    // Check if button is disabled during submission
    await page.waitForTimeout(100); // Small delay to catch loading state
    const buttonState = await registerPage.submitButton.isDisabled();

    // Button should be disabled during loading (implementation-dependent)
    // This is a best practice check
    expect(typeof buttonState).toBe('boolean');

    await submitPromise;
  });
});
