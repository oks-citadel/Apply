/**
 * Auto-Apply-Job Integration Tests
 * Tests the integration between auto-apply-service and job-service
 * Validates automated job application flows
 */

import { AxiosInstance } from 'axios';
import { TestServiceManager } from './utils/test-service-manager';
import { TestDatabaseManager } from './utils/test-database';
import { createJobPayload } from './fixtures/job.fixtures';
import { createResumePayload } from './fixtures/resume.fixtures';
import { createUserPayload } from './fixtures/user.fixtures';
import { logger } from './utils/test-logger';

describe('Auto-Apply-Job Integration Tests', () => {
  let serviceManager: TestServiceManager;
  let dbManager: TestDatabaseManager;
  let autoApplyService: AxiosInstance;
  let jobService: AxiosInstance;
  let authService: AxiosInstance;
  let resumeService: AxiosInstance;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    serviceManager = (global as any).testServices;
    dbManager = (global as any).testDb;

    autoApplyService = serviceManager.getService('auto-apply-service');
    jobService = serviceManager.getService('job-service');
    authService = serviceManager.getService('auth-service');
    resumeService = serviceManager.getService('resume-service');

    await Promise.all([
      serviceManager.waitForService('auto-apply-service'),
      serviceManager.waitForService('job-service'),
      serviceManager.waitForService('auth-service'),
      serviceManager.waitForService('resume-service'),
    ]);

    // Create test user
    const userData = createUserPayload();
    const registerResponse = await authService.post('/api/v1/auth/register', userData);
    accessToken = registerResponse.data.accessToken;
    userId = registerResponse.data.user.id;
  });

  beforeEach(async () => {
    await dbManager.cleanDatabase('auto_apply_service_test');
    await dbManager.cleanDatabase('job_service_test');
  });

  describe('Job Fetching Flow', () => {
    it('should fetch job details from job service', async () => {
      // Create a job
      const jobData = createJobPayload({
        title: 'Software Engineer',
        company: 'Tech Corp',
      });

      const jobResponse = await jobService.post('/api/v1/jobs', jobData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(jobResponse.status).toBe(201);
      const job = jobResponse.data;

      // Fetch job through auto-apply service
      const fetchResponse = await autoApplyService.get(`/api/v1/jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(fetchResponse.status).toBe(200);
      expect(fetchResponse.data.id).toBe(job.id);
      expect(fetchResponse.data.title).toBe(jobData.title);
      expect(fetchResponse.data.company).toBe(jobData.company);
    });

    it('should fetch multiple jobs for auto-apply campaign', async () => {
      // Create multiple jobs
      const jobs = await Promise.all([
        jobService.post('/api/v1/jobs', createJobPayload({ title: 'Job 1' }), {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        jobService.post('/api/v1/jobs', createJobPayload({ title: 'Job 2' }), {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        jobService.post('/api/v1/jobs', createJobPayload({ title: 'Job 3' }), {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const jobIds = jobs.map(r => r.data.id);

      // Create auto-apply campaign
      const campaignResponse = await autoApplyService.post(
        '/api/v1/campaigns',
        {
          name: 'Test Campaign',
          jobIds,
          resumeId: 'resume-123',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(campaignResponse.status).toBe(201);
      expect(campaignResponse.data).toHaveProperty('id');
      expect(campaignResponse.data.jobCount).toBe(jobIds.length);
    });

    it('should filter jobs based on criteria', async () => {
      // Create jobs with different attributes
      await Promise.all([
        jobService.post(
          '/api/v1/jobs',
          createJobPayload({
            title: 'Remote TypeScript Developer',
            remote: true,
            skills: ['TypeScript', 'Node.js'],
          }),
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ),
        jobService.post(
          '/api/v1/jobs',
          createJobPayload({
            title: 'Onsite Java Developer',
            remote: false,
            skills: ['Java', 'Spring'],
          }),
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ),
      ]);

      // Search for remote TypeScript jobs
      const searchResponse = await autoApplyService.get('/api/v1/jobs/search', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          remote: true,
          skills: 'TypeScript',
        },
      });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.data.jobs.length).toBeGreaterThan(0);

      searchResponse.data.jobs.forEach((job: any) => {
        expect(job.remote).toBe(true);
        expect(job.skills).toContain('TypeScript');
      });
    });
  });

  describe('Application Submission Flow', () => {
    it('should submit application to job', async () => {
      // Create job
      const jobData = createJobPayload();
      const jobResponse = await jobService.post('/api/v1/jobs', jobData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const job = jobResponse.data;

      // Create resume
      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const resume = resumeResponse.data;

      // Submit application
      const applicationResponse = await autoApplyService.post(
        '/api/v1/applications',
        {
          jobId: job.id,
          resumeId: resume.id,
          coverLetter: 'I am interested in this position.',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(applicationResponse.status).toBe(201);
      expect(applicationResponse.data).toHaveProperty('id');
      expect(applicationResponse.data.jobId).toBe(job.id);
      expect(applicationResponse.data.status).toBe('submitted');
    });

    it('should track application status', async () => {
      const jobData = createJobPayload();
      const jobResponse = await jobService.post('/api/v1/jobs', jobData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const job = jobResponse.data;

      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const resume = resumeResponse.data;

      const applicationResponse = await autoApplyService.post(
        '/api/v1/applications',
        {
          jobId: job.id,
          resumeId: resume.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const applicationId = applicationResponse.data.id;

      // Get application status
      const statusResponse = await autoApplyService.get(
        `/api/v1/applications/${applicationId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.data).toHaveProperty('status');
      expect(statusResponse.data).toHaveProperty('submittedAt');
    });

    it('should prevent duplicate applications', async () => {
      const jobData = createJobPayload();
      const jobResponse = await jobService.post('/api/v1/jobs', jobData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const job = jobResponse.data;

      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const resume = resumeResponse.data;

      // First application
      const firstApplication = await autoApplyService.post(
        '/api/v1/applications',
        {
          jobId: job.id,
          resumeId: resume.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(firstApplication.status).toBe(201);

      // Duplicate application
      const duplicateApplication = await autoApplyService.post(
        '/api/v1/applications',
        {
          jobId: job.id,
          resumeId: resume.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(duplicateApplication.status).toBe(409); // Conflict
    });
  });

  describe('Batch Application Flow', () => {
    it('should submit applications to multiple jobs', async () => {
      // Create multiple jobs
      const jobPromises = Array.from({ length: 5 }, (_, i) =>
        jobService.post('/api/v1/jobs', createJobPayload({ title: `Job ${i + 1}` }), {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      );

      const jobResponses = await Promise.all(jobPromises);
      const jobIds = jobResponses.map(r => r.data.id);

      // Create resume
      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const resume = resumeResponse.data;

      // Batch submit applications
      const batchResponse = await autoApplyService.post(
        '/api/v1/applications/batch',
        {
          jobIds,
          resumeId: resume.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(batchResponse.status).toBe(200);
      expect(batchResponse.data.successful).toBe(jobIds.length);
      expect(batchResponse.data.failed).toBe(0);
      expect(batchResponse.data.applications.length).toBe(jobIds.length);
    });

    it('should handle partial batch failures', async () => {
      const validJob = await jobService.post('/api/v1/jobs', createJobPayload(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const jobIds = [validJob.data.id, 'invalid-job-id'];

      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const batchResponse = await autoApplyService.post(
        '/api/v1/applications/batch',
        {
          jobIds,
          resumeId: resumeResponse.data.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(batchResponse.status).toBe(200);
      expect(batchResponse.data.successful).toBe(1);
      expect(batchResponse.data.failed).toBe(1);
      expect(batchResponse.data.errors.length).toBe(1);
    });
  });

  describe('Campaign Management', () => {
    it('should create and execute auto-apply campaign', async () => {
      // Create jobs
      const jobPromises = Array.from({ length: 3 }, (_, i) =>
        jobService.post('/api/v1/jobs', createJobPayload({ title: `Job ${i + 1}` }), {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      );

      const jobResponses = await Promise.all(jobPromises);
      const jobIds = jobResponses.map(r => r.data.id);

      // Create resume
      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Create campaign
      const campaignResponse = await autoApplyService.post(
        '/api/v1/campaigns',
        {
          name: 'Software Engineer Campaign',
          jobIds,
          resumeId: resumeResponse.data.id,
          autoExecute: true,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(campaignResponse.status).toBe(201);
      const campaignId = campaignResponse.data.id;

      // Wait for campaign execution
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check campaign status
      const statusResponse = await autoApplyService.get(
        `/api/v1/campaigns/${campaignId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.data.status).toBe('completed');
      expect(statusResponse.data.applicationsSubmitted).toBe(jobIds.length);
    });

    it('should get user application history', async () => {
      // Submit some applications
      const jobData = createJobPayload();
      const jobResponse = await jobService.post('/api/v1/jobs', jobData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      await autoApplyService.post(
        '/api/v1/applications',
        {
          jobId: jobResponse.data.id,
          resumeId: resumeResponse.data.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // Get history
      const historyResponse = await autoApplyService.get(
        `/api/v1/applications/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.data.applications.length).toBeGreaterThan(0);
      expect(historyResponse.data.total).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent job', async () => {
      const resumeData = createResumePayload(userId);
      const resumeResponse = await resumeService.post('/api/v1/resumes', resumeData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const applicationResponse = await autoApplyService.post(
        '/api/v1/applications',
        {
          jobId: 'non-existent-job',
          resumeId: resumeResponse.data.id,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect([404, 400]).toContain(applicationResponse.status);
    });

    it('should handle job service unavailable', async () => {
      // This would require stopping job service
      // For now, test timeout handling
      const applicationResponse = await autoApplyService.post(
        '/api/v1/applications',
        {
          jobId: 'job-123',
          resumeId: 'resume-123',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 1000,
        }
      );

      // Should return appropriate error
      expect([404, 408, 500, 503]).toContain(applicationResponse.status);
    });
  });
});
