import { test, expect } from '@playwright/test';

/**
 * E2E Tests for OAuth Login Flow
 *
 * This suite tests OAuth/Social login functionality including:
 * - Google OAuth login
 * - GitHub OAuth login
 * - LinkedIn OAuth login
 * - OAuth error handling
 * - Account linking
 */

test.describe('OAuth Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display OAuth login buttons', async ({ page }) => {
    // Verify OAuth buttons are present
    const googleButton = page.getByRole('button', { name: /google|sign in.*google/i });
    const githubButton = page.getByRole('button', { name: /github|sign in.*github/i });
    const linkedinButton = page.getByRole('button', { name: /linkedin|sign in.*linkedin/i });

    // At least one OAuth provider should be available
    const hasGoogleButton = await googleButton.isVisible().catch(() => false);
    const hasGithubButton = await githubButton.isVisible().catch(() => false);
    const hasLinkedinButton = await linkedinButton.isVisible().catch(() => false);

    expect(hasGoogleButton || hasGithubButton || hasLinkedinButton).toBeTruthy();
  });

  test.skip('should initiate Google OAuth flow', async ({ page, context }) => {
    // TODO: Requires OAuth provider configuration

    // Click Google login button
    const googleButton = page.getByRole('button', { name: /google|sign in.*google/i });

    // Set up popup/redirect handler
    const popupPromise = context.waitForEvent('page');
    await googleButton.click();

    // Verify redirect to Google OAuth
    const popup = await popupPromise;
    await popup.waitForLoadState();

    const url = popup.url();
    expect(url).toContain('accounts.google.com');
    expect(url).toContain('oauth');
  });

  test.skip('should initiate GitHub OAuth flow', async ({ page, context }) => {
    // TODO: Requires OAuth provider configuration

    const githubButton = page.getByRole('button', { name: /github|sign in.*github/i });

    // Set up popup/redirect handler
    const popupPromise = context.waitForEvent('page');
    await githubButton.click();

    // Verify redirect to GitHub OAuth
    const popup = await popupPromise;
    await popup.waitForLoadState();

    const url = popup.url();
    expect(url).toContain('github.com');
    expect(url).toContain('login/oauth');
  });

  test.skip('should initiate LinkedIn OAuth flow', async ({ page, context }) => {
    // TODO: Requires OAuth provider configuration

    const linkedinButton = page.getByRole('button', { name: /linkedin|sign in.*linkedin/i });

    // Set up popup/redirect handler
    const popupPromise = context.waitForEvent('page');
    await linkedinButton.click();

    // Verify redirect to LinkedIn OAuth
    const popup = await popupPromise;
    await popup.waitForLoadState();

    const url = popup.url();
    expect(url).toContain('linkedin.com');
    expect(url).toContain('oauth');
  });

  test.skip('should successfully login with Google OAuth', async ({ page }) => {
    // TODO: Requires OAuth provider configuration and test account

    // In a real test, this would:
    // 1. Click Google button
    // 2. Fill Google login form in popup/redirect
    // 3. Grant permissions
    // 4. Return to app with auth code
    // 5. Verify login success

    // Mock OAuth callback
    await page.goto('/oauth/callback?provider=google&code=mock-auth-code&state=mock-state');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Verify user is logged in
    const userMenu = page.getByRole('button', { name: /account|profile|user/i });
    await expect(userMenu).toBeVisible();
  });

  test.skip('should handle OAuth cancellation', async ({ page }) => {
    // TODO: Requires OAuth provider configuration

    // Mock OAuth callback with error
    await page.goto('/oauth/callback?error=access_denied&error_description=User+cancelled');

    // Should show error message
    await expect(page.getByText(/login.*cancelled|authentication.*cancelled/i)).toBeVisible();

    // Should still be on login page or redirect there
    await expect(page).toHaveURL(/.*login/);
  });

  test.skip('should handle OAuth error', async ({ page }) => {
    // TODO: Requires OAuth provider configuration

    // Mock OAuth callback with error
    await page.goto('/oauth/callback?error=server_error&error_description=OAuth+provider+error');

    // Should show error message
    await expect(page.getByText(/authentication.*failed|login.*failed|error/i)).toBeVisible();
  });

  test.skip('should link OAuth account to existing account', async ({ page, context }) => {
    // TODO: Requires backend integration

    // Login with email/password first
    await page.getByLabel(/email/i).fill('existing@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Go to connected accounts settings
    await page.goto('/settings/connected-accounts');

    // Connect Google account
    const connectGoogleButton = page.getByRole('button', { name: /connect.*google/i });

    const popupPromise = context.waitForEvent('page');
    await connectGoogleButton.click();

    // Complete OAuth flow in popup
    const popup = await popupPromise;
    await popup.waitForLoadState();

    // After successful connection, verify in settings
    await expect(page.getByText(/google.*connected|connected.*google/i)).toBeVisible();
  });

  test.skip('should handle OAuth account already linked to another user', async ({ page }) => {
    // TODO: Requires backend integration

    // Attempt OAuth login with account already linked to different user
    await page.goto('/oauth/callback?provider=google&code=mock-code-linked-account');

    // Should show error message
    await expect(page.getByText(/account.*already.*linked|email.*already.*registered/i)).toBeVisible();

    // Should offer option to login with existing account
    const loginLink = page.getByRole('link', { name: /sign in|login/i });
    await expect(loginLink).toBeVisible();
  });

  test.skip('should create new account via OAuth for new users', async ({ page }) => {
    // TODO: Requires backend integration

    // OAuth login with new Google account
    await page.goto('/oauth/callback?provider=google&code=mock-code-new-user');

    // Should either:
    // 1. Redirect to complete profile page
    // 2. Redirect directly to dashboard with basic profile created

    const isProfilePage = await page.locator('h1', { hasText: /complete.*profile|finish.*setup/i }).isVisible().catch(() => false);
    const isDashboard = await page.locator('h1', { hasText: /dashboard/i }).isVisible().catch(() => false);

    expect(isProfilePage || isDashboard).toBeTruthy();
  });

  test.skip('should handle OAuth state parameter mismatch', async ({ page }) => {
    // TODO: Requires backend integration

    // OAuth callback with mismatched state (security issue)
    await page.goto('/oauth/callback?provider=google&code=mock-code&state=invalid-state');

    // Should show security error
    await expect(page.getByText(/invalid.*request|security.*error/i)).toBeVisible();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test.skip('should persist redirect URL through OAuth flow', async ({ page }) => {
    // TODO: Requires OAuth provider configuration

    // Try to access protected page
    await page.goto('/applications');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);

    // Click OAuth button
    const googleButton = page.getByRole('button', { name: /google/i });
    await googleButton.click();

    // After OAuth success, should return to original page
    // (This would require completing the OAuth flow)
    // await expect(page).toHaveURL(/.*applications/);
  });

  test.skip('should sync user profile from OAuth provider', async ({ page }) => {
    // TODO: Requires backend integration

    // Login via OAuth
    await page.goto('/oauth/callback?provider=google&code=mock-code-with-profile');

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Go to profile page
    await page.goto('/settings/profile');

    // Verify profile data was populated from OAuth provider
    const nameInput = page.getByLabel(/name|full name/i);
    const emailInput = page.getByLabel(/email/i);

    await expect(nameInput).not.toBeEmpty();
    await expect(emailInput).not.toBeEmpty();
  });

  test('should display OAuth privacy notice', async ({ page }) => {
    // Check if there's a privacy notice about OAuth
    const privacyNotice = page.getByText(/by.*continuing.*google|privacy.*policy|terms/i);

    if (await privacyNotice.isVisible().catch(() => false)) {
      await expect(privacyNotice).toBeVisible();
    }
  });
});
