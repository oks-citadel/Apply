import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication helper utilities for E2E tests
 * These helpers provide reusable authentication functions across test suites
 */

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Login a user via the UI
 * @param page - Playwright page object
 * @param credentials - User credentials
 */
export async function loginViaUI(page: Page, credentials: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(credentials.email);
  await page.getByLabel(/password/i).fill(credentials.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation to complete
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

/**
 * Login a user by setting auth cookies (faster for tests that don't need to test login flow)
 * @param context - Playwright browser context
 * @param token - Auth token (default: 'mock-token')
 */
export async function loginViaContext(context: BrowserContext, token: string = 'mock-token'): Promise<void> {
  await context.addCookies([
    {
      name: 'auth-token',
      value: token,
      domain: 'localhost',
      path: '/',
    },
  ]);
}

/**
 * Register a new user via the UI
 * @param page - Playwright page object
 * @param userData - User registration data
 */
export async function registerViaUI(page: Page, userData: TestUser & { firstName: string; lastName: string }): Promise<void> {
  await page.goto('/register');
  await page.getByLabel(/first name/i).fill(userData.firstName);
  await page.getByLabel(/last name/i).fill(userData.lastName);
  await page.getByLabel(/email/i).fill(userData.email);
  await page.getByLabel(/password/i).fill(userData.password);
  await page.getByRole('button', { name: /create account|sign up/i }).click();

  // Wait for navigation or success message
  await page.waitForURL(/.*verify-email|.*dashboard/, { timeout: 10000 });
}

/**
 * Logout the current user
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button (usually in user menu)
  const userMenu = page.getByRole('button', { name: /account|profile|user/i });
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
  } else {
    // Fallback: navigate to logout endpoint
    await page.goto('/logout');
  }

  // Verify redirect to login or home
  await page.waitForURL(/.*login|.*\//, { timeout: 5000 });
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 * @returns boolean indicating if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(cookie => cookie.name === 'auth-token');
}

/**
 * Clear all authentication state
 * @param context - Playwright browser context
 */
export async function clearAuthState(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  await context.clearPermissions();
}

/**
 * Setup MFA for a user (for MFA testing)
 * @param page - Playwright page object
 */
export async function setupMFA(page: Page): Promise<string> {
  await page.goto('/settings/security');
  await page.getByRole('button', { name: /enable.*mfa|two.*factor/i }).click();

  // Extract MFA secret or backup codes
  const secret = await page.getByTestId('mfa-secret').textContent();
  return secret || '';
}

/**
 * Complete OAuth flow (mock for testing)
 * @param page - Playwright page object
 * @param provider - OAuth provider (google, github, linkedin)
 */
export async function completeOAuthFlow(page: Page, provider: 'google' | 'github' | 'linkedin'): Promise<void> {
  // In real tests, this would interact with OAuth provider
  // For now, we'll mock the callback
  await page.goto(`/oauth/callback?provider=${provider}&code=mock-code&state=mock-state`);
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}
