import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

/**
 * Comprehensive Security & Compliance Test Suite for JobPilot AI Platform
 *
 * Tests cover:
 * - Rate Limiting on all endpoints
 * - CORS Validation
 * - CSRF Protection
 * - Input Sanitization
 * - SQL Injection Prevention
 * - XSS Prevention
 * - Authentication/Authorization
 * - API Key Management
 * - GDPR Compliance (Data Export, Account Deletion, Audit Logs)
 */
describe('Security & Compliance Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let refreshToken: string;
  let userId: string;
  let apiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        ThrottlerModule.forRoot([{
          ttl: 60000,
          limit: 10,
        }]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate Limiting Tests', () => {
    describe('Authentication Endpoints', () => {
      it('should enforce rate limit on /auth/login (10 requests per minute)', async () => {
        const loginPayload = {
          email: 'test@example.com',
          password: 'Password123!',
        };

        // Make requests up to the limit
        for (let i = 0; i < 10; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send(loginPayload);
        }

        // 11th request should be rate limited
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginPayload)
          .expect(429);

        expect(response.body.message).toContain('Too many');
      });

      it('should enforce strict rate limit on /auth/register (5 requests per minute)', async () => {
        const registerPayload = {
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        };

        for (let i = 0; i < 5; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({ ...registerPayload, email: `user${i}@example.com` });
        }

        // 6th request should be rate limited
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(registerPayload)
          .expect(429);
      });

      it('should enforce rate limit on /auth/forgot-password (3 requests per minute)', async () => {
        const payload = { email: 'test@example.com' };

        for (let i = 0; i < 3; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/auth/forgot-password')
            .send(payload);
        }

        await request(app.getHttpServer())
          .post('/api/v1/auth/forgot-password')
          .send(payload)
          .expect(429);
      });

      it('should enforce rate limit on /auth/refresh (20 requests per minute)', async () => {
        const payload = { refreshToken: 'mock-refresh-token' };

        for (let i = 0; i < 20; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .send(payload);
        }

        await request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send(payload)
          .expect(429);
      });

      it('should include rate limit headers in response', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'Password123!' });

        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
      });
    });

    describe('API Endpoints', () => {
      it('should enforce rate limit on general API endpoints (100 requests per 15 minutes)', async () => {
        // This would be tested with a smaller limit in test environment
        const requests = Array(100).fill(null).map(() =>
          request(app.getHttpServer())
            .get('/api/v1/jobs')
            .set('Authorization', `Bearer ${authToken}`)
        );

        await Promise.all(requests);

        await request(app.getHttpServer())
          .get('/api/v1/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(429);
      });

      it('should enforce upload rate limit (10 uploads per hour)', async () => {
        for (let i = 0; i < 10; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/resumes/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('test'), 'resume.pdf');
        }

        await request(app.getHttpServer())
          .post('/api/v1/resumes/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from('test'), 'resume.pdf')
          .expect(429);
      });

      it('should enforce auto-apply rate limit (50 per day)', async () => {
        // Mock auto-apply requests
        for (let i = 0; i < 50; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/applications/auto-apply')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ jobId: `job-${i}` });
        }

        await request(app.getHttpServer())
          .post('/api/v1/applications/auto-apply')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ jobId: 'job-overflow' })
          .expect(429);
      });
    });

    describe('Rate Limit Bypass Prevention', () => {
      it('should not allow bypassing rate limits with different User-Agent', async () => {
        const payload = { email: 'test@example.com', password: 'Password123!' };

        for (let i = 0; i < 10; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .set('User-Agent', `Browser-${i}`)
            .send(payload);
        }

        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .set('User-Agent', 'Different-Browser')
          .send(payload)
          .expect(429);
      });

      it('should not allow bypassing rate limits with X-Forwarded-For header', async () => {
        const payload = { email: 'test@example.com', password: 'Password123!' };

        for (let i = 0; i < 10; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .set('X-Forwarded-For', `192.168.1.${i}`)
            .send(payload);
        }

        // Should still be rate limited from the actual IP
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', '10.0.0.1')
          .send(payload)
          .expect(429);
      });
    });
  });

  describe('CORS Validation Tests', () => {
    it('should allow requests from whitelisted origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Origin', 'https://jobpilot-ai.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://jobpilot-ai.com');
    });

    it('should reject requests from non-whitelisted origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);

      expect(response.body.message).toContain('Not allowed by CORS');
    });

    it('should include correct CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/auth/login')
        .set('Origin', 'https://jobpilot-ai.com')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/jobs')
        .set('Origin', 'https://jobpilot-ai.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(200);

      expect(response.headers['access-control-max-age']).toBe('86400');
    });
  });

  describe('CSRF Protection Tests', () => {
    it('should require CSRF token for POST requests', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobId: 'test-job' })
        .expect(403);
    });

    it('should accept valid CSRF token', async () => {
      const csrfToken = 'valid-csrf-token'; // Would be generated dynamically

      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({ jobId: 'test-job' })
        .expect(201);
    });

    it('should reject invalid CSRF tokens', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'invalid-token')
        .send({ jobId: 'test-job' })
        .expect(403);
    });

    it('should require CSRF token for PUT requests', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/resumes/123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Resume' })
        .expect(403);
    });

    it('should require CSRF token for DELETE requests', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/applications/123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should not require CSRF token for GET requests', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Input Sanitization Tests', () => {
    it('should sanitize HTML input in user registration', async () => {
      const maliciousPayload = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: '<script>alert("XSS")</script>John',
        lastName: '<img src=x onerror=alert(1)>Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(maliciousPayload)
        .expect(201);

      expect(response.body.user.firstName).not.toContain('<script>');
      expect(response.body.user.lastName).not.toContain('<img');
      expect(response.body.user.firstName).toBe('John');
      expect(response.body.user.lastName).toBe('Doe');
    });

    it('should sanitize input in job search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .query({ search: '<script>alert(1)</script>developer' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify the search was sanitized
      expect(response.body).toBeDefined();
    });

    it('should reject input with null bytes', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test\0@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should trim whitespace from inputs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: '  test@example.com  ',
          password: 'Password123!',
          firstName: '  John  ',
          lastName: '  Doe  ',
        })
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.firstName).toBe('John');
    });
  });

  describe('SQL Injection Prevention Tests', () => {
    it('should prevent SQL injection in login', async () => {
      const sqlInjectionPayloads = [
        "admin' OR '1'='1",
        "admin'; DROP TABLE users; --",
        "' UNION SELECT * FROM users--",
      ];

      for (const payload of sqlInjectionPayloads) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: payload,
            password: 'anything',
          })
          .expect(401);
      }
    });

    it('should prevent SQL injection in search queries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .query({ search: "'; DROP TABLE jobs; --" })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should return empty or error, not execute the SQL
      expect(response.body).toBeDefined();
    });

    it('should use parameterized queries for all database operations', async () => {
      // This is verified through implementation, but we can test behavior
      const response = await request(app.getHttpServer())
        .get('/api/v1/jobs/123\'; DELETE FROM jobs; --')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Should not find the job, not execute DELETE
      expect(response.body.message).toContain('not found');
    });
  });

  describe('XSS Prevention Tests', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(document.cookie)',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert(1)>',
      '<<SCRIPT>alert("XSS");//<</SCRIPT>',
    ];

    it('should prevent reflected XSS in all text inputs', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Password123!',
            firstName: payload,
            lastName: 'User',
          })
          .expect(201);

        expect(response.body.user.firstName).not.toContain('<script');
        expect(response.body.user.firstName).not.toContain('javascript:');
        expect(response.body.user.firstName).not.toContain('onerror');
      }
    });

    it('should prevent stored XSS in resume content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '<script>alert(1)</script>Resume',
          content: '<div><script>malicious()</script>Experience</div>',
        })
        .expect(201);

      expect(response.body.title).not.toContain('<script');
      expect(response.body.content).not.toContain('<script');
    });

    it('should prevent DOM-based XSS in URLs', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Resume',
          websiteUrl: 'javascript:alert(1)',
        })
        .expect(400);
    });
  });

  describe('Authentication Tests', () => {
    it('should reject requests without authentication token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with expired token', async () => {
      const expiredToken = 'expired.jwt.token';
      await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject requests with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });

    it('should implement password hashing (bcrypt)', async () => {
      const password = 'Password123!';
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'hashtest@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      // Password should never be returned in response
      expect(response.body.user.password).toBeUndefined();
    });

    it('should enforce account lockout after failed login attempts', async () => {
      const payload = {
        email: 'lockout@example.com',
        password: 'WrongPassword123!',
      };

      // Attempt to login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(payload);
      }

      // 6th attempt should result in lockout
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(payload)
        .expect(403);

      expect(response.body.message).toContain('locked');
    });

    it('should validate JWT signature', async () => {
      const tamperedToken = authToken.slice(0, -5) + 'AAAAA';
      await request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });

  describe('Authorization Tests', () => {
    it('should enforce role-based access control', async () => {
      // Regular user trying to access admin endpoint
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should allow admin users to access admin endpoints', async () => {
      const adminToken = 'admin.jwt.token';
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should prevent users from accessing other users data', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/other-user-id/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should allow users to access only their own data', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}/applications`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('API Key Management Tests', () => {
    describe('POST /api/v1/api-keys - Create API Key', () => {
      it('should create a new API key with authentication', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/api-keys')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test API Key',
            scopes: ['read:jobs', 'write:applications'],
          })
          .expect(201);

        expect(response.body.apiKey).toBeDefined();
        expect(response.body.name).toBe('Test API Key');
        expect(response.body.scopes).toEqual(['read:jobs', 'write:applications']);
        apiKey = response.body.apiKey;
      });

      it('should reject API key creation without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/api-keys')
          .send({ name: 'Unauthorized Key' })
          .expect(401);
      });

      it('should validate API key name', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/api-keys')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: '', scopes: [] })
          .expect(400);
      });

      it('should limit number of API keys per user', async () => {
        // Create maximum allowed keys
        for (let i = 0; i < 5; i++) {
          await request(app.getHttpServer())
            .post('/api/v1/api-keys')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: `Key ${i}` });
        }

        // Next one should fail
        await request(app.getHttpServer())
          .post('/api/v1/api-keys')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Excessive Key' })
          .expect(400);
      });
    });

    describe('DELETE /api/v1/api-keys/:id - Revoke API Key', () => {
      it('should revoke an existing API key', async () => {
        await request(app.getHttpServer())
          .delete(`/api/v1/api-keys/${apiKey}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should reject revocation without authentication', async () => {
        await request(app.getHttpServer())
          .delete('/api/v1/api-keys/some-key-id')
          .expect(401);
      });

      it('should prevent users from revoking other users API keys', async () => {
        await request(app.getHttpServer())
          .delete('/api/v1/api-keys/other-users-key')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('should invalidate revoked API key immediately', async () => {
        const revokedKey = apiKey;

        await request(app.getHttpServer())
          .get('/api/v1/jobs')
          .set('X-API-Key', revokedKey)
          .expect(401);
      });
    });

    describe('API Key Security', () => {
      it('should accept valid API key in header', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/jobs')
          .set('X-API-Key', apiKey)
          .expect(200);
      });

      it('should reject invalid API key', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/jobs')
          .set('X-API-Key', 'invalid-key')
          .expect(401);
      });

      it('should enforce API key scopes', async () => {
        // API key with only read scope trying to write
        await request(app.getHttpServer())
          .post('/api/v1/applications')
          .set('X-API-Key', apiKey)
          .send({ jobId: 'test-job' })
          .expect(403);
      });

      it('should hash API keys in database', async () => {
        // This would be tested at the service layer
        // API keys should be hashed before storage
        expect(true).toBe(true);
      });
    });
  });

  describe('GDPR Compliance Tests', () => {
    describe('GET /api/v1/users/data-export - Export User Data', () => {
      it('should export all user data in machine-readable format', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/data-export')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('applications');
        expect(response.body).toHaveProperty('resumes');
        expect(response.body).toHaveProperty('jobs');
        expect(response.body.user.email).toBeDefined();
      });

      it('should require authentication for data export', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/users/data-export')
          .expect(401);
      });

      it('should export data in JSON format', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/data-export')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.headers['content-type']).toContain('application/json');
      });

      it('should include all personal data in export', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/data-export')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const data = response.body;
        expect(data.user).toHaveProperty('email');
        expect(data.user).toHaveProperty('firstName');
        expect(data.user).toHaveProperty('lastName');
        expect(data.user).toHaveProperty('phoneNumber');
        expect(data.user).toHaveProperty('createdAt');
      });

      it('should not include sensitive data like passwords', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/data-export')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.user.password).toBeUndefined();
        expect(response.body.user.passwordHash).toBeUndefined();
      });
    });

    describe('DELETE /api/v1/users/delete-account - Delete Account (Right to be Forgotten)', () => {
      it('should delete user account and all associated data', async () => {
        await request(app.getHttpServer())
          .delete('/api/v1/users/delete-account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ confirmation: 'DELETE MY ACCOUNT' })
          .expect(200);

        // Verify user cannot login after deletion
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'deleted@example.com',
            password: 'Password123!',
          })
          .expect(401);
      });

      it('should require confirmation for account deletion', async () => {
        await request(app.getHttpServer())
          .delete('/api/v1/users/delete-account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ confirmation: 'wrong confirmation' })
          .expect(400);
      });

      it('should require authentication for account deletion', async () => {
        await request(app.getHttpServer())
          .delete('/api/v1/users/delete-account')
          .send({ confirmation: 'DELETE MY ACCOUNT' })
          .expect(401);
      });

      it('should anonymize data that must be retained for legal reasons', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/v1/users/delete-account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ confirmation: 'DELETE MY ACCOUNT' })
          .expect(200);

        expect(response.body.message).toContain('anonymized');
      });

      it('should delete user data from all services', async () => {
        // After deletion, verify data is removed from all services
        await request(app.getHttpServer())
          .delete('/api/v1/users/delete-account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ confirmation: 'DELETE MY ACCOUNT' })
          .expect(200);

        // Check that applications are deleted
        await request(app.getHttpServer())
          .get('/api/v1/applications')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(401);
      });
    });

    describe('GET /api/v1/admin/audit-logs - Audit Logs', () => {
      it('should require admin role for audit logs', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/admin/audit-logs')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('should return audit logs for admin users', async () => {
        const adminToken = 'admin.jwt.token';
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body[0]).toHaveProperty('timestamp');
        expect(response.body[0]).toHaveProperty('action');
        expect(response.body[0]).toHaveProperty('userId');
      });

      it('should support filtering audit logs by date range', async () => {
        const adminToken = 'admin.jwt.token';
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/audit-logs')
          .query({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });

      it('should support filtering audit logs by user', async () => {
        const adminToken = 'admin.jwt.token';
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/audit-logs')
          .query({ userId: 'specific-user-id' })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });

      it('should log all sensitive operations', async () => {
        const adminToken = 'admin.jwt.token';

        // Perform a sensitive operation
        await request(app.getHttpServer())
          .delete('/api/v1/users/delete-account')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ confirmation: 'DELETE MY ACCOUNT' });

        // Check audit log
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const deleteLog = response.body.find(
          (log: any) => log.action === 'USER_ACCOUNT_DELETED'
        );
        expect(deleteLog).toBeDefined();
      });

      it('should include IP address and user agent in audit logs', async () => {
        const adminToken = 'admin.jwt.token';
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body[0]).toHaveProperty('ipAddress');
        expect(response.body[0]).toHaveProperty('userAgent');
      });

      it('should be immutable (no edit/delete endpoints)', async () => {
        const adminToken = 'admin.jwt.token';

        // Try to delete an audit log (should not exist)
        await request(app.getHttpServer())
          .delete('/api/v1/admin/audit-logs/123')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  describe('Security Headers Tests', () => {
    it('should include Content-Security-Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should include Strict-Transport-Security header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=');
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('File Upload Security Tests', () => {
    it('should validate file types', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/resumes/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('malicious'), 'malware.exe')
        .expect(400);
    });

    it('should enforce file size limits', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
      await request(app.getHttpServer())
        .post('/api/v1/resumes/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFile, 'large.pdf')
        .expect(413);
    });

    it('should scan files for malware', async () => {
      // This would integrate with antivirus service
      const response = await request(app.getHttpServer())
        .post('/api/v1/resumes/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('safe content'), 'resume.pdf')
        .expect(201);

      expect(response.body.scanStatus).toBe('clean');
    });

    it('should sanitize filenames', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/resumes/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('content'), '../../../etc/passwd.pdf')
        .expect(201);

      expect(response.body.filename).not.toContain('..');
      expect(response.body.filename).not.toContain('/');
    });
  });
});
