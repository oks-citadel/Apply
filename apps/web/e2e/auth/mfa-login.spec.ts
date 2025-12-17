import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../utils/test-data';

/**
 * E2E Tests for Multi-Factor Authentication (MFA) Login Flow
 *
 * This suite tests the MFA login process including:
 * - MFA setup and enrollment
 * - MFA code verification
 * - Backup codes usage
 * - Remember device functionality
 * - MFA recovery flows
 */

test.describe('MFA Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.skip('should prompt for MFA code after valid credentials', async ({ page }) => {
    // TODO: Requires backend integration and MFA setup
    const { email, password } = TEST_USERS.withMFA;

    // Login with credentials
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Should be redirected to MFA verification page
    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Verify MFA code input is displayed
    await expect(page.getByLabel(/code|verification.*code|authenticator.*code/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /verify|submit/i })).toBeVisible();
  });

  test.skip('should successfully verify MFA code', async ({ page }) => {
    // TODO: Requires backend integration and MFA setup
    const { email, password } = TEST_USERS.withMFA;
    const validMFACode = '123456'; // Mock code

    // Login with credentials
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for MFA page
    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Enter MFA code
    await page.getByLabel(/code|verification.*code|authenticator.*code/i).fill(validMFACode);
    await page.getByRole('button', { name: /verify|submit/i }).click();

    // Should redirect to dashboard after successful verification
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test.skip('should show error for invalid MFA code', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;
    const invalidMFACode = '000000';

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Enter invalid MFA code
    await page.getByLabel(/code|verification.*code|authenticator.*code/i).fill(invalidMFACode);
    await page.getByRole('button', { name: /verify|submit/i }).click();

    // Verify error message
    await expect(page.getByText(/invalid.*code|incorrect.*code|verification.*failed/i)).toBeVisible();
  });

  test.skip('should allow login with backup code', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;
    const backupCode = 'BACKUP-CODE-12345';

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Click "Use backup code" link
    await page.getByRole('link', { name: /backup.*code|recovery.*code/i }).click();

    // Enter backup code
    await page.getByLabel(/backup.*code|recovery.*code/i).fill(backupCode);
    await page.getByRole('button', { name: /verify|submit/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should show warning that backup code was used
    await expect(page.getByText(/backup.*code.*used|regenerate.*codes/i)).toBeVisible();
  });

  test.skip('should support "Remember this device" option', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;
    const validMFACode = '123456';

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Check "Remember this device" if available
    const rememberDeviceCheckbox = page.getByLabel(/remember.*device|trust.*device/i);
    if (await rememberDeviceCheckbox.isVisible()) {
      await rememberDeviceCheckbox.check();
    }

    // Enter MFA code and verify
    await page.getByLabel(/code|verification.*code/i).fill(validMFACode);
    await page.getByRole('button', { name: /verify|submit/i }).click();

    // Verify device trust cookie is set
    const cookies = await page.context().cookies();
    const deviceTrustCookie = cookies.find(c => c.name.includes('device') || c.name.includes('trust'));
    expect(deviceTrustCookie).toBeDefined();
  });

  test.skip('should allow resending MFA code', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Click "Resend code" link (for SMS/Email MFA)
    const resendButton = page.getByRole('button', { name: /resend.*code/i });
    if (await resendButton.isVisible()) {
      await resendButton.click();

      // Verify success message
      await expect(page.getByText(/code.*sent|new.*code/i)).toBeVisible();
    }
  });

  test.skip('should handle MFA timeout', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Wait for timeout (usually 5-10 minutes)
    // In test, we might simulate this with a clock advance
    await page.waitForTimeout(300000); // 5 minutes

    // Try to verify with a code
    await page.getByLabel(/code|verification.*code/i).fill('123456');
    await page.getByRole('button', { name: /verify|submit/i }).click();

    // Should show timeout error
    await expect(page.getByText(/session.*expired|timeout|try.*again/i)).toBeVisible();
  });

  test.skip('should navigate to MFA recovery flow', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Click "Lost your device?" or similar recovery link
    const recoveryLink = page.getByRole('link', { name: /lost.*device|can't.*access|recovery/i });
    if (await recoveryLink.isVisible()) {
      await recoveryLink.click();

      // Should navigate to recovery flow
      await expect(page).toHaveURL(/.*recovery|.*support/);
    }
  });

  test.skip('should auto-submit MFA code when complete', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;
    const validMFACode = '123456';

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Enter 6-digit code (should auto-submit)
    const codeInput = page.getByLabel(/code|verification.*code/i);
    await codeInput.fill(validMFACode);

    // Should auto-submit and redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test.skip('should display MFA code input with proper formatting', async ({ page }) => {
    // TODO: Requires backend integration
    const { email, password } = TEST_USERS.withMFA;

    // Login and reach MFA page
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*mfa|.*verify|.*two-factor/, { timeout: 10000 });

    // Check if using individual digit inputs or single input
    const digitInputs = page.locator('input[type="text"]').filter({ hasText: /^\d$/ });
    const digitCount = await digitInputs.count();

    if (digitCount === 6) {
      // Individual digit inputs - verify they exist
      expect(digitCount).toBe(6);

      // Enter code across individual inputs
      for (let i = 0; i < 6; i++) {
        await digitInputs.nth(i).fill(String(i));
      }
    } else {
      // Single input with maxLength
      const codeInput = page.getByLabel(/code|verification.*code/i);
      await expect(codeInput).toHaveAttribute('maxlength', '6');
    }
  });
});
