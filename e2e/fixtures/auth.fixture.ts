import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

/**
 * Test user credentials
 */
export const TEST_USERS = {
  regular: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  premium: {
    email: 'premium@example.com',
    password: 'TestPassword123!',
    firstName: 'Premium',
    lastName: 'User',
  },
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
  },
  invalidCredentials: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!',
  },
  lockedAccount: {
    email: 'locked@example.com',
    password: 'TestPassword123!',
  },
} as const;

/**
 * Extended test fixture with authenticated page
 */
type AuthFixtures = {
  authenticatedPage: Page;
  loginPage: LoginPage;
  testUser: typeof TEST_USERS.regular;
};

/**
 * Custom test fixture that provides an authenticated page
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Provides a page that is already authenticated
   */
  authenticatedPage: async ({ page }, use) => {
    // The page is already authenticated via storageState in playwright.config.ts
    await use(page);
  },

  /**
   * Provides a LoginPage instance
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Provides test user credentials
   */
  testUser: async ({}, use) => {
    await use(TEST_USERS.regular);
  },
});

/**
 * Helper function to login programmatically
 */
export async function loginAs(
  page: Page,
  user: { email: string; password: string }
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.email, user.password);
}

/**
 * Helper function to logout
 */
export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('**/login');
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export { expect } from '@playwright/test';
