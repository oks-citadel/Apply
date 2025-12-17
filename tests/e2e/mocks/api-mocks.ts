/**
 * API Mocks for E2E Tests
 * Sets up nock interceptors for all service endpoints
 */

import nock from 'nock';
import { config, testState } from '../setup';

/**
 * Set up all API mocks for E2E testing
 */
export function setupAllMocks(): void {
  setupAuthMocks();
  setupUserMocks();
  setupJobMocks();
  setupResumeMocks();
  setupAutoApplyMocks();
  setupAnalyticsMocks();
  setupNotificationMocks();
  setupAIMocks();
}

/**
 * Auth Service Mocks
 */
export function setupAuthMocks(): void {
  const baseURL = config.authServiceUrl;

  // Register
  nock(baseURL)
    .persist()
    .post('/auth/register')
    .reply(201, (uri, requestBody: any) => ({
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      user: {
        id: `user-${Date.now()}`,
        email: requestBody.email,
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        createdAt: new Date().toISOString(),
      },
    }));

  // Login
  nock(baseURL)
    .persist()
    .post('/auth/login')
    .reply(200, (uri, requestBody: any) => ({
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      user: {
        id: `user-${Date.now()}`,
        email: requestBody.email,
      },
    }));

  // Me endpoint
  nock(baseURL)
    .persist()
    .get('/auth/me')
    .reply(200, () => ({
      id: testState.userId,
      email: 'test@example.com',
    }));

  // Refresh
  nock(baseURL)
    .persist()
    .post('/auth/refresh')
    .reply(200, { accessToken: `mock-new-access-token-${Date.now()}` });

  // Logout
  nock(baseURL)
    .persist()
    .post('/auth/logout')
    .reply(200, { success: true });

  // Forgot password
  nock(baseURL)
    .persist()
    .post('/auth/forgot-password')
    .reply(200, { success: true, message: 'Password reset email sent' });

  // Reset password
  nock(baseURL)
    .persist()
    .post('/auth/reset-password')
    .reply(200, { success: true });

  // Verify email
  nock(baseURL)
    .persist()
    .get(/\/auth\/verify-email.*/)
    .reply(200, { success: true, verified: true });

  // Change password
  nock(baseURL)
    .persist()
    .post('/auth/change-password')
    .reply(200, { success: true });

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'auth-service' });

  nock(baseURL)
    .persist()
    .get('/health/ready')
    .reply(200, { status: 'ok', ready: true });

  nock(baseURL)
    .persist()
    .get('/health/live')
    .reply(200, { status: 'ok', alive: true });
}

/**
 * User Service Mocks
 */
export function setupUserMocks(): void {
  const baseURL = config.userServiceUrl;

  // Profile endpoints
  nock(baseURL)
    .persist()
    .get('/profile')
    .reply(200, () => ({
      userId: testState.userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      headline: '',
      summary: '',
      location: '',
    }));

  nock(baseURL)
    .persist()
    .patch('/profile')
    .reply(200, (uri, requestBody: any) => ({
      userId: testState.userId,
      ...requestBody,
    }));

  nock(baseURL)
    .persist()
    .get('/profile/completion')
    .reply(200, { percentage: 65, missingFields: ['headline', 'summary'] });

  // Career experience
  nock(baseURL)
    .persist()
    .post('/career/experience')
    .reply(201, (uri, requestBody: any) => ({
      id: `exp-${Date.now()}`,
      ...requestBody,
      createdAt: new Date().toISOString(),
    }));

  nock(baseURL)
    .persist()
    .get('/career/experience')
    .reply(200, []);

  nock(baseURL)
    .persist()
    .patch(/\/career\/experience\/.*/)
    .reply(200, (uri, requestBody: any) => ({
      id: uri.split('/').pop(),
      ...requestBody,
    }));

  nock(baseURL)
    .persist()
    .delete(/\/career\/experience\/.*/)
    .reply(204);

  // Education
  nock(baseURL)
    .persist()
    .post('/career/education')
    .reply(201, (uri, requestBody: any) => ({
      id: `edu-${Date.now()}`,
      ...requestBody,
      createdAt: new Date().toISOString(),
    }));

  nock(baseURL)
    .persist()
    .get('/career/education')
    .reply(200, []);

  nock(baseURL)
    .persist()
    .patch(/\/career\/education\/.*/)
    .reply(200, (uri, requestBody: any) => ({
      id: uri.split('/').pop(),
      ...requestBody,
    }));

  nock(baseURL)
    .persist()
    .delete(/\/career\/education\/.*/)
    .reply(204);

  // Skills
  nock(baseURL)
    .persist()
    .post('/skills')
    .reply(201, (uri, requestBody: any) => ({
      id: `skill-${Date.now()}`,
      ...requestBody,
    }));

  nock(baseURL)
    .persist()
    .post('/skills/bulk')
    .reply(201, (uri, requestBody: any) =>
      (requestBody.skills || []).map((skill: any, i: number) => ({
        id: `skill-${Date.now()}-${i}`,
        ...skill,
      }))
    );

  nock(baseURL)
    .persist()
    .get('/skills')
    .reply(200, []);

  nock(baseURL)
    .persist()
    .get('/skills/suggestions')
    .reply(200, ['TypeScript', 'React', 'Node.js', 'AWS', 'Python']);

  nock(baseURL)
    .persist()
    .patch(/\/skills\/.*/)
    .reply(200, (uri, requestBody: any) => ({
      id: uri.split('/').pop(),
      ...requestBody,
    }));

  nock(baseURL)
    .persist()
    .delete(/\/skills\/.*/)
    .reply(204);

  // Preferences
  nock(baseURL)
    .persist()
    .get('/preferences')
    .reply(200, {
      remoteOnly: false,
      willingToRelocate: true,
      noticePeriod: '2 weeks',
    });

  nock(baseURL)
    .persist()
    .patch('/preferences')
    .reply(200, (uri, requestBody: any) => ({
      ...requestBody,
    }));

  nock(baseURL)
    .persist()
    .get('/preferences/job-types')
    .reply(200, { types: ['full-time'] });

  nock(baseURL)
    .persist()
    .patch('/preferences/job-types')
    .reply(200, (uri, requestBody: any) => requestBody);

  nock(baseURL)
    .persist()
    .get('/preferences/salary')
    .reply(200, { minimum: 80000, preferred: 120000, currency: 'USD' });

  nock(baseURL)
    .persist()
    .patch('/preferences/salary')
    .reply(200, (uri, requestBody: any) => requestBody);

  nock(baseURL)
    .persist()
    .get('/preferences/locations')
    .reply(200, { locations: [] });

  nock(baseURL)
    .persist()
    .patch('/preferences/locations')
    .reply(200, (uri, requestBody: any) => requestBody);

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'user-service' });
}

