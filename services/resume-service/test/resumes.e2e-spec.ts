import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

import type { INestApplication} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('ResumesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let resumeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Login to get access token (assuming auth service is available)
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/resumes (POST)', () => {
    it('should create a new resume', () => request(app.getHttpServer())
        .post('/resumes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Software Engineer Resume',
          templateId: 'modern',
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
          summary: 'Experienced software engineer',
          skills: ['JavaScript', 'TypeScript', 'React'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Software Engineer Resume');
          resumeId = res.body.id;
        }));

    it('should fail without authentication', () => request(app.getHttpServer())
        .post('/resumes')
        .send({
          title: 'Test Resume',
        })
        .expect(401));

    it('should validate required fields', () => request(app.getHttpServer())
        .post('/resumes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing title
          personalInfo: {},
        })
        .expect(400));
  });

  describe('/resumes (GET)', () => {
    it('should get all resumes for user', () => request(app.getHttpServer())
        .get('/resumes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        }));

    it('should fail without authentication', () => request(app.getHttpServer())
        .get('/resumes')
        .expect(401));
  });

  describe('/resumes/:id (GET)', () => {
    it('should get resume by id', () => request(app.getHttpServer())
        .get(`/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(resumeId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('personalInfo');
        }));

    it('should return 404 for non-existent resume', () => request(app.getHttpServer())
        .get('/resumes/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404));
  });

  describe('/resumes/:id (PATCH)', () => {
    it('should update resume', () => request(app.getHttpServer())
        .patch(`/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Resume Title',
          summary: 'Updated summary',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Resume Title');
          expect(res.body.summary).toBe('Updated summary');
        }));

    it('should not update other users resume', () => 
      // This would require creating another user and their resume
       request(app.getHttpServer())
        .patch('/resumes/other-user-resume-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Hacked',
        })
        .expect(404) // Should not find resume owned by current user
    );
  });

  describe('/resumes/:id/export (GET)', () => {
    it('should export resume as PDF', () => request(app.getHttpServer())
        .get(`/resumes/${resumeId}/export?format=pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /pdf/)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Buffer);
        }));

    it('should export resume as DOCX', () => request(app.getHttpServer())
        .get(`/resumes/${resumeId}/export?format=docx`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /wordprocessingml/));

    it('should export resume as HTML', () => request(app.getHttpServer())
        .get(`/resumes/${resumeId}/export?format=html`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect((res) => {
          expect(typeof res.text).toBe('string');
          expect(res.text).toContain('<html');
        }));

    it('should export resume as JSON', () => request(app.getHttpServer())
        .get(`/resumes/${resumeId}/export?format=json`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body).toHaveProperty('personalInfo');
        }));
  });

  describe('/resumes/:id/duplicate (POST)', () => {
    it('should duplicate a resume', () => request(app.getHttpServer())
        .post(`/resumes/${resumeId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).not.toBe(resumeId);
          expect(res.body.title).toContain('Copy');
        }));
  });

  describe('/resumes/:id/primary (PATCH)', () => {
    it('should set resume as primary', () => request(app.getHttpServer())
        .patch(`/resumes/${resumeId}/primary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isPrimary).toBe(true);
        }));
  });

  describe('/resumes/:id (DELETE)', () => {
    it('should delete a resume', () => request(app.getHttpServer())
        .delete(`/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200));

    it('should return 404 after deletion', () => request(app.getHttpServer())
        .get(`/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404));
  });

  describe('/resumes/parse (POST)', () => {
    it('should parse uploaded resume file', () => {
      // Mock file upload
      const mockPDFBuffer = Buffer.from('Mock PDF content');

      return request(app.getHttpServer())
        .post('/resumes/parse')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', mockPDFBuffer, 'resume.pdf')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('personalInfo');
          expect(res.body).toHaveProperty('experience');
          expect(res.body).toHaveProperty('education');
          expect(res.body).toHaveProperty('skills');
        });
    });

    it('should reject unsupported file types', () => {
      const mockTxtBuffer = Buffer.from('Plain text resume');

      return request(app.getHttpServer())
        .post('/resumes/parse')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', mockTxtBuffer, 'resume.txt')
        .expect(400);
    });
  });
});
