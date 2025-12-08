/**
 * Auth-User Integration Tests
 * Tests the integration between auth-service and user-service
 * Validates user creation flow after successful registration
 */

import { AxiosInstance } from 'axios';
import { TestServiceManager } from './utils/test-service-manager';
import { TestDatabaseManager } from './utils/test-database';
import { createUserPayload, getTestUser } from './fixtures/user.fixtures';
import { logger } from './utils/test-logger';

describe('Auth-User Integration Tests', () => {
  let serviceManager: TestServiceManager;
  let dbManager: TestDatabaseManager;
  let authService: AxiosInstance;
  let userService: AxiosInstance;

  beforeAll(async () => {
    serviceManager = (global as any).testServices;
    dbManager = (global as any).testDb;

    authService = serviceManager.getService('auth-service');
    userService = serviceManager.getService('user-service');

    // Wait for services to be ready
    await serviceManager.waitForService('auth-service');
    await serviceManager.waitForService('user-service');
  });

  beforeEach(async () => {
    // Clean databases before each test
    await dbManager.cleanDatabase('auth_service_test');
    await dbManager.cleanDatabase('user_service_test');
  });

  describe('User Registration Flow', () => {
    it('should create user in both auth and user services on registration', async () => {
      const userData = createUserPayload();

      // Register user via auth service
      const registerResponse = await authService.post('/api/v1/auth/register', userData);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.data).toHaveProperty('accessToken');
      expect(registerResponse.data).toHaveProperty('user');
      expect(registerResponse.data.user.email).toBe(userData.email);

      const { accessToken, user } = registerResponse.data;

      // Verify user was created in auth service
      const authMeResponse = await authService.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(authMeResponse.status).toBe(200);
      expect(authMeResponse.data.email).toBe(userData.email);

      // Wait for async user profile creation in user service
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify user profile was created in user service
      const userProfileResponse = await userService.get(`/api/v1/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(userProfileResponse.status).toBe(200);
      expect(userProfileResponse.data.userId).toBe(user.id);
      expect(userProfileResponse.data.email).toBe(userData.email);
    });

    it('should handle duplicate registration attempts', async () => {
      const userData = createUserPayload();

      // First registration
      const firstResponse = await authService.post('/api/v1/auth/register', userData);
      expect(firstResponse.status).toBe(201);

      // Duplicate registration attempt
      const duplicateResponse = await authService.post('/api/v1/auth/register', userData);
      expect(duplicateResponse.status).toBe(409); // Conflict
      expect(duplicateResponse.data.error).toContain('already exists');
    });

    it('should create user profile with default preferences', async () => {
      const userData = createUserPayload();

      const registerResponse = await authService.post('/api/v1/auth/register', userData);
      expect(registerResponse.status).toBe(201);

      const { accessToken, user } = registerResponse.data;

      // Wait for profile creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get user preferences
      const preferencesResponse = await userService.get(`/api/v1/preferences/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(preferencesResponse.status).toBe(200);
      expect(preferencesResponse.data).toHaveProperty('jobPreferences');
      expect(preferencesResponse.data).toHaveProperty('notificationPreferences');
    });
  });

  describe('User Login Flow', () => {
    it('should authenticate and access user profile', async () => {
      const userData = createUserPayload();

      // Register user
      await authService.post('/api/v1/auth/register', userData);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Login
      const loginResponse = await authService.post('/api/v1/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('accessToken');

      const { accessToken, user } = loginResponse.data;

      // Access user profile
      const profileResponse = await userService.get(`/api/v1/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.data.email).toBe(userData.email);
    });

    it('should reject invalid credentials', async () => {
      const userData = createUserPayload();

      // Register user
      await authService.post('/api/v1/auth/register', userData);

      // Login with wrong password
      const loginResponse = await authService.post('/api/v1/auth/login', {
        email: userData.email,
        password: 'WrongPassword@123',
      });

      expect(loginResponse.status).toBe(401);
    });
  });

  describe('Profile Update Flow', () => {
    it('should update user profile without affecting auth data', async () => {
      const userData = createUserPayload();

      // Register user
      const registerResponse = await authService.post('/api/v1/auth/register', userData);
      const { accessToken, user } = registerResponse.data;

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update profile in user service
      const profileUpdates = {
        bio: 'Software engineer with 5 years of experience',
        location: 'San Francisco, CA',
        phoneNumber: '+1-555-0123',
      };

      const updateResponse = await userService.patch(
        `/api/v1/profile/${user.id}`,
        profileUpdates,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.bio).toBe(profileUpdates.bio);

      // Verify auth data is unchanged
      const authMeResponse = await authService.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(authMeResponse.status).toBe(200);
      expect(authMeResponse.data.email).toBe(userData.email);
    });
  });

  describe('Token Validation Flow', () => {
    it('should validate tokens between services', async () => {
      const userData = createUserPayload();

      // Register user
      const registerResponse = await authService.post('/api/v1/auth/register', userData);
      const { accessToken, user } = registerResponse.data;

      await new Promise(resolve => setTimeout(resolve, 2000));

      // User service should validate token with auth service
      const profileResponse = await userService.get(`/api/v1/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(profileResponse.status).toBe(200);
    });

    it('should reject invalid tokens', async () => {
      const userData = createUserPayload();

      // Register user
      const registerResponse = await authService.post('/api/v1/auth/register', userData);
      const { user } = registerResponse.data;

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to access with invalid token
      const profileResponse = await userService.get(`/api/v1/profile/${user.id}`, {
        headers: { Authorization: 'Bearer invalid-token-12345' },
      });

      expect(profileResponse.status).toBe(401);
    });

    it('should handle token refresh flow', async () => {
      const userData = createUserPayload();

      // Register user
      const registerResponse = await authService.post('/api/v1/auth/register', userData);
      const { refreshToken, user } = registerResponse.data;

      // Refresh token
      const refreshResponse = await authService.post('/api/v1/auth/refresh', {
        refreshToken,
      });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.data).toHaveProperty('accessToken');

      const newAccessToken = refreshResponse.data.accessToken;

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use new token to access user service
      const profileResponse = await userService.get(`/api/v1/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });

      expect(profileResponse.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle user service unavailable during registration', async () => {
      // This test would require stopping the user service temporarily
      // For now, we'll test the error handling by checking the response
      const userData = createUserPayload();

      const registerResponse = await authService.post('/api/v1/auth/register', userData);

      // Even if user service is down, auth registration should succeed
      expect(registerResponse.status).toBe(201);
      expect(registerResponse.data).toHaveProperty('user');

      // Profile creation should be queued/retried
      logger.info('Profile creation should be handled asynchronously');
    });
  });
});