/**
 * Job Service Mocks
 */
export function setupJobMocks(): void {
  const baseURL = config.jobServiceUrl;

  // Create job
  nock(baseURL)
    .persist()
    .post('/jobs')
    .reply(201, (uri, requestBody: any) => ({
      id: `job-${Date.now()}`,
      ...requestBody,
      createdAt: new Date().toISOString(),
    }));

  // List jobs
  nock(baseURL)
    .persist()
    .get('/jobs')
    .reply(200, {
      jobs: [
        {
          id: 'job-1',
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          salary: { min: 100000, max: 150000 },
          remote: true,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

  // Get job by ID
  nock(baseURL)
    .persist()
    .get(/\/jobs\/[^/]+$/)
    .reply(200, (uri) => ({
      id: uri.split('/').pop(),
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'Looking for a talented engineer',
      location: 'San Francisco, CA',
      salary: { min: 100000, max: 150000 },
      remote: true,
      skills: ['TypeScript', 'Node.js', 'React'],
      createdAt: new Date().toISOString(),
    }));

  // Search jobs
  nock(baseURL)
    .persist()
    .get(/\/jobs\/search.*/)
    .reply(200, { jobs: [], total: 0 });

  // Save job
  nock(baseURL)
    .persist()
    .post(/\/jobs\/.*\/save/)
    .reply(200, { saved: true });

  // Unsave job
  nock(baseURL)
    .persist()
    .delete(/\/jobs\/.*\/save/)
    .reply(200, { saved: false });

  // Get saved jobs
  nock(baseURL)
    .persist()
    .get('/jobs/saved')
    .reply(200, { jobs: [], total: 0 });

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'job-service' });
}

/**
 * Resume Service Mocks
 */
export function setupResumeMocks(): void {
  const baseURL = config.resumeServiceUrl;

  // Create resume
  nock(baseURL)
    .persist()
    .post('/resumes')
    .reply(201, (uri, requestBody: any) => ({
      id: `resume-${Date.now()}`,
      ...requestBody,
      createdAt: new Date().toISOString(),
    }));

  // List resumes
  nock(baseURL)
    .persist()
    .get('/resumes')
    .reply(200, { resumes: [], total: 0 });

  // Get resume
  nock(baseURL)
    .persist()
    .get(/\/resumes\/[^/]+$/)
    .reply(200, (uri) => ({
      id: uri.split('/').pop(),
      name: 'My Resume',
      content: 'Resume content here',
      createdAt: new Date().toISOString(),
    }));

  // Update resume
  nock(baseURL)
    .persist()
    .patch(/\/resumes\/.*/)
    .reply(200, (uri, requestBody: any) => ({
      id: uri.split('/').pop(),
      ...requestBody,
    }));

  // Delete resume
  nock(baseURL)
    .persist()
    .delete(/\/resumes\/.*/)
    .reply(204);

  // Upload resume
  nock(baseURL)
    .persist()
    .post('/resumes/upload')
    .reply(201, {
      id: `resume-${Date.now()}`,
      name: 'uploaded-resume.pdf',
      createdAt: new Date().toISOString(),
    });

  // Parse resume
  nock(baseURL)
    .persist()
    .post('/resumes/parse')
    .reply(200, {
      name: 'Parsed Resume',
      skills: ['TypeScript', 'Node.js'],
      experience: [],
      education: [],
    });

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'resume-service' });
}

