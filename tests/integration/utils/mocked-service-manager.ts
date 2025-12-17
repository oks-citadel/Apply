/**
 * Mocked Service Manager
 * Provides mocked HTTP responses for testing without live services
 */

import axios, { AxiosInstance } from 'axios';
import nock from 'nock';
import { logger } from './test-logger';
import { ServiceConfig } from './test-service-manager';

/**
 * Mocked Service Manager for testing without live services
 */
export class MockedServiceManager {
  private services: Map<string, AxiosInstance> = new Map();
  private readonly serviceConfigs: ServiceConfig[];

  constructor() {
    this.serviceConfigs = [
      { name: 'auth-service', baseURL: 'http://localhost:3001', port: 3001, healthEndpoint: '/api/v1/health' },
      { name: 'user-service', baseURL: 'http://localhost:8002', port: 8002, healthEndpoint: '/api/v1/health' },
      { name: 'job-service', baseURL: 'http://localhost:3003', port: 3003, healthEndpoint: '/api/v1/health' },
      { name: 'resume-service', baseURL: 'http://localhost:3004', port: 3004, healthEndpoint: '/api/v1/health' },
      { name: 'ai-service', baseURL: 'http://localhost:8000', port: 8000, healthEndpoint: '/health' },
      { name: 'notification-service', baseURL: 'http://localhost:3006', port: 3006, healthEndpoint: '/api/v1/health' },
      { name: 'auto-apply-service', baseURL: 'http://localhost:3007', port: 3007, healthEndpoint: '/api/v1/health' },
      { name: 'analytics-service', baseURL: 'http://localhost:3008', port: 3008, healthEndpoint: '/api/v1/health' },
      { name: 'orchestrator-service', baseURL: 'http://localhost:3009', port: 3009, healthEndpoint: '/api/v1/health' },
    ];
  }

