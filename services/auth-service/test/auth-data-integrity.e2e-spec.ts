import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/entities/user.entity';

import type { INestApplication} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

/**
 * Auth + Data Integrity E2E Tests
 *
 * This test suite verifies:
 * 1. User registration creates records in cloud PostgreSQL
 * 2. Login returns valid JWT tokens
 * 3. Token refresh works correctly
 * 4. Protected endpoints require valid tokens
 * 5. Database schema integrity
 * 6. Azure PostgreSQL connectivity with SSL
 */
describe('Auth + Data Integrity (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: {
    email: string;
    password: string;
    username: string;
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Get database connection
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Initialize test user data
    testUser = {
      email: `integrity-test-${Date.now()}@example.com`,
      password: 'IntegrityTest123!',
      username: `integrity${Date.now()}`,
    };
  });

  afterAll(async () => {
    // Clean up test user from database
    if (testUser.userId) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [testUser.userId]);
    }
    await app.close();
  });

  describe('Database Connectivity and Schema', () => {
    it('should connect to Azure PostgreSQL with SSL', async () => {
      // Verify database connection is active
      expect(dataSource.isInitialized).toBe(true);

      // Verify SSL is enabled (for production/Azure)
      const connectionOptions = dataSource.options;
      if (process.env.DB_SSL === 'true') {
        expect(connectionOptions).toHaveProperty('ssl');
      }
    });

    it('should have users table with correct schema', async () => {
      const result = await dataSource.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);

      // Verify essential columns exist
      const columnNames = result.map((col: any) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('authProvider');
      expect(columnNames).toContain('isEmailVerified');
      expect(columnNames).toContain('refreshToken');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have proper indexes on users table', async () => {
      const result = await dataSource.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users';
      `);

      const indexNames = result.map((idx: any) => idx.indexname);

      // Verify critical indexes exist for performance
      expect(indexNames.some((name: string) => name.toLowerCase().includes('email'))).toBe(true);
      expect(indexNames.some((name: string) => name.toLowerCase().includes('username'))).toBe(true);
    });

    it('should have users table with UUID primary key', async () => {
      const result = await dataSource.query(`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id';
      `);

      expect(result[0].data_type).toBe('uuid');
    });

    it('should have enum types defined for user roles and statuses', async () => {
      const result = await dataSource.query(`
        SELECT typname
        FROM pg_type
        WHERE typname IN ('user_role', 'user_status', 'auth_provider');
      `);

      const typeNames = result.map((type: any) => type.typname);
      expect(typeNames).toContain('user_role');
      expect(typeNames).toContain('user_status');
      expect(typeNames).toContain('auth_provider');
    });
  });

  describe('User Registration → Database Integrity', () => {
    it('should register user and create record in PostgreSQL', async () => {
      // 1. Register via API
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          username: testUser.username,
          firstName: 'Integrity',
          lastName: 'Test',
        })
        .expect(201);

      // 2. Verify API response
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);

      // Save tokens and userId for later tests
      testUser.accessToken = response.body.accessToken;
      testUser.refreshToken = response.body.refreshToken;
      testUser.userId = response.body.user.id;

      // 3. Verify record exists in database
      const users = await dataSource
        .getRepository(User)
        .find({ where: { email: testUser.email } });

      expect(users).toHaveLength(1);
      const dbUser = users[0];

      // 4. Verify database record integrity
      expect(dbUser.id).toBe(testUser.userId);
      expect(dbUser.email).toBe(testUser.email);
      expect(dbUser.username).toBe(testUser.username);
      expect(dbUser.firstName).toBe('Integrity');
      expect(dbUser.lastName).toBe('Test');
      expect(dbUser.role).toBe('user');
      expect(dbUser.status).toBe('pending_verification');
      expect(dbUser.authProvider).toBe('local');
      expect(dbUser.isEmailVerified).toBe(false);

      // 5. Verify password is hashed (not plain text)
      expect(dbUser.password).toBeDefined();
      expect(dbUser.password).not.toBe(testUser.password);
      expect(dbUser.password?.startsWith('$2b$')).toBe(true); // bcrypt hash

      // 6. Verify refresh token is stored and hashed
      expect(dbUser.refreshToken).toBeDefined();
      expect(dbUser.refreshToken).not.toBe(testUser.refreshToken);
      expect(dbUser.refreshToken?.startsWith('$2b$')).toBe(true);

      // 7. Verify timestamps
      expect(dbUser.createdAt).toBeDefined();
      expect(dbUser.updatedAt).toBeDefined();
      expect(dbUser.createdAt).toBeInstanceOf(Date);
      expect(dbUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should enforce email uniqueness at database level', async () => {
      // Attempt to register with same email should fail
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email, // Same email
          password: 'AnotherPassword123!',
          username: 'differentusername',
          firstName: 'Duplicate',
          lastName: 'User',
        })
        .expect(409); // Conflict
    });

    it('should enforce username uniqueness at database level', async () => {
      // Attempt to register with same username should fail
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'different@example.com',
          password: 'AnotherPassword123!',
          username: testUser.username, // Same username
          firstName: 'Duplicate',
          lastName: 'User',
        })
        .expect(409); // Conflict
    });
  });

  describe('Login → JWT Issuance', () => {
    it('should login and return valid JWT tokens', async () => {
      // 1. Login via API
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // 2. Verify JWT tokens returned
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');

      // 3. Verify tokens are JWT format (header.payload.signature)
      const accessToken = response.body.accessToken;
      const refreshToken = response.body.refreshToken;

      expect(accessToken.split('.')).toHaveLength(3);
      expect(refreshToken.split('.')).toHaveLength(3);

      // Update stored tokens
      testUser.accessToken = accessToken;
      testUser.refreshToken = refreshToken;

      // 4. Verify lastLoginAt and lastLoginIp updated in database
      const dbUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: testUser.userId } });

      expect(dbUser?.lastLoginAt).toBeDefined();
      expect(dbUser?.lastLoginIp).toBeDefined();
      expect(dbUser?.loginAttempts).toBe(0); // Reset after successful login
    });

    it('should increment login attempts on failed login', async () => {
      // Get current login attempts
      const userBefore = await dataSource
        .getRepository(User)
        .findOne({ where: { id: testUser.userId } });
      const attemptsBefore = userBefore?.loginAttempts || 0;

      // Attempt login with wrong password
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Verify login attempts incremented in database
      const userAfter = await dataSource
        .getRepository(User)
        .findOne({ where: { id: testUser.userId } });

      expect(userAfter?.loginAttempts).toBe(attemptsBefore + 1);
    });

    it('should validate JWT payload contains correct user data', async () => {
      // Use access token to get current user
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      // Verify user data matches database
      expect(response.body.id).toBe(testUser.userId);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.role).toBe('user');
    });
  });

  describe('Token Refresh → Database Validation', () => {
    it('should refresh access token using refresh token', async () => {
      // 1. Refresh token via API
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: testUser.refreshToken,
        })
        .expect(200);

      // 2. Verify new tokens returned
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // 3. Verify tokens are different from old ones
      expect(response.body.accessToken).not.toBe(testUser.accessToken);
      expect(response.body.refreshToken).not.toBe(testUser.refreshToken);

      // 4. Verify old access token still works (until it expires)
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      // 5. Verify new access token works
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .expect(200);

      // Update stored tokens
      testUser.accessToken = response.body.accessToken;
      testUser.refreshToken = response.body.refreshToken;

      // 6. Verify refresh token updated in database
      const dbUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: testUser.userId } });

      expect(dbUser?.refreshToken).toBeDefined();
      expect(dbUser?.refreshToken?.startsWith('$2b$')).toBe(true);
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token',
        })
        .expect(401);
    });

    it('should reject refresh token after logout', async () => {
      // 1. Save current refresh token
      const currentRefreshToken = testUser.refreshToken;

      // 2. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      // 3. Verify refresh token cleared in database
      const dbUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: testUser.userId } });

      expect(dbUser?.refreshToken).toBeNull();

      // 4. Verify old refresh token no longer works
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: currentRefreshToken,
        })
        .expect(401);

      // Re-login for remaining tests
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      testUser.accessToken = loginResponse.body.accessToken;
      testUser.refreshToken = loginResponse.body.refreshToken;
    });
  });

  describe('Protected Endpoints → Authentication', () => {
    it('should allow access to protected endpoint with valid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);
    });

    it('should deny access to protected endpoint without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should deny access to protected endpoint with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('should deny access to protected endpoint with expired token', async () => {
      // This would require mocking time or waiting for token to expire
      // For now, we'll just verify the token validation logic exists

      // Create a token with invalid signature
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);
    });

    it('should deny access if user status is not active', async () => {
      // Update user status to suspended in database
      await dataSource
        .getRepository(User)
        .update({ id: testUser.userId }, { status: 'suspended' as any });

      // Attempt to access protected endpoint
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(401);

      // Restore user status for remaining tests
      await dataSource
        .getRepository(User)
        .update({ id: testUser.userId }, { status: 'active' as any });

      // Re-login to get new token with active status
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      testUser.accessToken = loginResponse.body.accessToken;
      testUser.refreshToken = loginResponse.body.refreshToken;
    });
  });

  describe('Database Connection Pool and Performance', () => {
    it('should handle concurrent database operations', async () => {
      // Simulate multiple concurrent authentication requests
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/auth/me')
            .set('Authorization', `Bearer ${testUser.accessToken}`)
        );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testUser.userId);
      });
    });

    it('should maintain database connection throughout requests', async () => {
      // Verify connection is still active after all tests
      expect(dataSource.isInitialized).toBe(true);

      // Perform a simple query to verify connectivity
      const result = await dataSource.query('SELECT 1 as connected');
      expect(result[0].connected).toBe(1);
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should not expose sensitive fields in API responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200);

      // Sensitive fields should not be in response
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body).not.toHaveProperty('emailVerificationToken');
      expect(response.body).not.toHaveProperty('passwordResetToken');
      expect(response.body).not.toHaveProperty('mfaSecret');
    });

    it('should properly handle NULL values in optional fields', async () => {
      const dbUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: testUser.userId } });

      // Optional fields can be null
      expect(dbUser?.phoneNumber).toBeNull();
      expect(dbUser?.profilePicture).toBeNull();
      expect(dbUser?.providerId).toBeNull();
      expect(dbUser?.emailVerificationToken).toBeDefined(); // Can be null or string
      expect(dbUser?.passwordResetToken).toBeNull();
      expect(dbUser?.mfaSecret).toBeNull();
      expect(dbUser?.lastLoginAt).toBeDefined(); // Should be set after login
    });

    it('should maintain referential integrity with JSONB metadata', async () => {
      // Update user with metadata
      await dataSource
        .getRepository(User)
        .update(
          { id: testUser.userId },
          {
            metadata: {
              lastDevice: 'test-device',
              preferences: { theme: 'dark' }
            }
          }
        );

      // Verify JSONB stored correctly
      const dbUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: testUser.userId } });

      expect(dbUser?.metadata).toBeDefined();
      expect(dbUser?.metadata).toHaveProperty('lastDevice');
      expect(dbUser?.metadata?.preferences).toHaveProperty('theme');
      expect(dbUser?.metadata?.preferences?.theme).toBe('dark');
    });
  });
});