/**
 * Auto-Apply Service Mocks
 */
export function setupAutoApplyMocks(): void {
  const baseURL = config.autoApplyServiceUrl;

  // Create application
  nock(baseURL)
    .persist()
    .post('/applications')
    .reply(201, (uri, requestBody: any) => ({
      id: `app-${Date.now()}`,
      ...requestBody,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    }));

  // List applications
  nock(baseURL)
    .persist()
    .get('/applications')
    .reply(200, { applications: [], total: 0 });

  // Get application
  nock(baseURL)
    .persist()
    .get(/\/applications\/[^/]+$/)
    .reply(200, (uri) => ({
      id: uri.split('/').pop(),
      status: 'submitted',
      createdAt: new Date().toISOString(),
    }));

  // Withdraw application
  nock(baseURL)
    .persist()
    .post(/\/applications\/.*\/withdraw/)
    .reply(200, { status: 'withdrawn' });

  // Create campaign
  nock(baseURL)
    .persist()
    .post('/campaigns')
    .reply(201, (uri, requestBody: any) => ({
      id: `campaign-${Date.now()}`,
      ...requestBody,
      status: 'active',
      createdAt: new Date().toISOString(),
    }));

  // List campaigns
  nock(baseURL)
    .persist()
    .get('/campaigns')
    .reply(200, { campaigns: [], total: 0 });

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'auto-apply-service' });
}

/**
 * Analytics Service Mocks
 */
export function setupAnalyticsMocks(): void {
  const baseURL = config.analyticsServiceUrl;

  // Dashboard
  nock(baseURL)
    .persist()
    .get('/dashboard')
    .reply(200, {
      totalApplications: 10,
      interviews: 3,
      offers: 1,
      rejections: 2,
    });

  // Application stats
  nock(baseURL)
    .persist()
    .get('/stats/applications')
    .reply(200, {
      total: 10,
      byStatus: { submitted: 5, interview: 3, offer: 1, rejected: 1 },
    });

  // Job market trends
  nock(baseURL)
    .persist()
    .get('/trends')
    .reply(200, {
      topSkills: ['TypeScript', 'React', 'Node.js'],
      avgSalary: 120000,
    });

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'analytics-service' });
}

/**
 * Notification Service Mocks
 */
export function setupNotificationMocks(): void {
  const baseURL = config.notificationServiceUrl;

  // List notifications
  nock(baseURL)
    .persist()
    .get('/notifications')
    .reply(200, { notifications: [], total: 0, unread: 0 });

  // Get notification
  nock(baseURL)
    .persist()
    .get(/\/notifications\/[^/]+$/)
    .reply(200, (uri) => ({
      id: uri.split('/').pop(),
      type: 'info',
      message: 'Test notification',
      read: false,
      createdAt: new Date().toISOString(),
    }));

  // Mark as read
  nock(baseURL)
    .persist()
    .patch(/\/notifications\/.*\/read/)
    .reply(200, { read: true });

  // Mark all as read
  nock(baseURL)
    .persist()
    .patch('/notifications/read-all')
    .reply(200, { success: true });

  // Delete notification
  nock(baseURL)
    .persist()
    .delete(/\/notifications\/.*/)
    .reply(204);

  // Preferences
  nock(baseURL)
    .persist()
    .get('/notifications/preferences')
    .reply(200, { email: true, push: true, inApp: true });

  nock(baseURL)
    .persist()
    .patch('/notifications/preferences')
    .reply(200, (uri, requestBody: any) => requestBody);

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'notification-service' });
}

/**
 * AI Service Mocks
 */
export function setupAIMocks(): void {
  const baseURL = config.aiServiceUrl;

  // Resume optimization
  nock(baseURL)
    .persist()
    .post('/ai/resume/optimize')
    .reply(200, (uri, requestBody: any) => ({
      optimizedContent: requestBody.content + ' [Optimized]',
      improvements: [
        { type: 'keywords', description: 'Added relevant keywords' },
      ],
      score: { before: 70, after: 85 },
    }));

  // Resume analysis
  nock(baseURL)
    .persist()
    .post('/ai/resume/analyze')
    .reply(200, {
      atsScore: 85,
      suggestions: ['Add more quantifiable achievements'],
      keywords: { found: ['TypeScript'], missing: ['AWS'] },
    });

  // Job matching
  nock(baseURL)
    .persist()
    .post('/ai/match/jobs')
    .reply(200, (uri, requestBody: any) => ({
      matches: (requestBody.jobIds || []).map((id: string) => ({
        jobId: id,
        score: 0.85,
        reasons: ['Skills match'],
      })),
    }));

  // Recommendations
  nock(baseURL)
    .persist()
    .get(/\/ai\/recommendations.*/)
    .reply(200, {
      jobs: [
        { id: 'rec-1', title: 'Recommended Job', score: 0.9 },
      ],
    });

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'ai-service' });
}

export default setupAllMocks;
