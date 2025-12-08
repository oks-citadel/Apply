/**
 * Job-AI Integration Tests
 * Tests the integration between job-service and ai-service
 * Validates job matching and recommendation flows
 */

import { AxiosInstance } from 'axios';
import { TestServiceManager } from './utils/test-service-manager';
import { TestDatabaseManager } from './utils/test-database';
import { createJobPayload, getTestJob } from './fixtures/job.fixtures';
import { createResumePayload } from './fixtures/resume.fixtures';
import { createUserPayload } from './fixtures/user.fixtures';
import { logger } from './utils/test-logger';

describe('Job-AI Integration Tests', () => {
  let serviceManager: TestServiceManager;
  let dbManager: TestDatabaseManager;
  let jobService: AxiosInstance;
  let aiService: AxiosInstance;
  let authService: AxiosInstance;
  let resumeService: AxiosInstance;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    serviceManager = (global as any).testServices;
    dbManager = (global as any).testDb;

    jobService = serviceManager.getService('job-service');
    aiService = serviceManager.getService('ai-service');
    authService = serviceManager.getService('auth-service');
    resumeService = serviceManager.getService('resume-service');

    // Wait for services
    await Promise.all([
      serviceManager.waitForService('job-service'),
      serviceManager.waitForService('ai-service'),
      serviceManager.waitForService('auth-service'),
      serviceManager.waitForService('resume-service'),
    ]);

    // Create test user and get token
    const userData = createUserPayload();
    const registerResponse = await authService.post('/api/v1/auth/register', userData);
    accessToken = registerResponse.data.accessToken;
    userId = registerResponse.data.user.id;
  });

  beforeEach(async () => {
    await dbManager.cleanDatabase('job_service_test');
  });

  describe('Job Matching Flow', () => {
    it('should match jobs to user resume using AI', async () => {
      // Create a job
      const jobData = createJobPayload({
        title: 'Senior TypeScript Developer',
        skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL'],
        experienceLevel: 'senior',
      });

      const jobResponse = await jobService.post('/api/v1/jobs', jobData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(jobResponse.status).toBe(201);
      const job = jobResponse.data;

      // Create a resume
      const resumeData = createResumePayload(userId, {
        skills: ['TypeScript', 'Node.js', 'React', 'Python', 'MongoDB'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(resumeResponse.status).toBe(201);
      const resume = resumeResponse.data;

      // Request job matching from AI service
      const matchResponse = await aiService.post(
        '/api/ai/match/jobs',
        {
          resumeId: resume.id,
          jobIds: [job.id],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(matchResponse.status).toBe(200);
      expect(matchResponse.data).toHaveProperty('matches');
      expect(Array.isArray(matchResponse.data.matches)).toBe(true);

      const match = matchResponse.data.matches[0];
      expect(match).toHaveProperty('jobId', job.id);
      expect(match).toHaveProperty('score');
      expect(match.score).toBeGreaterThan(0);
      expect(match.score).toBeLessThanOrEqual(1);
      expect(match).toHaveProperty('reasons');
      expect(match).toHaveProperty('matchingSkills');
    });

    it('should return higher scores for better matches', async () => {
      // Create two jobs with different skill requirements
      const perfectMatchJob = createJobPayload({
        title: 'TypeScript Expert',
        skills: ['TypeScript', 'Node.js', 'React'],
        experienceLevel: 'senior',
      });

      const poorMatchJob = createJobPayload({
        title: 'Java Developer',
        skills: ['Java', 'Spring', 'Maven'],
        experienceLevel: 'senior',
      });

      const job1Response = await jobService.post('/api/v1/jobs', perfectMatchJob, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const job2Response = await jobService.post('/api/v1/jobs', poorMatchJob, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const job1 = job1Response.data;
      const job2 = job2Response.data;

      // Create resume with TypeScript skills
      const resumeData = createResumePayload(userId, {
        skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      // Get match scores
      const matchResponse = await aiService.post(
        '/api/ai/match/jobs',
        {
          resumeId: resume.id,
          jobIds: [job1.id, job2.id],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(matchResponse.status).toBe(200);

      const matches = matchResponse.data.matches;
      const match1 = matches.find((m: any) => m.jobId === job1.id);
      const match2 = matches.find((m: any) => m.jobId === job2.id);

      expect(match1.score).toBeGreaterThan(match2.score);
    });

    it('should provide match explanations and recommendations', async () => {
      const jobData = createJobPayload({
        title: 'Full Stack Engineer',
        skills: ['TypeScript', 'React', 'Node.js', 'AWS'],
      });

      const jobResponse = await jobService.post('/api/v1/jobs', jobData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const job = jobResponse.data;

      const resumeData = createResumePayload(userId, {
        skills: ['TypeScript', 'React', 'Node.js'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resume = resumeResponse.data;

      const matchResponse = await aiService.post(
        '/api/ai/match/jobs',
        {
          resumeId: resume.id,
          jobIds: [job.id],
          includeRecommendations: true,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(matchResponse.status).toBe(200);

      const match = matchResponse.data.matches[0];
      expect(match).toHaveProperty('reasons');
      expect(Array.isArray(match.reasons)).toBe(true);
      expect(match.reasons.length).toBeGreaterThan(0);
      expect(match).toHaveProperty('missingSkills');
      expect(match).toHaveProperty('recommendations');
    });
  });

  describe('Job Recommendation Flow', () => {
    it('should get personalized job recommendations', async () => {
      // Create multiple jobs
      const jobs = [
        createJobPayload({
          title: 'Senior React Developer',
          skills: ['React', 'TypeScript', 'Node.js'],
          experienceLevel: 'senior',
        }),
        createJobPayload({
          title: 'Backend Engineer',
          skills: ['Node.js', 'PostgreSQL', 'Redis'],
          experienceLevel: 'mid',
        }),
        createJobPayload({
          title: 'DevOps Engineer',
          skills: ['Docker', 'Kubernetes', 'AWS'],
          experienceLevel: 'senior',
        }),
      ];

      for (const jobData of jobs) {
        await jobService.post('/api/v1/jobs', jobData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }

      // Create user resume
      const resumeData = createResumePayload(userId, {
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      });

      await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Get recommendations
      const recommendResponse = await aiService.get(
        `/api/ai/match/recommendations/${userId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 10 },
        }
      );

      expect(recommendResponse.status).toBe(200);
      expect(recommendResponse.data).toHaveProperty('recommendations');
      expect(Array.isArray(recommendResponse.data.recommendations)).toBe(true);
      expect(recommendResponse.data.recommendations.length).toBeGreaterThan(0);

      // Verify recommendations are sorted by relevance
      const recommendations = recommendResponse.data.recommendations;
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(
          recommendations[i].score
        );
      }
    });

    it('should filter recommendations by criteria', async () => {
      // Create jobs with different characteristics
      const remoteJob = createJobPayload({
        title: 'Remote TypeScript Developer',
        skills: ['TypeScript', 'Node.js'],
        remote: true,
        location: 'Remote',
      });

      const onsiteJob = createJobPayload({
        title: 'Onsite Developer',
        skills: ['TypeScript', 'Node.js'],
        remote: false,
        location: 'New York, NY',
      });

      await jobService.post('/api/v1/jobs', remoteJob, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      await jobService.post('/api/v1/jobs', onsiteJob, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Get remote-only recommendations
      const recommendResponse = await aiService.get(
        `/api/ai/match/recommendations/${userId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            remote: true,
            limit: 10,
          },
        }
      );

      expect(recommendResponse.status).toBe(200);
      const recommendations = recommendResponse.data.recommendations;

      // All recommendations should be remote jobs
      recommendations.forEach((rec: any) => {
        expect(rec.job.remote).toBe(true);
      });
    });
  });

  describe('Bulk Job Analysis', () => {
    it('should analyze multiple jobs efficiently', async () => {
      // Create multiple jobs
      const jobPromises = Array.from({ length: 5 }, (_, i) =>
        jobService.post(
          '/api/v1/jobs',
          createJobPayload({
            title: `Job ${i + 1}`,
            skills: ['TypeScript', 'React'],
          }),
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        )
      );

      const jobResponses = await Promise.all(jobPromises);
      const jobIds = jobResponses.map(r => r.data.id);

      // Create resume
      const resumeData = createResumePayload(userId, {
        skills: ['TypeScript', 'React', 'Node.js'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const startTime = Date.now();

      // Analyze all jobs
      const matchResponse = await aiService.post(
        '/api/ai/match/jobs',
        {
          resumeId: resumeResponse.data.id,
          jobIds,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const duration = Date.now() - startTime;

      expect(matchResponse.status).toBe(200);
      expect(matchResponse.data.matches.length).toBe(jobIds.length);

      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);

      logger.info(`Analyzed ${jobIds.length} jobs in ${duration}ms`);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent job gracefully', async () => {
      const resumeData = createResumePayload(userId, {
        skills: ['TypeScript'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const matchResponse = await aiService.post(
        '/api/ai/match/jobs',
        {
          resumeId: resumeResponse.data.id,
          jobIds: ['non-existent-job-id'],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect([404, 400]).toContain(matchResponse.status);
    });

    it('should handle AI service timeout', async () => {
      // This would require actual AI service with timeout simulation
      // For now, we test with a large batch that might timeout
      const largeJobIds = Array.from({ length: 100 }, (_, i) => `job-${i}`);

      const resumeData = createResumePayload(userId, {
        skills: ['TypeScript'],
      });

      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const matchResponse = await aiService.post(
        '/api/ai/match/jobs',
        {
          resumeId: resumeResponse.data.id,
          jobIds: largeJobIds,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 3000,
        }
      );

      // Should either succeed or return proper error
      expect([200, 408, 500]).toContain(matchResponse.status);
    });
  });
});
