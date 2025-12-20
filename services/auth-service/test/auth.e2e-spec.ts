import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { TestFactory } from './utils/test-factory';

import type { INestApplication} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = TestFactory.createRegisterDto({
        email: 'e2e-test@example.com',
        username: 'e2etest',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(registerDto.email);

          // Save tokens for later tests
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
          userId = res.body.user.id;
        });
    });

    it('should fail with duplicate email', () => {
      const registerDto = TestFactory.createRegisterDto({
        email: 'e2e-test@example.com', // Same email as above
        username: 'anotheruser',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409); // Conflict
    });

    it('should fail with invalid email', () => {
      const registerDto = TestFactory.createRegisterDto({
        email: 'invalid-email',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should fail with weak password', () => {
      const registerDto = TestFactory.createRegisterDto({
        email: 'newuser@example.com',
        password: '123', // Too weak
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should fail with missing required fields', () => request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'incomplete@example.com',
          // Missing password and other required fields
        })
        .expect(400));
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      const loginDto = {
        email: 'e2e-test@example.com',
        password: 'Password123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(loginDto.email);

          // Update tokens
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should fail with wrong password', () => {
      const loginDto = {
        email: 'e2e-test@example.com',
        password: 'WrongPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should fail with non-existent email', () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should fail with invalid email format', () => {
      const loginDto = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should get current user profile with valid token', () => request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('password');
          expect(res.body.email).toBe('e2e-test@example.com');
        }));

    it('should fail without token', () => request(app.getHttpServer())
        .get('/auth/me')
        .expect(401));

    it('should fail with invalid token', () => request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401));
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh access token with valid refresh token', () => request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');

          // Update tokens
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        }));

    it('should fail with invalid refresh token', () => request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401));

    it('should fail without refresh token', () => request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400));
  });

  describe('/auth/forgot-password (POST)', () => {
    it('should send password reset email', () => request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'e2e-test@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('password reset link');
        }));

    it('should not reveal non-existent email', () => request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('password reset link');
        }));

    it('should fail with invalid email format', () => request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400));

    it('should be rate limited', async () => {
      const requests = [];

      // Make 4 requests (limit is 3 per minute)
      for (let i = 0; i < 4; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/auth/forgot-password')
            .send({ email: 'test@example.com' })
        );
      }

      const responses = await Promise.all(requests);
      const throttled = responses.some(res => res.status === 429);

      expect(throttled).toBe(true);
    });
  });

  describe('/auth/mfa/setup (POST)', () => {
    it('should setup MFA for authenticated user', () => request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('secret');
          expect(res.body).toHaveProperty('qrCode');
          expect(res.body).toHaveProperty('otpauthUrl');
        }));

    it('should fail without authentication', () => request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .expect(401));
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', () => request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Logged out successfully');
        }));

    it('should fail without token', () => request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401));
  });

  describe('Rate Limiting', () => {
    it('should rate limit registration attempts', async () => {
      const requests = [];

      // Make 6 registration requests (limit is 5 per minute)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/auth/register')
            .send(TestFactory.createRegisterDto({
              email: `ratelimit${i}@example.com`,
              username: `ratelimit${i}`,
            }))
        );
      }

      const responses = await Promise.all(requests);
      const throttled = responses.some(res => res.status === 429);

      expect(throttled).toBe(true);
    });

    it('should rate limit login attempts', async () => {
      const requests = [];

      // Make 11 login requests (limit is 10 per minute)
      for (let i = 0; i < 11; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'test@example.com',
              password: 'Password123!',
            })
        );
      }

      const responses = await Promise.all(requests);
      const throttled = responses.some(res => res.status === 429);

      expect(throttled).toBe(true);
    });
  });

  describe('Full Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      const email = `flow-test-${Date.now()}@example.com`;
      const password = 'FlowTest123!';

      // 1. Register
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          firstName: 'Flow',
          lastName: 'Test',
          username: `flowtest${Date.now()}`,
        })
        .expect(201);

      expect(registerRes.body).toHaveProperty('accessToken');
      const regAccessToken = registerRes.body.accessToken;

      // 2. Get profile
      const profileRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${regAccessToken}`)
        .expect(200);

      expect(profileRes.body.email).toBe(email);

      // 3. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${regAccessToken}`)
        .expect(200);

      // 4. Login again
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      expect(loginRes.body).toHaveProperty('accessToken');

      // 5. Verify new token works
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);
    });
  });
});
