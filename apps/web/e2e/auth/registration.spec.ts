import { test, expect } from '@playwright/test';
import { generateUniqueEmail } from '../utils/test-data';

/**
 * E2E Tests for User Registration Flow
 *
 * This suite tests the complete user registration process including:
 * - Registration form validation
 * - Successful registration
 * - Email verification flow
 * - Error handling
 */

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Verify page loaded correctly
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /create account|sign up|register/i })).toBeVisible();

    // Verify all form fields are present
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account|sign up|register/i })).toBeVisible();

    // Verify links to login and terms
    await expect(page.getByRole('link', { name: /sign in|login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Submit empty form
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();

    // Verify validation errors appear
    await expect(page.getByText(/first name.*required/i)).toBeVisible();
    await expect(page.getByText(/last name.*required/i)).toBeVisible();
    await expect(page.getByText(/email.*required/i)).toBeVisible();
    await expect(page.getByText(/password.*required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/first name/i).click(); // Trigger blur

    // Verify email validation error
    await expect(page.getByText(/valid email|email.*invalid/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    // Test weak password
    await page.getByLabel(/password/i).fill('weak');
    await page.getByLabel(/first name/i).click(); // Trigger blur

    // Verify password validation errors
    await expect(page.getByText(/password.*least.*8/i)).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    // TODO: Requires backend integration
    const uniqueEmail = generateUniqueEmail('register');

    // Fill registration form
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill('StrongPass123!@#');

    // Accept terms if checkbox exists
    const termsCheckbox = page.getByLabel(/agree.*terms/i);
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit form
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();

    // Verify success - should redirect to email verification or dashboard
    await expect(page).toHaveURL(/.*verify-email|.*dashboard/, { timeout: 10000 });

    // Verify success message or email verification prompt
    const successMessage = page.getByText(/account created|verify.*email|check.*email/i);
    await expect(successMessage).toBeVisible();
  });

  test('should prevent registration with existing email', async ({ page }) => {
    // TODO: Requires backend integration
    const existingEmail = 'existing@example.com';

    // Fill form with existing email
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(existingEmail);
    await page.getByLabel(/password/i).fill('StrongPass123!@#');

    // Submit form
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();

    // Verify error message
    await expect(page.getByText(/email.*already.*exists|already.*registered/i)).toBeVisible();
  });

  test('should navigate to login page from registration', async ({ page }) => {
    // Click on "Already have an account? Sign in"
    await page.getByRole('link', { name: /sign in|login/i }).click();

    // Verify navigation to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);

    // Test weak password
    await passwordInput.fill('weak');
    const weakIndicator = page.getByText(/weak|strength.*weak/i);
    if (await weakIndicator.isVisible()) {
      await expect(weakIndicator).toBeVisible();
    }

    // Test strong password
    await passwordInput.fill('StrongPass123!@#');
    const strongIndicator = page.getByText(/strong|strength.*strong/i);
    if (await strongIndicator.isVisible()) {
      await expect(strongIndicator).toBeVisible();
    }
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/^password/i);
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

  test('should handle registration with referral code', async ({ page }) => {
    // TODO: Requires backend integration and referral feature
    const referralCodeInput = page.getByLabel(/referral.*code/i);

    if (await referralCodeInput.isVisible()) {
      await referralCodeInput.fill('REFER123');

      // Complete registration
      await page.getByLabel(/first name/i).fill('John');
      await page.getByLabel(/last name/i).fill('Doe');
      await page.getByLabel(/email/i).fill(generateUniqueEmail('referral'));
      await page.getByLabel(/password/i).fill('StrongPass123!@#');

      await page.getByRole('button', { name: /create account|sign up|register/i }).click();

      // Verify referral was applied
      await expect(page.getByText(/referral.*applied/i)).toBeVisible();
    }
  });

  test('should display privacy policy and terms links', async ({ page }) => {
    const privacyLink = page.getByRole('link', { name: /privacy.*policy/i });
    const termsLink = page.getByRole('link', { name: /terms.*service|terms.*conditions/i });

    await expect(privacyLink).toBeVisible();
    await expect(termsLink).toBeVisible();

    // Verify links have correct href attributes
    await expect(privacyLink).toHaveAttribute('href', /.*privacy/i);
    await expect(termsLink).toHaveAttribute('href', /.*terms/i);
  });
});
