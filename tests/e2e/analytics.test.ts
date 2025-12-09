/**
 * Analytics Service E2E Tests
 * Tests analytics dashboard and reporting
 */

import { authClient, analyticsClient, config, testState } from './setup';

describe('Analytics Service E2E', () => {
  const testUser = {
    email: `e2e-analytics-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Analytics',
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
    testState.accessToken = '';
    testState.refreshToken = '';
    testState.userId = '';
  });

  describe('Dashboard', () => {
    describe('GET /analytics/dashboard', () => {
      it('should get dashboard analytics', async () => {
        const response = await analyticsClient.get('/analytics/dashboard');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('totalApplications');
        expect(response.data).toHaveProperty('activeApplications');
      });

      it('should reject unauthenticated request', async () => {
        try {
          await analyticsClient.get('/analytics/dashboard', {
            headers: { Authorization: '' },
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(401);
        }
      });
    });

    describe('GET /analytics/dashboard/summary', () => {
      it('should get dashboard summary', async () => {
        const response = await analyticsClient.get('/analytics/dashboard/summary');

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Application Analytics', () => {
    describe('GET /analytics/applications', () => {
      it('should get application analytics', async () => {
        const response = await analyticsClient.get('/analytics/applications');

        expect(response.status).toBe(200);
      });

      it('should filter by date range', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';

        const response = await analyticsClient.get('/analytics/applications', {
          params: { startDate, endDate },
        });

        expect(response.status).toBe(200);
      });
    });

    describe('GET /analytics/applications/trends', () => {
      it('should get application trends', async () => {
        const response = await analyticsClient.get('/analytics/applications/trends');

        expect(response.status).toBe(200);
      });
    });

    describe('GET /analytics/applications/conversion', () => {
      it('should get conversion rates', async () => {
        const response = await analyticsClient.get('/analytics/applications/conversion');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('interviewRate');
        expect(response.data).toHaveProperty('offerRate');
      });
    });
  });

  describe('Job Market Analytics', () => {
    describe('GET /analytics/jobs/market', () => {
      it('should get market insights', async () => {
        const response = await analyticsClient.get('/analytics/jobs/market');

        expect(response.status).toBe(200);
      });
    });

    describe('GET /analytics/jobs/salary', () => {
      it('should get salary data', async () => {
        const response = await analyticsClient.get('/analytics/jobs/salary');

        expect(response.status).toBe(200);
      });

      it('should filter by job title', async () => {
        const response = await analyticsClient.get('/analytics/jobs/salary', {
          params: { title: 'Software Engineer' },
        });

        expect(response.status).toBe(200);
      });

      it('should filter by location', async () => {
        const response = await analyticsClient.get('/analytics/jobs/salary', {
          params: { location: 'San Francisco, CA' },
        });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Reports', () => {
    let reportId: string;

    describe('POST /analytics/reports', () => {
      it('should generate a report', async () => {
        const response = await analyticsClient.post('/analytics/reports', {
          type: 'application_summary',
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31',
          },
          format: 'pdf',
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('status');

        reportId = response.data.id;
      });
    });

    describe('GET /analytics/reports', () => {
      it('should list reports', async () => {
        const response = await analyticsClient.get('/analytics/reports');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('GET /analytics/reports/:id', () => {
      it('should get report by ID', async () => {
        if (!reportId) {
          console.log('Skipping: No report ID available');
          return;
        }

        const response = await analyticsClient.get(`/analytics/reports/${reportId}`);

        expect(response.status).toBe(200);
        expect(response.data.id).toBe(reportId);
      });

      it('should return 404 for non-existent report', async () => {
        try {
          await analyticsClient.get('/analytics/reports/00000000-0000-0000-0000-000000000000');
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(404);
        }
      });
    });

    describe('GET /analytics/reports/:id/download', () => {
      it('should download report', async () => {
        if (!reportId) {
          console.log('Skipping: No report ID available');
          return;
        }

        // Wait for report to be ready (reports might be async)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const response = await analyticsClient.get(`/analytics/reports/${reportId}/download`, {
          responseType: 'arraybuffer',
        });

        expect(response.status).toBe(200);
      });
    });
  });
});
