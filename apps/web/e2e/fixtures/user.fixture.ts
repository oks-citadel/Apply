import { test as base, Page } from '@playwright/test';
import { loginViaContext, TestUser } from '../utils/auth';
import { TEST_USERS, generateUniqueEmail } from '../utils/test-data';

/**
 * Custom fixtures for user authentication and setup
 * These fixtures can be used across test suites to provide authenticated pages
 */

type UserFixtures = {
  authenticatedPage: Page;
  authenticatedContext: Page;
  premiumUserPage: Page;
  mfaUserPage: Page;
  newUser: TestUser & { firstName: string; lastName: string };
};

/**
 * Extend Playwright's base test with custom fixtures
 */
export const test = base.extend<UserFixtures>({
  /**
   * Provides a page with a standard authenticated user
   */
  authenticatedPage: async ({ page, context }, use) => {
    await loginViaContext(context);
    await use(page);
  },

  /**
   * Alternative authenticated context fixture
   */
  authenticatedContext: async ({ page, context }, use) => {
    await loginViaContext(context);
    await use(page);
  },

  /**
   * Provides a page with a premium user
   */
  premiumUserPage: async ({ page, context }, use) => {
    await loginViaContext(context, 'premium-user-token');
    await use(page);
  },

  /**
   * Provides a page with an MFA-enabled user
   */
  mfaUserPage: async ({ page, context }, use) => {
    await loginViaContext(context, 'mfa-user-token');
    await use(page);
  },

  /**
   * Generates a new unique user for each test
   */
  newUser: async ({}, use) => {
    const user = {
      email: generateUniqueEmail('newuser'),
      password: 'NewUser123!@#',
      firstName: 'New',
      lastName: 'User',
    };
    await use(user);
    // Cleanup could happen here if needed
  },
});

export { expect } from '@playwright/test';
