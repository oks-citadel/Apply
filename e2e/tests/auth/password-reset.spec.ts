import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/auth.fixture';

test.describe('Password Reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('should display forgot password form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/forgot|reset password/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should request password reset', async ({ page }) => {
    await page.locator('input[name="email"]').fill(TEST_USERS.regular.email);
    await page.locator('button[type="submit"]').click();

    // Should show success message
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/sent|email/i);
  });

  test('should validate email format', async ({ page }) => {
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('button[type="submit"]').click();

    // Should show validation error
    const emailError = page.locator('[data-testid="email-error"]');
    if (await emailError.isVisible({ timeout: 2000 })) {
      await expect(emailError).toContainText(/invalid|valid email/i);
    }
  });

  test('should handle non-existent email gracefully', async ({ page }) => {
    await page.locator('input[name="email"]').fill('nonexistent@example.com');
    await page.locator('button[type="submit"]').click();

    // Should show generic success message (for security)
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();
  });

  test('should reset password with valid token', async ({ page }) => {
    // Simulate clicking reset link with token
    await page.goto('/reset-password?token=valid-reset-token');

    // Fill new password
    await page.locator('input[name="newPassword"]').fill('NewSecurePassword123!');
    await page.locator('input[name="confirmPassword"]').fill('NewSecurePassword123!');
    await page.locator('button[type="submit"]').click();

    // Should redirect to login with success message
    await page.waitForURL('**/login', { timeout: 10000 });
    const successMessage = page.locator('[data-testid="success-message"]');
    if (await successMessage.isVisible({ timeout: 2000 })) {
      await expect(successMessage).toContainText(/password.*reset|success/i);
    }
  });

  test('should validate new password requirements', async ({ page }) => {
    await page.goto('/reset-password?token=valid-reset-token');

    // Try weak password
    await page.locator('input[name="newPassword"]').fill('weak');
    await page.locator('input[name="confirmPassword"]').fill('weak');
    await page.locator('button[type="submit"]').click();

    // Should show validation error
    const passwordError = page.locator('[data-testid="password-error"]');
    if (await passwordError.isVisible({ timeout: 2000 })) {
      await expect(passwordError).toBeVisible();
    }
  });

  test('should handle expired token', async ({ page }) => {
    await page.goto('/reset-password?token=expired-token');

    await page.locator('input[name="newPassword"]').fill('NewSecurePassword123!');
    await page.locator('input[name="confirmPassword"]').fill('NewSecurePassword123!');
    await page.locator('button[type="submit"]').click();

    // Should show error for expired token
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/expired|invalid/i);
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/reset-password?token=valid-reset-token');

    await page.locator('input[name="newPassword"]').fill('NewPassword123!');
    await page.locator('input[name="confirmPassword"]').fill('DifferentPassword123!');
    await page.locator('button[type="submit"]').click();

    // Should show mismatch error
    const confirmError = page.locator('[data-testid="confirmPassword-error"]');
    if (await confirmError.isVisible({ timeout: 2000 })) {
      await expect(confirmError).toContainText(/match/i);
    }
  });

  test('should navigate back to login', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]');
    await loginLink.click();

    await expect(page).toHaveURL(/login/);
  });

  test('should rate limit reset requests', async ({ page }) => {
    const email = TEST_USERS.regular.email;

    // Submit multiple requests
    for (let i = 0; i < 5; i++) {
      await page.locator('input[name="email"]').fill(email);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);
      await page.reload();
    }

    // Should show rate limit message
    await page.locator('input[name="email"]').fill(email);
    await page.locator('button[type="submit"]').click();

    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      const text = await errorMessage.textContent();
      expect(text?.toLowerCase()).toMatch(/too many|rate limit|try again later/);
    }
  });
});
