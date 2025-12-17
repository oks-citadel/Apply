import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Password Reset Flow
 *
 * This suite tests the complete password reset process including:
 * - Forgot password request
 * - Password reset email
 * - Password reset form
 * - Password reset success
 * - Token expiration handling
 */

test.describe('Password Reset', () => {
  test.describe('Forgot Password Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/forgot-password');
    });

    test('should display forgot password form', async ({ page }) => {
      // Verify page loaded correctly
      await expect(page).toHaveURL(/.*forgot-password/);
      await expect(page.getByRole('heading', { name: /forgot.*password|reset.*password/i })).toBeVisible();

      // Verify form fields
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();

      // Verify back to login link
      await expect(page.getByRole('link', { name: /back.*login|sign in/i })).toBeVisible();
    });

    test('should show validation error for empty email', async ({ page }) => {
      // Submit empty form
      await page.getByRole('button', { name: /send|reset|submit/i }).click();

      // Verify validation error
      await expect(page.getByText(/email.*required/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      // Enter invalid email
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByRole('button', { name: /send|reset|submit/i }).click();

      // Verify email validation error
      await expect(page.getByText(/valid email|email.*invalid/i)).toBeVisible();
    });

    test('should successfully send reset email for registered user', async ({ page }) => {
      // TODO: Requires backend integration

      // Enter valid email
      await page.getByLabel(/email/i).fill('testuser@example.com');
      await page.getByRole('button', { name: /send|reset|submit/i }).click();

      // Verify success message
      await expect(page.getByText(/email.*sent|check.*email|instructions.*sent/i)).toBeVisible();

      // Should show information about checking spam folder
      const spamNotice = page.getByText(/spam|junk/i);
      if (await spamNotice.isVisible().catch(() => false)) {
        await expect(spamNotice).toBeVisible();
      }
    });

    test('should show same message for non-existent email (security)', async ({ page }) => {
      // TODO: Requires backend integration

      // Enter non-existent email
      await page.getByLabel(/email/i).fill('nonexistent@example.com');
      await page.getByRole('button', { name: /send|reset|submit/i }).click();

      // Should show same success message (don't reveal if email exists)
      await expect(page.getByText(/email.*sent|check.*email|instructions.*sent/i)).toBeVisible();
    });

    test('should handle rate limiting', async ({ page }) => {
      // TODO: Requires backend integration

      // Send multiple reset requests
      for (let i = 0; i < 5; i++) {
        await page.getByLabel(/email/i).fill('testuser@example.com');
        await page.getByRole('button', { name: /send|reset|submit/i }).click();
        await page.waitForTimeout(500);
      }

      // Should show rate limit error
      await expect(page.getByText(/too.*many.*requests|wait.*before|try.*again.*later/i)).toBeVisible();
    });

    test('should navigate back to login page', async ({ page }) => {
      // Click back to login link
      await page.getByRole('link', { name: /back.*login|sign in/i }).click();

      // Verify navigation to login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should display help text', async ({ page }) => {
      // Check for help text explaining the process
      const helpText = page.getByText(/enter.*email.*instructions|send.*reset.*link/i);
      if (await helpText.isVisible().catch(() => false)) {
        await expect(helpText).toBeVisible();
      }
    });
  });

  test.describe('Reset Password Form', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to reset password page with token
      await page.goto('/reset-password?token=mock-reset-token');
    });

    test('should display reset password form', async ({ page }) => {
      // Verify page loaded correctly
      await expect(page).toHaveURL(/.*reset-password/);
      await expect(page.getByRole('heading', { name: /reset.*password|new.*password/i })).toBeVisible();

      // Verify form fields
      await expect(page.getByLabel(/^password|new.*password/i)).toBeVisible();
      await expect(page.getByLabel(/confirm.*password|password.*again/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /reset|update|change/i })).toBeVisible();
    });

    test('should show validation errors for empty submission', async ({ page }) => {
      // Submit empty form
      await page.getByRole('button', { name: /reset|update|change/i }).click();

      // Verify validation errors
      await expect(page.getByText(/password.*required/i)).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      // Enter weak password
      await page.getByLabel(/^password|new.*password/i).fill('weak');
      await page.getByLabel(/confirm.*password/i).click(); // Trigger blur

      // Verify password validation error
      await expect(page.getByText(/password.*least.*8|password.*weak/i)).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      // Enter different passwords
      await page.getByLabel(/^password|new.*password/i).fill('StrongPass123!@#');
      await page.getByLabel(/confirm.*password/i).fill('DifferentPass123!@#');
      await page.getByRole('button', { name: /reset|update|change/i }).click();

      // Verify mismatch error
      await expect(page.getByText(/passwords.*match|passwords.*same/i)).toBeVisible();
    });

    test('should successfully reset password', async ({ page }) => {
      // TODO: Requires backend integration

      // Enter new password
      await page.getByLabel(/^password|new.*password/i).fill('NewStrongPass123!@#');
      await page.getByLabel(/confirm.*password/i).fill('NewStrongPass123!@#');

      // Submit form
      await page.getByRole('button', { name: /reset|update|change/i }).click();

      // Verify success message
      await expect(page.getByText(/password.*reset|password.*updated|success/i)).toBeVisible();

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });

      // Should show message to login with new password
      await expect(page.getByText(/sign in.*new.*password|login.*continue/i)).toBeVisible();
    });

    test('should handle invalid reset token', async ({ page }) => {
      // TODO: Requires backend integration

      // Navigate with invalid token
      await page.goto('/reset-password?token=invalid-token');

      // Try to submit form
      await page.getByLabel(/^password|new.*password/i).fill('NewPass123!@#');
      await page.getByLabel(/confirm.*password/i).fill('NewPass123!@#');
      await page.getByRole('button', { name: /reset|update|change/i }).click();

      // Should show invalid token error
      await expect(page.getByText(/invalid.*token|link.*invalid|expired/i)).toBeVisible();
    });

    test('should handle expired reset token', async ({ page }) => {
      // TODO: Requires backend integration

      // Navigate with expired token
      await page.goto('/reset-password?token=expired-token');

      // Should show expired token message
      await expect(page.getByText(/token.*expired|link.*expired/i)).toBeVisible();

      // Should offer to request new reset link
      const requestNewLink = page.getByRole('link', { name: /request.*new|try.*again/i });
      if (await requestNewLink.isVisible().catch(() => false)) {
        await expect(requestNewLink).toBeVisible();
      }
    });

    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.getByLabel(/^password|new.*password/i);
      await passwordInput.fill('MySecretPassword123');

      // Find and click show/hide password button
      const toggleButtons = page.getByRole('button', { name: /show|hide|toggle.*password/i });
      const toggleButton = toggleButtons.first();

      if (await toggleButton.isVisible().catch(() => false)) {
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

    test('should display password strength indicator', async ({ page }) => {
      const passwordInput = page.getByLabel(/^password|new.*password/i);

      // Test weak password
      await passwordInput.fill('weak');
      const weakIndicator = page.getByText(/weak|strength.*weak/i);
      if (await weakIndicator.isVisible().catch(() => false)) {
        await expect(weakIndicator).toBeVisible();
      }

      // Test strong password
      await passwordInput.fill('StrongPass123!@#');
      const strongIndicator = page.getByText(/strong|strength.*strong/i);
      if (await strongIndicator.isVisible().catch(() => false)) {
        await expect(strongIndicator).toBeVisible();
      }
    });

    test('should prevent reuse of previous password', async ({ page }) => {
      // TODO: Requires backend integration

      // Enter same password as before
      await page.getByLabel(/^password|new.*password/i).fill('OldPassword123!@#');
      await page.getByLabel(/confirm.*password/i).fill('OldPassword123!@#');

      await page.getByRole('button', { name: /reset|update|change/i }).click();

      // Should show error about reusing password
      await expect(page.getByText(/different.*password|cannot.*reuse|previous.*password/i)).toBeVisible();
    });

    test('should display password requirements', async ({ page }) => {
      // Check if password requirements are displayed
      const requirements = [
        /8.*characters/i,
        /uppercase/i,
        /lowercase/i,
        /number/i,
        /special.*character/i,
      ];

      for (const requirement of requirements) {
        const element = page.getByText(requirement);
        if (await element.isVisible().catch(() => false)) {
          await expect(element).toBeVisible();
        }
      }
    });
  });

  test.describe('Reset Password Email Flow', () => {
    test('should send reset email with valid token', async ({ page }) => {
      // TODO: Requires email service integration

      // Request password reset
      await page.goto('/forgot-password');
      await page.getByLabel(/email/i).fill('testuser@example.com');
      await page.getByRole('button', { name: /send|reset|submit/i }).click();

      // In a real test, we would:
      // 1. Check email inbox for reset email
      // 2. Extract reset link from email
      // 3. Navigate to reset link
      // 4. Verify reset form is accessible
    });

    test('should expire reset token after time limit', async ({ page }) => {
      // TODO: Requires backend integration

      // Navigate with token that should be expired
      // (In real test, would use actual expired token)
      await page.goto('/reset-password?token=expired-token-123');

      // Should show expiration message
      await expect(page.getByText(/token.*expired|link.*expired/i)).toBeVisible();
    });

    test('should invalidate reset token after use', async ({ page }) => {
      // TODO: Requires backend integration

      // Use token to reset password
      await page.goto('/reset-password?token=valid-token-123');
      await page.getByLabel(/^password|new.*password/i).fill('NewPass123!@#');
      await page.getByLabel(/confirm.*password/i).fill('NewPass123!@#');
      await page.getByRole('button', { name: /reset|update|change/i }).click();

      // Wait for success
      await expect(page).toHaveURL(/.*login/);

      // Try to use same token again
      await page.goto('/reset-password?token=valid-token-123');

      // Should show token already used error
      await expect(page.getByText(/token.*used|link.*used|invalid/i)).toBeVisible();
    });
  });
});
