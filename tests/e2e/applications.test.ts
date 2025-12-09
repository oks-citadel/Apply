/**
 * Applications & Auto-Apply Service E2E Tests
 * Tests job application submission and auto-apply functionality
 */

import { authClient, autoApplyClient, resumeClient, jobClient, config, testState } from './setup';

describe('Applications & Auto-Apply Service E2E', () => {
  const testUser = {
    email: `e2e-apps-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Apply',
    lastName: 'Tester',
  };

  beforeAll(async () => {
    // Register and login test user
    const response = await authClient.post('/auth/register', testUser);
    testState.accessToken = response.data.accessToken;
    testState.refreshToken = response.data.refreshToken;
    testState.userId = response.data.user.id;

    // Create a test resume
    const resumeResponse = await resumeClient.post('/resumes', {
      name: 'Application Test Resume',
      template: 'professional',
      sections: {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: testUser.email,
        },
        skills: ['JavaScript', 'TypeScript', 'React'],
      },
    });
    testState.testResumeId = resumeResponse.data.id;

    // Get a test job
    const jobsResponse = await jobClient.get('/jobs', { params: { limit: 1 } });
    if (jobsResponse.data.data.length > 0) {
      testState.testJobId = jobsResponse.data.data[0].id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testState.testResumeId) {
      try {
        await resumeClient.delete(`/resumes/${testState.testResumeId}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    testState.accessToken = '';
    testState.refreshToken = '';
    testState.userId = '';
  });

  describe('Applications', () => {
    describe('POST /applications', () => {
      it('should submit a job application', async () => {
        if (!testState.testJobId || !testState.testResumeId) {
          console.log('Skipping: Missing job or resume ID');
          return;
        }

        const response = await autoApplyClient.post('/applications', {
          jobId: testState.testJobId,
          resumeId: testState.testResumeId,
          coverLetterId: null,
          answers: {},
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('status');
        expect(response.data.jobId).toBe(testState.testJobId);
        expect(response.data.resumeId).toBe(testState.testResumeId);

        testState.testApplicationId = response.data.id;
      });

      it('should reject duplicate application', async () => {
        if (!testState.testJobId || !testState.testResumeId) {
          console.log('Skipping: Missing job or resume ID');
          return;
        }

        try {
          await autoApplyClient.post('/applications', {
            jobId: testState.testJobId,
            resumeId: testState.testResumeId,
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(409);
        }
      });

      it('should reject application without job ID', async () => {
        try {
          await autoApplyClient.post('/applications', {
            resumeId: testState.testResumeId,
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      });

      it('should reject application without resume ID', async () => {
        try {
          await autoApplyClient.post('/applications', {
            jobId: testState.testJobId,
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      });
    });

    describe('GET /applications', () => {
      it('should list user applications', async () => {
        const response = await autoApplyClient.get('/applications', {
          params: { page: 1, limit: 20 },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
        expect(response.data).toHaveProperty('meta');
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should filter applications by status', async () => {
        const response = await autoApplyClient.get('/applications', {
          params: { status: 'submitted' },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
      });
    });

    describe('GET /applications/:id', () => {
      it('should get application by ID', async () => {
        if (!testState.testApplicationId) {
          console.log('Skipping: No test application ID available');
          return;
        }

        const response = await autoApplyClient.get(`/applications/${testState.testApplicationId}`);

        expect(response.status).toBe(200);
        expect(response.data.id).toBe(testState.testApplicationId);
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('appliedAt');
      });

      it('should return 404 for non-existent application', async () => {
        try {
          await autoApplyClient.get('/applications/00000000-0000-0000-0000-000000000000');
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(404);
        }
      });
    });

    describe('GET /applications/:id/status', () => {
      it('should get application status', async () => {
        if (!testState.testApplicationId) {
          console.log('Skipping: No test application ID available');
          return;
        }

        const response = await autoApplyClient.get(`/applications/${testState.testApplicationId}/status`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
      });
    });

    describe('GET /applications/stats', () => {
      it('should get application statistics', async () => {
        const response = await autoApplyClient.get('/applications/stats');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('total');
      });
    });

    describe('DELETE /applications/:id (withdraw)', () => {
      it('should withdraw application', async () => {
        if (!testState.testApplicationId) {
          console.log('Skipping: No test application ID available');
          return;
        }

        const response = await autoApplyClient.delete(`/applications/${testState.testApplicationId}`);

        expect(response.status).toBe(204);
      });

      it('should confirm application is withdrawn', async () => {
        if (!testState.testApplicationId) {
          console.log('Skipping: No test application ID available');
          return;
        }

        const response = await autoApplyClient.get(`/applications/${testState.testApplicationId}`);

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('withdrawn');
      });
    });
  });

  describe('Auto-Apply', () => {
    describe('GET /auto-apply/settings', () => {
      it('should get auto-apply settings', async () => {
        const response = await autoApplyClient.get('/auto-apply/settings');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('enabled');
        expect(response.data).toHaveProperty('maxApplicationsPerDay');
      });
    });

    describe('PATCH /auto-apply/settings', () => {
      it('should update auto-apply settings', async () => {
        const settings = {
          enabled: true,
          maxApplicationsPerDay: 10,
          targetJobTitles: ['Software Engineer', 'Full Stack Developer'],
          excludedCompanies: ['ExcludeCorp'],
          minSalary: 80000,
          preferredLocations: ['Remote', 'San Francisco, CA'],
        };

        const response = await autoApplyClient.patch('/auto-apply/settings', settings);

        expect(response.status).toBe(200);
        expect(response.data.maxApplicationsPerDay).toBe(10);
        expect(response.data.targetJobTitles).toContain('Software Engineer');
      });

      it('should reject invalid settings', async () => {
        try {
          await autoApplyClient.patch('/auto-apply/settings', {
            maxApplicationsPerDay: -1,
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      });
    });

    describe('POST /auto-apply/start', () => {
      it('should start auto-apply process', async () => {
        const response = await autoApplyClient.post('/auto-apply/start');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        expect(['started', 'already_running']).toContain(response.data.status);
      });
    });

    describe('GET /auto-apply/queue', () => {
      it('should get auto-apply queue', async () => {
        const response = await autoApplyClient.get('/auto-apply/queue');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('GET /auto-apply/history', () => {
      it('should get auto-apply history', async () => {
        const response = await autoApplyClient.get('/auto-apply/history');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('POST /auto-apply/stop', () => {
      it('should stop auto-apply process', async () => {
        const response = await autoApplyClient.post('/auto-apply/stop');

        expect(response.status).toBe(200);
      });
    });

    describe('DELETE /auto-apply/queue/:id', () => {
      it('should remove job from queue', async () => {
        // First get queue to find an item
        const queueResponse = await autoApplyClient.get('/auto-apply/queue');

        if (queueResponse.data.length === 0) {
          console.log('Skipping: Queue is empty');
          return;
        }

        const queueItemId = queueResponse.data[0].id;
        const response = await autoApplyClient.delete(`/auto-apply/queue/${queueItemId}`);

        expect(response.status).toBe(204);
      });
    });
  });
});
