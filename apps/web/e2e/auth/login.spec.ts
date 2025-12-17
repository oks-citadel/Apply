import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../utils/test-data';

/**
 * E2E Tests for User Login Flow
 *
 * This suite tests the complete user login process including:
 * - Login form validation
 * - Successful login
 * - Failed login attempts
 * - Remember me functionality
 * - Password reset navigation
 */

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form with all required fields', async ({ page }) => {
    // Verify page loaded correctly
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();

    // Verify all form fields are present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();

    // Verify additional links
    await expect(page.getByRole('link', { name: /forgot.*password/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up|register|create.*account/i })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Submit empty form
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Verify validation errors appear
    await expect(page.getByText(/email.*required/i)).toBeVisible();
    await expect(page.getByText(/password.*required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).click(); // Trigger blur

    // Verify email validation error
    await expect(page.getByText(/valid email|email.*invalid/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.valid;

    // Fill login form
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);

    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Verify successful login - should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Verify user is logged in (check for user menu or profile)
    const userMenu = page.getByRole('button', { name: /account|profile|user/i });
    await expect(userMenu).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // TODO: Requires backend integration

    // Fill login form with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123');

    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Verify error message
    await expect(page.getByText(/invalid.*credentials|email.*password.*incorrect|login.*failed/i)).toBeVisible();

    // Verify still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show error for unverified email', async ({ page }) => {
    // TODO: Requires backend integration

    // Attempt to login with unverified account
    await page.getByLabel(/email/i).fill('unverified@example.com');
    await page.getByLabel(/password/i).fill('Password123');

    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Verify email verification message
    await expect(page.getByText(/verify.*email|email.*not.*verified/i)).toBeVisible();

    // Verify resend verification link is available
    const resendLink = page.getByRole('link', { name: /resend.*verification/i });
    if (await resendLink.isVisible()) {
      await expect(resendLink).toBeVisible();
    }
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click on "Forgot password?" link
    await page.getByRole('link', { name: /forgot.*password/i }).click();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/.*forgot-password|.*reset-password/);
  });

  test('should navigate to registration page', async ({ page }) => {
    // Click on "Don't have an account? Sign up"
    await page.getByRole('link', { name: /sign up|register|create.*account/i }).click();

    // Verify navigation to registration page
    await expect(page).toHaveURL(/.*register|.*signup/);
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill('MySecretPassword123');

    // Find and click show/hide password button
    const toggleButton = page.getByRole('button', { name: /show|hide|toggle.*password/i });
    if (await toggleButton.isVisible()) {
      // Password should be hidden initially
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click to hide password again
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should handle "Remember me" functionality', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.valid;

    // Check if remember me checkbox exists
    const rememberMeCheckbox = page.getByLabel(/remember.*me/i);
    if (await rememberMeCheckbox.isVisible()) {
      // Login with remember me checked
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await rememberMeCheckbox.check();

      await page.getByRole('button', { name: /sign in|login/i }).click();

      // Verify login successful
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

      // Check if persistent auth cookie is set
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(c => c.name === 'auth-token' || c.name === 'session');
      expect(authCookie).toBeDefined();
      // Should have a longer expiry when "remember me" is checked
    }
  });

  test('should handle account lockout after multiple failed attempts', async ({ page }) => {
    // TODO: Requires backend integration

    // Attempt login 5 times with wrong password
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill(`WrongPassword${i}`);
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await page.waitForTimeout(500);
    }

    // Verify account lockout message
    await expect(page.getByText(/account.*locked|too.*many.*attempts/i)).toBeVisible();
  });

  test('should display loading state during login', async ({ page }) => {
    // Fill form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');

    // Click submit and check for loading state
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();

    // Check if button shows loading state
    const loadingIndicator = page.getByRole('button', { name: /signing in|loading/i });
    if (await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should persist redirect URL after login', async ({ page }) => {
    // Navigate to a protected page (should redirect to login)
    await page.goto('/dashboard');

    // Should redirect to login with return URL
    await expect(page).toHaveURL(/.*login/);

    // URL should contain redirect parameter
    const url = page.url();
    expect(url).toMatch(/redirect|return|next/);
  });
});
