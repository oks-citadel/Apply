/**
 * Example E2E test demonstrating database and API utilities
 * This test shows how to use the helper functions for E2E testing
 */

import { test, expect } from '@playwright/test';
import {
  clearTable,
  clearTables,
  insertTestRecord,
  findRecords,
  findOneRecord,
  getTableRowCount,
  recordExists,
} from '../utils/database';
import {
  authApi,
  userApi,
  createTestUser,
  assertApiSuccess,
  assertApiStatus,
  assertApiData,
} from '../utils/api';
import type { AuthenticatedTestUser } from '../types';

/**
 * Example test suite demonstrating E2E test patterns
 */
test.describe('Example E2E Test Suite', () => {
  let testUser: AuthenticatedTestUser;

  /**
   * Setup: Runs before all tests in this describe block
   */
  test.beforeAll(async () => {
    // Wait for API to be ready (useful in CI environments)
    // await waitForApi();
  });

  /**
   * Setup: Runs before each test
   * Ensures a clean state for each test
   */
  test.beforeEach(async () => {
    // Clear relevant tables before each test for isolation
    await clearTables(['users', 'jobs', 'applications']);
  });

  /**
   * Cleanup: Runs after each test
   */
  test.afterEach(async () => {
    // Additional cleanup if needed
    // Note: Global teardown will clean database automatically
  });

  /**
   * Example 1: Testing with Database Utilities
   */
  test('should insert and query database records directly', async () => {
    // Insert a test record directly into database
    const user = await insertTestRecord('users', {
      email: 'dbtest@example.com',
      password: 'hashed_password_here',
      firstName: 'Database',
      lastName: 'Test',
      username: 'dbtest',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      authProvider: 'local',
    });

    // Verify user was created
    expect(user).toBeDefined();
    expect(user.email).toBe('dbtest@example.com');

    // Query the database
    const users = await findRecords('users', { email: 'dbtest@example.com' });
    expect(users).toHaveLength(1);

    // Check if record exists
    const exists = await recordExists('users', { email: 'dbtest@example.com' });
    expect(exists).toBe(true);

    // Get row count
    const count = await getTableRowCount('users');
    expect(count).toBe(1);

    // Find single record
    const foundUser = await findOneRecord('users', { email: 'dbtest@example.com' });
    expect(foundUser).toBeDefined();
    expect(foundUser?.firstName).toBe('Database');
  });

  /**
   * Example 2: Testing with API Utilities
   */
  test('should create user via API and verify in database', async () => {
    // Create user via API
    const response = await authApi.register({
      email: 'apitest@example.com',
      password: 'TestPassword123!',
      firstName: 'API',
      lastName: 'Test',
      username: 'apitest',
    });

    // Assert API response
    assertApiSuccess(response);
    assertApiStatus(response, 201);
    assertApiData(response);

    // Verify response data
    expect(response.data.accessToken).toBeDefined();
    expect(response.data.user.email).toBe('apitest@example.com');

    // Verify user exists in database
    const userInDb = await findOneRecord('users', { email: 'apitest@example.com' });
    expect(userInDb).toBeDefined();
    expect(userInDb?.firstName).toBe('API');
  });

  /**
   * Example 3: Testing with Test User Helper
   */
  test('should use test user helper for authenticated requests', async () => {
    // Create test user with authentication
    testUser = await createTestUser({
      email: 'helper@example.com',
      password: 'HelperPassword123!',
      firstName: 'Helper',
      lastName: 'User',
    });

    // User is already authenticated
    expect(testUser.accessToken).toBeDefined();
    expect(testUser.refreshToken).toBeDefined();
    expect(testUser.user.email).toBe('helper@example.com');

    // Make authenticated API call
    const profileResponse = await authApi.getProfile(testUser.accessToken);
    assertApiSuccess(profileResponse);
    expect(profileResponse.data.email).toBe('helper@example.com');

    // Verify in database
    const userInDb = await findOneRecord('users', { email: 'helper@example.com' });
    expect(userInDb).toBeDefined();
  });

  /**
   * Example 4: Testing Login Flow (E2E with Browser)
   */
  test('should login through UI and access dashboard', async ({ page }) => {
    // Create user via API first
    await authApi.register({
      email: 'uitest@example.com',
      password: 'UITestPassword123!',
      firstName: 'UI',
      lastName: 'Test',
      username: 'uitest',
    });

    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('[name="email"]', 'uitest@example.com');
    await page.fill('[name="password"]', 'UITestPassword123!');

    // Submit form
    await page.click('[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify user info is displayed
    await expect(page.locator('text=UI Test')).toBeVisible();
  });

  /**
   * Example 5: Testing with Multiple Users
   */
  test('should handle multiple users correctly', async () => {
    // Create multiple users
    const user1 = await createTestUser({
      email: 'user1@example.com',
      firstName: 'User',
      lastName: 'One',
    });

    const user2 = await createTestUser({
      email: 'user2@example.com',
      firstName: 'User',
      lastName: 'Two',
    });

    // Verify both users exist in database
    const users = await findRecords('users');
    expect(users.length).toBeGreaterThanOrEqual(2);

    // Each user can access their own profile
    const profile1 = await authApi.getProfile(user1.accessToken);
    const profile2 = await authApi.getProfile(user2.accessToken);

    assertApiSuccess(profile1);
    assertApiSuccess(profile2);

    expect(profile1.data.email).toBe('user1@example.com');
    expect(profile2.data.email).toBe('user2@example.com');
  });

  /**
   * Example 6: Testing Table Cleanup
   */
  test('should clear specific tables', async () => {
    // Insert test data
    await insertTestRecord('users', {
      email: 'cleanup@example.com',
      password: 'hashed_password',
      firstName: 'Cleanup',
      lastName: 'Test',
      username: 'cleanup',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      authProvider: 'local',
    });

    // Verify data exists
    let count = await getTableRowCount('users');
    expect(count).toBe(1);

    // Clear table
    await clearTable('users');

    // Verify table is empty
    count = await getTableRowCount('users');
    expect(count).toBe(0);
  });

  /**
   * Example 7: Testing Error Scenarios
   */
  test('should handle API errors gracefully', async () => {
    // Try to login with non-existent user
    const response = await authApi.login({
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!',
    });

    // Assert error response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    expect(response.error).toBeDefined();
  });

  /**
   * Example 8: Testing with Page Objects
   */
  test('should use page objects for maintainable tests', async ({ page }) => {
    // Create test user
    const user = await createTestUser();

    // Navigate to login page
    await page.goto('/login');

    // Login using page object pattern
    await page.fill('[name="email"]', user.email);
    await page.fill('[name="password"]', user.password);
    await page.click('[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard');

    // Verify dashboard elements
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  /**
   * Example 9: Testing Database Transactions
   */
  test('should maintain data consistency', async () => {
    // Create user
    const user = await insertTestRecord('users', {
      email: 'transaction@example.com',
      password: 'hashed_password',
      firstName: 'Transaction',
      lastName: 'Test',
      username: 'transaction',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      authProvider: 'local',
    });

    // Verify user was created
    const userInDb = await findOneRecord('users', { email: 'transaction@example.com' });
    expect(userInDb).toBeDefined();
    expect(userInDb?.id).toBe(user.id);
  });

  /**
   * Example 10: Testing with Custom Queries
   */
  test('should execute custom SQL queries', async () => {
    // Insert test users
    await insertTestRecord('users', {
      email: 'query1@example.com',
      password: 'hashed_password',
      firstName: 'Query',
      lastName: 'One',
      username: 'query1',
      role: 'user',
      status: 'active',
      isEmailVerified: true,
      authProvider: 'local',
    });

    await insertTestRecord('users', {
      email: 'query2@example.com',
      password: 'hashed_password',
      firstName: 'Query',
      lastName: 'Two',
      username: 'query2',
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      authProvider: 'local',
    });

    // Find all users with custom query
    const allUsers = await findRecords('users');
    expect(allUsers.length).toBeGreaterThanOrEqual(2);

    // Find users with specific role
    const adminUsers = await findRecords('users', { role: 'admin' });
    expect(adminUsers.length).toBeGreaterThanOrEqual(1);
    expect(adminUsers[0].role).toBe('admin');
  });
});

/**
 * Example: Testing without browser (API only)
 */
test.describe('API-Only Tests (No Browser)', () => {
  test('should test API endpoints without UI', async () => {
    // Create user
    const registerResponse = await authApi.register({
      email: 'apionly@example.com',
      password: 'ApiOnlyPassword123!',
      firstName: 'API',
      lastName: 'Only',
      username: 'apionly',
    });

    assertApiSuccess(registerResponse);

    // Login
    const loginResponse = await authApi.login({
      email: 'apionly@example.com',
      password: 'ApiOnlyPassword123!',
    });

    assertApiSuccess(loginResponse);
    expect(loginResponse.data.accessToken).toBeDefined();

    // Get profile
    const profileResponse = await authApi.getProfile(loginResponse.data.accessToken);
    assertApiSuccess(profileResponse);
    expect(profileResponse.data.email).toBe('apionly@example.com');

    // Logout
    const logoutResponse = await authApi.logout(loginResponse.data.accessToken);
    assertApiSuccess(logoutResponse);
  });
});

/**
 * Example: Performance testing
 */
test.describe('Performance Tests', () => {
  test('should measure API response times', async () => {
    const user = await createTestUser();

    // Measure login time
    const startTime = Date.now();
    const response = await authApi.login({
      email: user.email,
      password: user.password,
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    assertApiSuccess(response);

    // Assert response time is under 5 seconds
    expect(responseTime).toBeLessThan(5000);

    console.log(`Login API response time: ${responseTime}ms`);
  });
});
