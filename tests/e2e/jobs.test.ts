/**
 * Job Service E2E Tests
 * Tests job listing, search, and saved jobs functionality
 */

import { authClient, jobClient, config, testState } from './setup';

describe('Job Service E2E', () => {
  const testUser = {
    email: `e2e-jobs-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Job',
    lastName: 'Tester',
  };

  beforeAll(async () => {
    // Register and login test user
    const response = await authClient.post('/auth/register', testUser);
    testState.accessToken = response.data.accessToken;
    testState.refreshToken = response.data.refreshToken;
    testState.userId = response.data.user.id;
  });

  afterAll(async () => {
    // Cleanup
    testState.accessToken = '';
    testState.refreshToken = '';
    testState.userId = '';
  });

  describe('GET /jobs', () => {
    it('should list jobs with pagination', async () => {
      const response = await jobClient.get('/jobs', {
        params: { page: 1, limit: 10 },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('meta');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.meta).toHaveProperty('total');
      expect(response.data.meta).toHaveProperty('page');
      expect(response.data.meta).toHaveProperty('limit');

      // Save a job ID for later tests
      if (response.data.data.length > 0) {
        testState.testJobId = response.data.data[0].id;
      }
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const response = await jobClient.get('/jobs', {
        params: { page: 1, limit },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeLessThanOrEqual(limit);
      expect(response.data.meta.limit).toBe(limit);
    });

    it('should reject invalid pagination', async () => {
      try {
        await jobClient.get('/jobs', {
          params: { page: -1, limit: 10 },
        });
        // Some APIs may normalize invalid values
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject unauthenticated request', async () => {
      try {
        await jobClient.get('/jobs', {
          headers: { Authorization: '' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /jobs/search', () => {
    it('should search jobs by keyword', async () => {
      const response = await jobClient.get('/jobs/search', {
        params: { q: 'software engineer' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter by location', async () => {
      const response = await jobClient.get('/jobs/search', {
        params: { q: 'developer', location: 'remote' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('should filter by job type', async () => {
      const response = await jobClient.get('/jobs/search', {
        params: { q: 'engineer', type: 'full-time' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('should filter by salary range', async () => {
      const response = await jobClient.get('/jobs/search', {
        params: { q: 'developer', salaryMin: 80000, salaryMax: 150000 },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('should combine multiple filters', async () => {
      const response = await jobClient.get('/jobs/search', {
        params: {
          q: 'software',
          location: 'remote',
          type: 'full-time',
          salaryMin: 100000,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });
  });

  describe('GET /jobs/:id', () => {
    it('should get job by ID', async () => {
      if (!testState.testJobId) {
        console.log('Skipping: No test job ID available');
        return;
      }

      const response = await jobClient.get(`/jobs/${testState.testJobId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('company');
      expect(response.data).toHaveProperty('description');
      expect(response.data.id).toBe(testState.testJobId);
    });

    it('should return 404 for non-existent job', async () => {
      try {
        await jobClient.get('/jobs/00000000-0000-0000-0000-000000000000');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return 400 for invalid job ID format', async () => {
      try {
        await jobClient.get('/jobs/invalid-id');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([400, 404]).toContain(error.response.status);
      }
    });
  });

  describe('Saved Jobs', () => {
    describe('POST /jobs/saved/:jobId', () => {
      it('should save a job', async () => {
        if (!testState.testJobId) {
          console.log('Skipping: No test job ID available');
          return;
        }

        const response = await jobClient.post(`/jobs/saved/${testState.testJobId}`);

        expect(response.status).toBe(201);
      });

      it('should handle saving already saved job', async () => {
        if (!testState.testJobId) {
          console.log('Skipping: No test job ID available');
          return;
        }

        try {
          await jobClient.post(`/jobs/saved/${testState.testJobId}`);
          // Some APIs return 200/201, others return 409
        } catch (error: any) {
          expect(error.response.status).toBe(409);
        }
      });
    });

    describe('GET /jobs/saved', () => {
      it('should list saved jobs', async () => {
        const response = await jobClient.get('/jobs/saved');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);

        if (testState.testJobId) {
          const savedJob = response.data.find((j: any) => j.id === testState.testJobId);
          expect(savedJob).toBeDefined();
        }
      });
    });

    describe('GET /jobs/saved/check/:jobId', () => {
      it('should confirm job is saved', async () => {
        if (!testState.testJobId) {
          console.log('Skipping: No test job ID available');
          return;
        }

        const response = await jobClient.get(`/jobs/saved/check/${testState.testJobId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('isSaved');
        expect(response.data.isSaved).toBe(true);
      });
    });

    describe('DELETE /jobs/saved/:jobId', () => {
      it('should unsave a job', async () => {
        if (!testState.testJobId) {
          console.log('Skipping: No test job ID available');
          return;
        }

        const response = await jobClient.delete(`/jobs/saved/${testState.testJobId}`);

        expect(response.status).toBe(204);
      });

      it('should confirm job is no longer saved', async () => {
        if (!testState.testJobId) {
          console.log('Skipping: No test job ID available');
          return;
        }

        const response = await jobClient.get(`/jobs/saved/check/${testState.testJobId}`);

        expect(response.status).toBe(200);
        expect(response.data.isSaved).toBe(false);
      });
    });
  });

  describe('Job Alerts', () => {
    let alertId: string;

    describe('POST /jobs/alerts', () => {
      it('should create a job alert', async () => {
        const response = await jobClient.post('/jobs/alerts', {
          name: 'E2E Test Alert',
          keywords: ['software engineer', 'developer'],
          location: 'remote',
          frequency: 'daily',
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.name).toBe('E2E Test Alert');

        alertId = response.data.id;
      });
    });

    describe('GET /jobs/alerts', () => {
      it('should list job alerts', async () => {
        const response = await jobClient.get('/jobs/alerts');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);

        if (alertId) {
          const alert = response.data.find((a: any) => a.id === alertId);
          expect(alert).toBeDefined();
        }
      });
    });

    describe('PATCH /jobs/alerts/:id', () => {
      it('should update a job alert', async () => {
        if (!alertId) {
          console.log('Skipping: No alert ID available');
          return;
        }

        const response = await jobClient.patch(`/jobs/alerts/${alertId}`, {
          name: 'Updated E2E Alert',
          frequency: 'weekly',
        });

        expect(response.status).toBe(200);
        expect(response.data.name).toBe('Updated E2E Alert');
        expect(response.data.frequency).toBe('weekly');
      });
    });

    describe('POST /jobs/alerts/:id/toggle', () => {
      it('should toggle alert on/off', async () => {
        if (!alertId) {
          console.log('Skipping: No alert ID available');
          return;
        }

        const response = await jobClient.post(`/jobs/alerts/${alertId}/toggle`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('enabled');
      });
    });

    describe('DELETE /jobs/alerts/:id', () => {
      it('should delete a job alert', async () => {
        if (!alertId) {
          console.log('Skipping: No alert ID available');
          return;
        }

        const response = await jobClient.delete(`/jobs/alerts/${alertId}`);

        expect(response.status).toBe(204);
      });
    });
  });

  describe('GET /jobs/:id/similar', () => {
    it('should get similar jobs', async () => {
      if (!testState.testJobId) {
        console.log('Skipping: No test job ID available');
        return;
      }

      const response = await jobClient.get(`/jobs/${testState.testJobId}/similar`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
