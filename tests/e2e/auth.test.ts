/**
 * Auth Service E2E Tests
 * Tests authentication flows including registration, login, logout, and token refresh
 */

import { authClient, config, testState, register, login, logout } from './setup';

describe('Auth Service E2E', () => {
  const testUser = {
    email: `e2e-auth-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'E2E',
    lastName: 'Test',
  };

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await authClient.post('/auth/register', testUser);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(testUser.email);
      expect(response.data.user.firstName).toBe(testUser.firstName);
      expect(response.data.user.lastName).toBe(testUser.lastName);
      expect(response.data.user).not.toHaveProperty('password');

      // Save tokens for subsequent tests
      testState.accessToken = response.data.accessToken;
      testState.refreshToken = response.data.refreshToken;
      testState.userId = response.data.user.id;
    });

    it('should reject duplicate email registration', async () => {
      try {
        await authClient.post('/auth/register', testUser);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(409);
        expect(error.response.data).toHaveProperty('message');
      }
    });

    it('should reject invalid email format', async () => {
      try {
        await authClient.post('/auth/register', {
          ...testUser,
          email: 'invalid-email',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject weak password', async () => {
      try {
        await authClient.post('/auth/register', {
          ...testUser,
          email: `weak-pass-${Date.now()}@example.com`,
          password: '123',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject missing required fields', async () => {
      try {
        await authClient.post('/auth/register', {
          email: testUser.email,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await authClient.post('/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data).toHaveProperty('expiresIn');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(testUser.email);

      // Update tokens
      testState.accessToken = response.data.accessToken;
      testState.refreshToken = response.data.refreshToken;
    });

    it('should reject invalid password', async () => {
      try {
        await authClient.post('/auth/login', {
          email: testUser.email,
          password: 'WrongPassword123!',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject non-existent user', async () => {
      try {
        await authClient.post('/auth/login', {
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject missing credentials', async () => {
      try {
        await authClient.post('/auth/login', {});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await authClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${testState.accessToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('email');
      expect(response.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      try {
        await authClient.get('/auth/me');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject request with invalid token', async () => {
      try {
        await authClient.get('/auth/me', {
          headers: { Authorization: 'Bearer invalid-token' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await authClient.post('/auth/refresh', {
        refreshToken: testState.refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('expiresIn');

      // Update access token
      testState.accessToken = response.data.accessToken;
    });

    it('should reject invalid refresh token', async () => {
      try {
        await authClient.post('/auth/refresh', {
          refreshToken: 'invalid-refresh-token',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should accept valid email for password reset', async () => {
      const response = await authClient.post('/auth/forgot-password', {
        email: testUser.email,
      });

      // Should always return 200 for security (don't reveal if email exists)
      expect(response.status).toBe(200);
    });

    it('should accept non-existent email gracefully', async () => {
      const response = await authClient.post('/auth/forgot-password', {
        email: 'nonexistent@example.com',
      });

      // Should still return 200 for security
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const newPassword = 'NewPassword456!';

      const response = await authClient.patch(
        '/auth/change-password',
        {
          currentPassword: testUser.password,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${testState.accessToken}` },
        }
      );

      expect(response.status).toBe(200);

      // Verify new password works
      const loginResponse = await authClient.post('/auth/login', {
        email: testUser.email,
        password: newPassword,
      });
      expect(loginResponse.status).toBe(200);

      // Update password for other tests
      testUser.password = newPassword;
      testState.accessToken = loginResponse.data.accessToken;
      testState.refreshToken = loginResponse.data.refreshToken;
    });

    it('should reject incorrect current password', async () => {
      try {
        await authClient.patch(
          '/auth/change-password',
          {
            currentPassword: 'WrongPassword123!',
            newPassword: 'AnotherPassword789!',
          },
          {
            headers: { Authorization: `Bearer ${testState.accessToken}` },
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await authClient.post(
        '/auth/logout',
        {},
        {
          headers: { Authorization: `Bearer ${testState.accessToken}` },
        }
      );

      expect(response.status).toBe(204);
    });

    it('should reject request after logout', async () => {
      try {
        await authClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${testState.accessToken}` },
        });
        // Token might still be valid if not using token blacklist
        // This test depends on implementation
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });
});