  async initialize(): Promise<void> {
    logger.info('Initializing mocked service clients...');

    // Setup nock interceptors for all services
    this.setupNockInterceptors();

    for (const config of this.serviceConfigs) {
      const client = axios.create({
        baseURL: config.baseURL,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      this.services.set(config.name, client);
      logger.debug(`Created mocked client for ${config.name}`);
    }

    logger.info('Mocked service clients initialized');
  }

  private setupNockInterceptors(): void {
    // Setup persistent nock interceptors for health endpoints
    for (const config of this.serviceConfigs) {
      nock(config.baseURL)
        .persist()
        .get(config.healthEndpoint || '/health')
        .reply(200, { status: 'ok', service: config.name });
    }

    // Setup auth service mocks
    this.setupAuthServiceMocks();
    // Setup user service mocks
    this.setupUserServiceMocks();
    // Setup job service mocks
    this.setupJobServiceMocks();
    // Setup resume service mocks
    this.setupResumeServiceMocks();
    // Setup AI service mocks
    this.setupAIServiceMocks();
    // Setup notification service mocks
    this.setupNotificationServiceMocks();
    // Setup auto-apply service mocks
    this.setupAutoApplyServiceMocks();
  }

  private setupAuthServiceMocks(): void {
    const baseURL = 'http://localhost:3001';

    // Register
    nock(baseURL)
      .persist()
      .post('/api/v1/auth/register')
      .reply(201, (uri, requestBody: any) => ({
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        user: {
          id: `user-${Date.now()}`,
          email: requestBody.email,
          firstName: requestBody.firstName,
          lastName: requestBody.lastName,
        },
      }));

    // Login
    nock(baseURL)
      .persist()
      .post('/api/v1/auth/login')
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
      .get('/api/v1/auth/me')
      .reply(200, { id: 'mock-user-id', email: 'test@example.com' });

    // Refresh token
    nock(baseURL)
      .persist()
      .post('/api/v1/auth/refresh')
      .reply(200, { accessToken: `mock-new-access-token-${Date.now()}` });

    // Forgot password
    nock(baseURL)
      .persist()
      .post('/api/v1/auth/forgot-password')
      .reply(200, { success: true, message: 'Password reset email sent' });

    // Reset password
    nock(baseURL)
      .persist()
      .post('/api/v1/auth/reset-password')
      .reply(200, { success: true, message: 'Password reset successful' });

    // Verify email
    nock(baseURL)
      .persist()
      .post('/api/v1/auth/verify-email')
      .reply(200, { success: true, verified: true });

    // Logout
    nock(baseURL)
      .persist()
      .post('/api/v1/auth/logout')
      .reply(200, { success: true });
  }

  private setupUserServiceMocks(): void {
    const baseURL = 'http://localhost:8002';

    // Profile endpoints
    nock(baseURL)
      .persist()
      .get(/\/api\/v1\/profile\/.*/)
      .reply(200, (uri) => {
        const userId = uri.split('/').pop();
        return {
          userId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          bio: '',
          location: '',
        };
      });

    nock(baseURL)
      .persist()
      .patch(/\/api\/v1\/profile\/.*/)
      .reply(200, (uri, requestBody: any) => ({
        userId: uri.split('/').pop(),
        ...requestBody,
      }));

    // Preferences - GET
    nock(baseURL)
      .persist()
      .get(/\/api\/v1\/preferences\/.*/)
      .reply(200, {
        jobPreferences: { remote: true, locations: [], keywords: [] },
        notificationPreferences: { email: true, push: true },
      });

    // Preferences - PATCH
    nock(baseURL)
      .persist()
      .patch(/\/api\/v1\/preferences\/.*/)
      .reply(200, (uri, requestBody: any) => ({
        userId: uri.split('/').pop(),
        jobPreferences: { remote: true, locations: [], ...requestBody.jobPreferences },
        notificationPreferences: { email: true, push: true, ...requestBody.notificationPreferences },
      }));

    // Preferences - PUT
    nock(baseURL)
      .persist()
      .put(/\/api\/v1\/preferences\/.*/)
      .reply(200, (uri, requestBody: any) => ({
        userId: uri.split('/').pop(),
        ...requestBody,
      }));
  }

  private setupJobServiceMocks(): void {
    const baseURL = 'http://localhost:3003';

    nock(baseURL)
      .persist()
      .post('/api/v1/jobs')
      .reply(201, (uri, requestBody: any) => ({
        id: `job-${Date.now()}`,
        ...requestBody,
        createdAt: new Date().toISOString(),
      }));

    nock(baseURL)
      .persist()
      .get('/api/v1/jobs')
      .reply(200, { jobs: [], total: 0 });

    nock(baseURL)
      .persist()
      .get(/\/api\/v1\/jobs\/.*/)
      .reply(200, (uri) => ({
        id: uri.split('/').pop(),
        title: 'Mock Job',
        company: 'Mock Company',
        skills: ['TypeScript', 'Node.js'],
      }));
  }

  private setupResumeServiceMocks(): void {
    const baseURL = 'http://localhost:3004';

    nock(baseURL)
      .persist()
      .post('/api/v1/resumes')
      .reply(201, (uri, requestBody: any) => ({
        id: `resume-${Date.now()}`,
        ...requestBody,
        createdAt: new Date().toISOString(),
      }));

    nock(baseURL)
      .persist()
      .get(/\/api\/v1\/resumes\/.*/)
      .reply(200, (uri) => ({
        id: uri.split('/').pop(),
        content: 'Mock resume content',
        skills: ['TypeScript', 'Node.js'],
      }));

    nock(baseURL)
      .persist()
      .get('/api/v1/resumes')
      .reply(200, { resumes: [], total: 0 });
  }

  private setupAIServiceMocks(): void {
    const baseURL = 'http://localhost:8000';

    // Job matching
    nock(baseURL)
      .persist()
      .post('/api/ai/match/jobs')
      .reply(200, (uri, requestBody: any) => ({
        matches: (requestBody.jobIds || []).map((jobId: string) => ({
          jobId,
          score: Math.random() * 0.5 + 0.5,
          reasons: ['Skills match', 'Experience aligns'],
          matchingSkills: ['TypeScript', 'Node.js'],
          missingSkills: ['AWS'],
          recommendations: ['Consider learning AWS'],
        })),
      }));

    // Recommendations
    nock(baseURL)
      .persist()
      .get(/\/api\/ai\/match\/recommendations\/.*/)
      .reply(200, {
        recommendations: [
          { job: { id: 'rec-job-1', title: 'Recommended Job', remote: true }, score: 0.9 },
        ],
      });

    // Resume optimization - multiple endpoint patterns
    const resumeOptimizeHandler = (uri: string, requestBody: any) => ({
      originalContent: requestBody.content || 'Resume content',
      optimizedContent: (requestBody.content || 'Resume content') + ' [Optimized]',
      improvements: [
        { type: 'keyword_optimization', description: 'Added keywords', impact: 'high' },
      ],
      score: { before: 0.65, after: 0.85, improvement: 0.2 },
      optimizedResumeId: `optimized-${Date.now()}`,
    });

    nock(baseURL)
      .persist()
      .post('/api/ai/resume/optimize')
      .reply(200, resumeOptimizeHandler);

    nock(baseURL)
      .persist()
      .post('/api/ai/optimize/resume')
      .reply(200, resumeOptimizeHandler);

    // Resume analysis - multiple endpoint patterns
    const resumeAnalyzeHandler = () => ({
      atsScore: 85,
      score: 85,
      issues: [],
      suggestions: ['Add more quantifiable achievements'],
      keywords: { found: ['TypeScript'], missing: ['AWS'] },
      missingKeywords: ['AWS'],
      skillGap: { missing: ['AWS'], found: ['TypeScript', 'Node.js'] },
    });

    nock(baseURL)
      .persist()
      .post('/api/ai/resume/analyze')
      .reply(200, resumeAnalyzeHandler);

    nock(baseURL)
      .persist()
      .post('/api/ai/analyze/resume')
      .reply(200, resumeAnalyzeHandler);

    // Resume scoring
    nock(baseURL)
      .persist()
      .post('/api/ai/resume/score')
      .reply(200, () => ({
        score: 78,
        breakdown: {
          formatting: 85,
          content: 75,
          keywords: 70,
          overall: 78,
        },
        suggestions: ['Add more action verbs'],
      }));

    nock(baseURL)
      .persist()
      .post('/api/ai/score/resume')
      .reply(200, () => ({
        score: 78,
        breakdown: {
          formatting: 85,
          content: 75,
          keywords: 70,
          overall: 78,
        },
        suggestions: ['Add more action verbs'],
      }));

    // Resume compare
    nock(baseURL)
      .persist()
      .post('/api/ai/resume/compare')
      .reply(200, () => ({
        comparison: [
          { resumeId: 'resume-1', score: 75 },
          { resumeId: 'resume-2', score: 82 },
        ],
        winner: 'resume-2',
        differences: ['Resume 2 has better keyword optimization'],
      }));

    // Batch analysis
    nock(baseURL)
      .persist()
      .post('/api/ai/resume/batch-analyze')
      .reply(200, (uri, requestBody: any) => ({
        results: (requestBody.resumeIds || []).map((id: string) => ({
          resumeId: id,
          atsScore: Math.floor(Math.random() * 30) + 70,
          suggestions: ['Add quantifiable achievements'],
        })),
      }));

    // Interview prep
    nock(baseURL)
      .persist()
      .post('/api/ai/interview/prepare')
      .reply(200, () => ({
        questions: [
          { question: 'Tell me about yourself', category: 'behavioral' },
          { question: 'Why this role?', category: 'motivation' },
        ],
        tips: ['Research the company', 'Prepare STAR examples'],
      }));
  }

  private setupNotificationServiceMocks(): void {
    const baseURL = 'http://localhost:3006';

    // Create notification
    nock(baseURL)
      .persist()
      .post('/api/v1/notifications')
      .reply(201, (uri, requestBody: any) => ({
        id: `notification-${Date.now()}`,
        ...requestBody,
        status: 'sent',
      }));

    // Get notifications list
    nock(baseURL)
      .persist()
      .get('/api/v1/notifications')
      .reply(200, { notifications: [], total: 0 });

    // Get user notifications
    nock(baseURL)
      .persist()
      .get(/\/api\/v1\/notifications\/user\/.*/)
      .reply(200, () => ({
        notifications: [
          { id: 'notif-1', type: 'welcome', message: 'Welcome!', read: false },
        ],
        total: 1,
      }));

    // Get notification by ID
    nock(baseURL)
      .persist()
      .get(/\/api\/v1\/notifications\/[^/]+$/)
      .reply(200, (uri) => ({
        id: uri.split('/').pop(),
        type: 'info',
        message: 'Test notification',
        read: false,
        createdAt: new Date().toISOString(),
      }));

    // Mark notification as read
    nock(baseURL)
      .persist()
      .patch(/\/api\/v1\/notifications\/.*\/read/)
      .reply(200, { success: true, read: true });

    nock(baseURL)
      .persist()
      .post(/\/api\/v1\/notifications\/.*\/read/)
      .reply(200, { success: true, read: true });

    // Delete notification
    nock(baseURL)
      .persist()
      .delete(/\/api\/v1\/notifications\/.*/)
      .reply(204);

    // Trigger notifications (daily digest, etc.)
    nock(baseURL)
      .persist()
      .post(/\/api\/v1\/notifications\/trigger\/.*/)
      .reply(200, { success: true, triggered: true });

    // Unread count
    nock(baseURL)
      .persist()
      .get(/\/api\/v1\/notifications\/unread.*/)
      .reply(200, { count: 5 });

    // Send via specific channel
    nock(baseURL)
      .persist()
      .post('/api/v1/notifications/send')
      .reply(200, (uri, requestBody: any) => ({
        id: `notification-${Date.now()}`,
        ...requestBody,
        status: 'sent',
        sentAt: new Date().toISOString(),
      }));
  }

  private setupAutoApplyServiceMocks(): void {
    const baseURL = 'http://localhost:3007';

    nock(baseURL)
      .persist()
      .post('/api/v1/auto-apply/campaigns')
      .reply(201, (uri, requestBody: any) => ({
        id: `campaign-${Date.now()}`,
        ...requestBody,
        status: 'active',
      }));

    nock(baseURL)
      .persist()
      .get('/api/v1/auto-apply/campaigns')
      .reply(200, { campaigns: [], total: 0 });
  }

  getService(serviceName: string): AxiosInstance {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }
    return service;
  }

  async waitForService(serviceName: string): Promise<boolean> {
    // Mocked services are always ready
    logger.info(`Mocked ${serviceName} is ready`);
    return true;
  }

  async waitForAllServices(): Promise<boolean> {
    logger.info('All mocked services are ready');
    return true;
  }

  async reinitializeMocks(): Promise<void> {
    // Clear existing mocks and reinitialize
    nock.cleanAll();
    this.setupNockInterceptors();
    logger.debug('Nock interceptors reinitialized');
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up mocked service clients...');
    nock.cleanAll();
    this.services.clear();
    logger.info('Mocked service clients cleaned up');
  }

  getConfig(serviceName: string): ServiceConfig | undefined {
    return this.serviceConfigs.find(s => s.name === serviceName);
  }

  getAllConfigs(): ServiceConfig[] {
    return [...this.serviceConfigs];
  }
}
