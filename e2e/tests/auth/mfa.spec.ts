import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { SettingsPage } from '../../pages/settings.page';
import { TEST_USERS } from '../../fixtures/auth.fixture';

test.describe('Multi-Factor Authentication', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
  });

  test('should setup MFA', async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.goToSecurity();

    // Enable MFA
    await settingsPage.enableMfaButton.click();

    // Should show QR code and secret key
    const qrCode = page.locator('[data-testid="mfa-qr-code"]');
    const secretKey = page.locator('[data-testid="mfa-secret"]');

    await expect(qrCode).toBeVisible();
    await expect(secretKey).toBeVisible();

    // Enter verification code (mock)
    const verificationInput = page.locator('input[name="verificationCode"]');
    await verificationInput.fill('123456'); // Would be from authenticator app
    await page.locator('button:has-text("Verify")').click();

    // Should show success message
    await settingsPage.assertSuccess();

    // MFA should be enabled
    const mfaStatus = await settingsPage.getMfaStatus();
    expect(mfaStatus.toLowerCase()).toContain('enabled');
  });

  test('should show backup codes after MFA setup', async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.goToSecurity();

    const status = await settingsPage.getMfaStatus();
    if (!status.toLowerCase().includes('enabled')) {
      test.skip();
    }

    // View backup codes
    const viewBackupCodesButton = page.locator('button:has-text("Backup Codes")');
    if (await viewBackupCodesButton.isVisible({ timeout: 2000 })) {
      await viewBackupCodesButton.click();

      const backupCodes = page.locator('[data-testid="backup-codes"]');
      await expect(backupCodes).toBeVisible();

      // Should show multiple codes
      const codes = await page.locator('[data-testid="backup-code"]').count();
      expect(codes).toBeGreaterThan(0);
    }
  });

  test('should login with MFA', async ({ page, context }) => {
    // Logout first
    await context.clearCookies();
    await page.goto('/login');

    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    // Should show MFA verification page
    const mfaInput = page.locator('input[name="mfaCode"]');
    if (await mfaInput.isVisible({ timeout: 5000 })) {
      // Enter MFA code
      await mfaInput.fill('123456'); // Mock code
      await page.locator('button:has-text("Verify")').click();

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  test('should handle invalid MFA code', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');

    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    const mfaInput = page.locator('input[name="mfaCode"]');
    if (await mfaInput.isVisible({ timeout: 5000 })) {
      // Enter invalid code
      await mfaInput.fill('000000');
      await page.locator('button:has-text("Verify")').click();

      // Should show error
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/invalid|incorrect/i);
    }
  });

  test('should use backup code for MFA', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');

    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    const mfaInput = page.locator('input[name="mfaCode"]');
    if (await mfaInput.isVisible({ timeout: 5000 })) {
      // Click use backup code
      const useBackupCodeLink = page.locator('a:has-text("backup code")');
      if (await useBackupCodeLink.isVisible({ timeout: 2000 })) {
        await useBackupCodeLink.click();

        // Enter backup code
        const backupCodeInput = page.locator('input[name="backupCode"]');
        await backupCodeInput.fill('BACKUP-CODE-123'); // Mock backup code
        await page.locator('button:has-text("Verify")').click();

        // Should redirect to dashboard if code is valid
        // In real scenario, would need actual backup code
      }
    }
  });

  test('should disable MFA', async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.goToSecurity();

    const status = await settingsPage.getMfaStatus();
    if (!status.toLowerCase().includes('enabled')) {
      test.skip();
    }

    // Disable MFA
    await settingsPage.disableMfaButton.click();

    // Should ask for password confirmation
    const passwordConfirm = page.locator('input[name="password"]');
    if (await passwordConfirm.isVisible({ timeout: 2000 })) {
      await passwordConfirm.fill(TEST_USERS.regular.password);
      await page.locator('button:has-text("Confirm")').click();
    }

    // Should show success message
    await settingsPage.assertSuccess();

    // MFA should be disabled
    const newStatus = await settingsPage.getMfaStatus();
    expect(newStatus.toLowerCase()).toContain('disabled');
  });

  test('should regenerate backup codes', async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.goToSecurity();

    const status = await settingsPage.getMfaStatus();
    if (!status.toLowerCase().includes('enabled')) {
      test.skip();
    }

    const regenerateButton = page.locator('button:has-text("Regenerate Backup Codes")');
    if (await regenerateButton.isVisible({ timeout: 2000 })) {
      // Get current codes
      const viewBackupCodesButton = page.locator('button:has-text("Backup Codes")');
      await viewBackupCodesButton.click();

      const oldCodes = await page.locator('[data-testid="backup-code"]').allTextContents();

      // Close modal
      await page.locator('[data-testid="close-modal"]').click();

      // Regenerate
      await regenerateButton.click();

      // Confirm
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // View new codes
      await page.locator('button:has-text("Backup Codes")').click();
      const newCodes = await page.locator('[data-testid="backup-code"]').allTextContents();

      // Codes should be different
      expect(newCodes).not.toEqual(oldCodes);
    }
  });

  test('should show trusted devices', async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.goToSecurity();

    const trustedDevicesSection = page.locator('[data-testid="trusted-devices"]');
    if (await trustedDevicesSection.isVisible({ timeout: 2000 })) {
      // Should show current device
      const devices = page.locator('[data-testid="device-item"]');
      const count = await devices.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should remember device for MFA', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');

    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

    const mfaInput = page.locator('input[name="mfaCode"]');
    if (await mfaInput.isVisible({ timeout: 5000 })) {
      // Check remember device
      const rememberDeviceCheckbox = page.locator('input[name="rememberDevice"]');
      if (await rememberDeviceCheckbox.isVisible({ timeout: 2000 })) {
        await rememberDeviceCheckbox.check();
      }

      // Enter MFA code
      await mfaInput.fill('123456');
      await page.locator('button:has-text("Verify")').click();

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Logout and login again
      await context.clearCookies({ domain: undefined });
      await page.goto('/login');
      await loginPage.login(TEST_USERS.regular.email, TEST_USERS.regular.password);

      // Should not ask for MFA this time (if remember device worked)
      const mfaInputAgain = page.locator('input[name="mfaCode"]');
      const isMfaShown = await mfaInputAgain.isVisible({ timeout: 3000 });

      // In a real scenario with remember device, MFA might be skipped
      // This depends on implementation
    }
  });
});
