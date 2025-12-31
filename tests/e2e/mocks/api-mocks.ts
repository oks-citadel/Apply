/**
 * API Mocks for E2E Tests
 * Sets up nock interceptors for all service endpoints
 * Provides both success and error response mocks for comprehensive testing
 */

import nock from 'nock';
import { config, testState } from '../setup';

// Track registered users for duplicate detection
const registeredEmails = new Set<string>();
// Track authenticated sessions
const activeSessions = new Map<string, { userId: string; email: string }>();
// Track valid refresh tokens
const validRefreshTokens = new Set<string>();

/**
 * Reset mock state (call this in beforeEach)
 */
export function resetMockState(): void {
  registeredEmails.clear();
  activeSessions.clear();
  validRefreshTokens.clear();
}

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
  setupPaymentMocks();
}

/**
 * Helper to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper to validate password strength
 */
function isValidPassword(password: string): boolean {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Helper to extract Bearer token from authorization header
 */
function extractToken(headers: Record<string, string | string[] | undefined>): string | null {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) return null;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (headerValue?.startsWith('Bearer ')) {
    return headerValue.substring(7);
  }
  return null;
}

/**
 * Auth Service Mocks
 */
export function setupAuthMocks(): void {
  const baseURL = config.authServiceUrl;

  // Register - with validation
  nock(baseURL)
    .persist()
    .post('/auth/register')
    .reply(function(uri, requestBody: any) {
      // Validate required fields
      if (!requestBody.email || !requestBody.password || !requestBody.firstName || !requestBody.lastName) {
        return [400, { statusCode: 400, message: 'Missing required fields', error: 'Bad Request' }];
      }

      // Validate email format
      if (!isValidEmail(requestBody.email)) {
        return [400, { statusCode: 400, message: 'Invalid email format', error: 'Bad Request' }];
      }

      // Validate password strength
      if (!isValidPassword(requestBody.password)) {
        return [400, { statusCode: 400, message: 'Password too weak', error: 'Bad Request' }];
      }

      // Check for duplicate email
      if (registeredEmails.has(requestBody.email)) {
        return [409, { statusCode: 409, message: 'Email already registered', error: 'Conflict' }];
      }

      // Register the user
      registeredEmails.add(requestBody.email);
      const userId = `user-${Date.now()}`;
      const accessToken = `mock-access-token-${Date.now()}`;
      const refreshToken = `mock-refresh-token-${Date.now()}`;

      // Store session and refresh token
      activeSessions.set(accessToken, { userId, email: requestBody.email });
      validRefreshTokens.add(refreshToken);

      return [201, {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        user: {
          id: userId,
          email: requestBody.email,
          firstName: requestBody.firstName,
          lastName: requestBody.lastName,
          createdAt: new Date().toISOString(),
        },
      }];
    });

  // Login - with validation
  nock(baseURL)
    .persist()
    .post('/auth/login')
    .reply(function(uri, requestBody: any) {
      // Validate required fields
      if (!requestBody.email || !requestBody.password) {
        return [400, { statusCode: 400, message: 'Email and password are required', error: 'Bad Request' }];
      }

      // Check if user exists (for mock purposes, allow any registered email or test email)
      const isTestUser = requestBody.email === config.testEmail;
      const isRegistered = registeredEmails.has(requestBody.email);

      if (!isTestUser && !isRegistered) {
        return [401, { statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' }];
      }

      // For mock purposes, validate password matches expected pattern
      // In real tests, we'll assume correct password if it's the test password
      if (requestBody.password !== config.testPassword && !isValidPassword(requestBody.password)) {
        return [401, { statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' }];
      }

      const userId = `user-${Date.now()}`;
      const accessToken = `mock-access-token-${Date.now()}`;
      const refreshToken = `mock-refresh-token-${Date.now()}`;

      // Store session and refresh token
      activeSessions.set(accessToken, { userId, email: requestBody.email });
      validRefreshTokens.add(refreshToken);

      return [200, {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        user: {
          id: userId,
          email: requestBody.email,
        },
      }];
    });

  // Me endpoint - with auth validation
  nock(baseURL)
    .persist()
    .get('/auth/me')
    .reply(function() {
      const token = extractToken(this.req.headers as Record<string, string | string[] | undefined>);

      if (!token) {
        return [401, { statusCode: 401, message: 'No token provided', error: 'Unauthorized' }];
      }

      // Check if it's a valid mock token or session token
      const session = activeSessions.get(token);
      if (!session && !token.startsWith('mock-access-token')) {
        return [401, { statusCode: 401, message: 'Invalid token', error: 'Unauthorized' }];
      }

      return [200, {
        id: session?.userId || testState.userId,
        email: session?.email || config.testEmail,
      }];
    });

  // Refresh - with validation
  nock(baseURL)
    .persist()
    .post('/auth/refresh')
    .reply(function(uri, requestBody: any) {
      const refreshToken = requestBody.refreshToken;

      if (!refreshToken) {
        return [400, { statusCode: 400, message: 'Refresh token required', error: 'Bad Request' }];
      }

      // Check if it's a valid mock refresh token
      if (!refreshToken.startsWith('mock-refresh-token') && !validRefreshTokens.has(refreshToken)) {
        return [401, { statusCode: 401, message: 'Invalid refresh token', error: 'Unauthorized' }];
      }

      const newAccessToken = `mock-access-token-${Date.now()}`;

      return [200, {
        accessToken: newAccessToken,
        expiresIn: 3600,
      }];
    });

  // Logout - with auth validation
  nock(baseURL)
    .persist()
    .post('/auth/logout')
    .reply(function() {
      const token = extractToken(this.req.headers as Record<string, string | string[] | undefined>);

      if (token) {
        activeSessions.delete(token);
      }

      return [204, null];
    });

  // Forgot password - always returns 200 for security
  nock(baseURL)
    .persist()
    .post('/auth/forgot-password')
    .reply(200, { success: true, message: 'If the email exists, a reset link has been sent' });

  // Reset password
  nock(baseURL)
    .persist()
    .post('/auth/reset-password')
    .reply(function(uri, requestBody: any) {
      if (!requestBody.token || !requestBody.newPassword) {
        return [400, { statusCode: 400, message: 'Token and new password required', error: 'Bad Request' }];
      }

      if (!isValidPassword(requestBody.newPassword)) {
        return [400, { statusCode: 400, message: 'Password too weak', error: 'Bad Request' }];
      }

      return [200, { success: true }];
    });

  // Verify email
  nock(baseURL)
    .persist()
    .get(/\/auth\/verify-email.*/)
    .reply(200, { success: true, verified: true });

  // Change password - with auth validation
  nock(baseURL)
    .persist()
    .patch('/auth/change-password')
    .reply(function(uri, requestBody: any) {
      const token = extractToken(this.req.headers as Record<string, string | string[] | undefined>);

      if (!token) {
        return [401, { statusCode: 401, message: 'No token provided', error: 'Unauthorized' }];
      }

      if (!requestBody.currentPassword || !requestBody.newPassword) {
        return [400, { statusCode: 400, message: 'Current and new password required', error: 'Bad Request' }];
      }

      // Mock: validate current password matches expected
      if (requestBody.currentPassword !== config.testPassword && !isValidPassword(requestBody.currentPassword)) {
        return [401, { statusCode: 401, message: 'Current password is incorrect', error: 'Unauthorized' }];
      }

      if (!isValidPassword(requestBody.newPassword)) {
        return [400, { statusCode: 400, message: 'New password too weak', error: 'Bad Request' }];
      }

      return [200, { success: true }];
    });

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

  // Profile endpoints - with auth validation
  nock(baseURL)
    .persist()
    .get('/profile')
    .reply(function() {
      const token = extractToken(this.req.headers as Record<string, string | string[] | undefined>);
      if (!token) {
        return [401, { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }];
      }
      return [200, {
        userId: testState.userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        headline: '',
        summary: '',
        location: '',
      }];
    });

  nock(baseURL)
    .persist()
    .patch('/profile')
    .reply(function(uri, requestBody: any) {
      const token = extractToken(this.req.headers as Record<string, string | string[] | undefined>);
      if (!token) {
        return [401, { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }];
      }

      // Validate URL fields (check both naming conventions)
      const websiteUrl = requestBody.website || requestBody.websiteUrl || requestBody.portfolioUrl;
      const linkedinUrl = requestBody.linkedin || requestBody.linkedinUrl;
      const githubUrl = requestBody.github || requestBody.githubUrl;

      if (websiteUrl && !websiteUrl.startsWith('http')) {
        return [400, { statusCode: 400, message: 'Invalid URL format', error: 'Bad Request' }];
      }
      if (linkedinUrl && !linkedinUrl.startsWith('http')) {
        return [400, { statusCode: 400, message: 'Invalid LinkedIn URL format', error: 'Bad Request' }];
      }
      if (githubUrl && !githubUrl.startsWith('http')) {
        return [400, { statusCode: 400, message: 'Invalid GitHub URL format', error: 'Bad Request' }];
      }

      return [200, {
        userId: testState.userId,
        ...requestBody,
      }];
    });

  nock(baseURL)
    .persist()
    .get('/profile/completion')
    .reply(200, { percentage: 65, missingFields: ['headline', 'summary'] });

  // Career experience - with validation
  nock(baseURL)
    .persist()
    .post('/career/experience')
    .reply(function(uri, requestBody: any) {
      // Validate required fields
      if (!requestBody.company) {
        return [400, { statusCode: 400, message: 'Company is required', error: 'Bad Request' }];
      }
      if (!requestBody.title) {
        return [400, { statusCode: 400, message: 'Job title is required', error: 'Bad Request' }];
      }

      return [201, {
        id: `exp-${Date.now()}`,
        ...requestBody,
        createdAt: new Date().toISOString(),
      }];
    });

  nock(baseURL)
    .persist()
    .get('/career/experience')
    .reply(200, [
      {
        id: 'exp-1',
        company: 'Test Company',
        title: 'Software Engineer',
        startDate: '2020-01-01',
        endDate: null,
        current: true,
        description: 'Working on cool stuff',
      },
    ]);

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
 * Job Service Mocks
 */
export function setupJobMocks(): void {
  const baseURL = config.jobServiceUrl;

  const mockJobs = [
    {
      id: 'job-1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'Looking for a talented engineer to join our team',
      location: 'San Francisco, CA',
      salary: { min: 100000, max: 150000 },
      remote: true,
      type: 'full-time',
      skills: ['TypeScript', 'Node.js', 'React'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-2',
      title: 'Senior Developer',
      company: 'StartUp Inc',
      description: 'Building next-gen products',
      location: 'Remote',
      salary: { min: 120000, max: 180000 },
      remote: true,
      type: 'full-time',
      skills: ['Python', 'Django', 'AWS'],
      createdAt: new Date().toISOString(),
    },
  ];

  // Create job
  nock(baseURL)
    .persist()
    .post('/jobs')
    .reply(201, (uri, requestBody: any) => ({
      id: `job-${Date.now()}`,
      ...requestBody,
      createdAt: new Date().toISOString(),
    }));

  // List jobs - return with data/meta format
  nock(baseURL)
    .persist()
    .get('/jobs')
    .reply(200, (uri) => {
      const url = new URL(uri, 'http://localhost');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      return {
        data: mockJobs.slice(0, limit),
        meta: {
          total: mockJobs.length,
          page,
          limit,
          totalPages: Math.ceil(mockJobs.length / limit),
        },
      };
    });

  // Search jobs
  nock(baseURL)
    .persist()
    .get(/\/jobs\/search.*/)
    .reply(200, {
      data: mockJobs,
      meta: { total: mockJobs.length, page: 1, limit: 20 },
    });

  // Get saved jobs - return as array
  nock(baseURL)
    .persist()
    .get('/jobs/saved')
    .reply(200, [mockJobs[0]]);

  // Check if job is saved
  nock(baseURL)
    .persist()
    .get(/\/jobs\/saved\/check\/[^/]+$/)
    .reply(200, { isSaved: true });

  // Save job
  nock(baseURL)
    .persist()
    .post(/\/jobs\/saved\/[^/]+$/)
    .reply(201, { success: true });

  // Unsave job
  nock(baseURL)
    .persist()
    .delete(/\/jobs\/saved\/[^/]+$/)
    .reply(204);

  // Get job alerts
  nock(baseURL)
    .persist()
    .get('/jobs/alerts')
    .reply(200, [
      {
        id: 'alert-1',
        name: 'Software Engineer Jobs',
        keywords: ['software', 'engineer'],
        location: 'remote',
        frequency: 'daily',
        enabled: true,
      },
    ]);

  // Create job alert
  nock(baseURL)
    .persist()
    .post('/jobs/alerts')
    .reply(201, (uri, requestBody: any) => ({
      id: `alert-${Date.now()}`,
      ...requestBody,
      enabled: true,
      createdAt: new Date().toISOString(),
    }));

  // Update job alert
  nock(baseURL)
    .persist()
    .patch(/\/jobs\/alerts\/[^/]+$/)
    .reply(200, (uri, requestBody: any) => ({
      id: uri.split('/').pop(),
      ...requestBody,
      updatedAt: new Date().toISOString(),
    }));

  // Toggle job alert
  nock(baseURL)
    .persist()
    .post(/\/jobs\/alerts\/[^/]+\/toggle$/)
    .reply(200, { enabled: false });

  // Delete job alert
  nock(baseURL)
    .persist()
    .delete(/\/jobs\/alerts\/[^/]+$/)
    .reply(204);

  // Get similar jobs
  nock(baseURL)
    .persist()
    .get(/\/jobs\/[^/]+\/similar$/)
    .reply(200, [mockJobs[1]]);

  // Get job by ID (must be after more specific routes)
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

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'job-service' });

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
 * Resume Service Mocks
 */
export function setupResumeMocks(): void {
  const baseURL = config.resumeServiceUrl;

  // Create resume - with validation
  nock(baseURL)
    .persist()
    .post('/resumes')
    .reply(function(uri, requestBody: any) {
      // Validate required fields
      if (!requestBody.name) {
        return [400, { statusCode: 400, message: 'Resume name is required', error: 'Bad Request' }];
      }

      const token = extractToken(this.req.headers as Record<string, string | string[] | undefined>);
      if (!token) {
        return [401, { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }];
      }

      return [201, {
        id: `resume-${Date.now()}`,
        ...requestBody,
        createdAt: new Date().toISOString(),
      }];
    });

  // List resumes - with auth check
  nock(baseURL)
    .persist()
    .get('/resumes')
    .reply(function() {
      const token = extractToken(this.req.headers as Record<string, string | string[] | undefined>);
      if (!token) {
        return [401, { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }];
      }
      return [200, []];
    });

  // Get resume templates
  nock(baseURL)
    .persist()
    .get('/resumes/templates')
    .reply(200, [
      { id: 'professional', name: 'Professional', description: 'Clean professional template' },
      { id: 'modern', name: 'Modern', description: 'Modern design template' },
      { id: 'creative', name: 'Creative', description: 'Creative colorful template' },
    ]);

  // Get resume preview
  nock(baseURL)
    .persist()
    .get(/\/resumes\/[^/]+\/preview$/)
    .reply(200, (uri) => ({
      id: uri.split('/')[2],
      html: '<div class="resume-preview">Preview content</div>',
    }));

  // Export resume as PDF
  nock(baseURL)
    .persist()
    .get(/\/resumes\/[^/]+\/export\/pdf$/)
    .reply(200, Buffer.from('%PDF-1.4 mock pdf content'), {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
    });

  // Duplicate resume
  nock(baseURL)
    .persist()
    .post(/\/resumes\/[^/]+\/duplicate$/)
    .reply(201, (uri) => ({
      id: `resume-${Date.now()}`,
      name: 'My Resume (Copy)',
      createdAt: new Date().toISOString(),
    }));

  // Set resume as default
  nock(baseURL)
    .persist()
    .patch(/\/resumes\/[^/]+\/default$/)
    .reply(200, (uri) => ({
      id: uri.split('/')[2],
      isDefault: true,
    }));

  // AI enhance resume
  nock(baseURL)
    .persist()
    .post(/\/resumes\/[^/]+\/ai\/enhance$/)
    .reply(200, (uri) => ({
      id: uri.split('/')[2],
      sections: {
        experience: [{ company: 'Enhanced Corp', title: 'Senior Developer' }],
        skills: ['TypeScript', 'React', 'Node.js'],
      },
      improvements: ['Improved bullet points', 'Added action verbs'],
    }));

  // AI suggestions for resume
  nock(baseURL)
    .persist()
    .post(/\/resumes\/[^/]+\/ai\/suggestions$/)
    .reply(200, {
      suggestions: [
        { type: 'skill', text: 'Consider adding cloud technologies' },
        { type: 'experience', text: 'Quantify your achievements with metrics' },
      ],
    });

  // AI tailor resume for job
  nock(baseURL)
    .persist()
    .post(/\/resumes\/[^/]+\/ai\/tailor$/)
    .reply(200, (uri, requestBody: any) => ({
      id: uri.split('/')[2],
      tailoredFor: requestBody.jobId,
      sections: {
        skills: ['TypeScript', 'React', 'Node.js'],
      },
      matchScore: 0.85,
    }));

  // Get resume by ID
  nock(baseURL)
    .persist()
    .get(/\/resumes\/[^/]+$/)
    .reply(200, (uri) => ({
      id: uri.split('/').pop(),
      name: 'My Resume',
      template: 'professional',
      sections: {
        skills: ['JavaScript', 'TypeScript'],
        experience: [],
        education: [],
      },
      createdAt: new Date().toISOString(),
    }));

  // Update resume
  nock(baseURL)
    .persist()
    .patch(/\/resumes\/[^/]+$/)
    .reply(200, (uri, requestBody: any) => ({
      id: uri.split('/').pop(),
      name: requestBody.name || 'My Resume',
      template: 'professional',
      sections: requestBody.sections || {},
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
 * Analytics Service Mocks
 */
export function setupAnalyticsMocks(): void {
  const baseURL = config.analyticsServiceUrl;

  // Dashboard
  nock(baseURL)
    .persist()
    .get('/analytics/dashboard')
    .reply(200, {
      totalApplications: 10,
      activeApplications: 5,
      interviews: 3,
      offers: 1,
      rejections: 2,
    });

  // Dashboard summary
  nock(baseURL)
    .persist()
    .get('/analytics/dashboard/summary')
    .reply(200, {
      totalApplications: 10,
      weeklyChange: 5,
      successRate: 0.15,
    });

  // Application analytics
  nock(baseURL)
    .persist()
    .get(/\/analytics\/applications.*/)
    .reply(200, {
      data: [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 3 },
      ],
      total: 8,
    });

  // Application trends
  nock(baseURL)
    .persist()
    .get('/analytics/applications/trends')
    .reply(200, {
      trends: [
        { period: 'week1', count: 10 },
        { period: 'week2', count: 15 },
      ],
    });

  // Application conversion
  nock(baseURL)
    .persist()
    .get('/analytics/applications/conversion')
    .reply(200, {
      applied: 100,
      interviewed: 20,
      offered: 5,
      accepted: 2,
      conversionRates: {
        applicationToInterview: 0.20,
        interviewToOffer: 0.25,
        offerToAccept: 0.40,
      },
    });

  // Job market insights
  nock(baseURL)
    .persist()
    .get('/analytics/jobs/market')
    .reply(200, {
      topSkills: ['TypeScript', 'React', 'Node.js', 'Python', 'AWS'],
      topLocations: ['Remote', 'San Francisco', 'New York'],
      avgSalary: 120000,
      jobGrowth: 0.15,
    });

  // Salary data
  nock(baseURL)
    .persist()
    .get(/\/analytics\/jobs\/salary.*/)
    .reply(200, {
      average: 125000,
      median: 120000,
      min: 80000,
      max: 200000,
      percentiles: {
        p25: 95000,
        p50: 120000,
        p75: 150000,
      },
    });

  // Reports - list
  nock(baseURL)
    .persist()
    .get('/analytics/reports')
    .reply(200, [
      {
        id: 'report-1',
        name: 'Weekly Summary',
        type: 'weekly',
        createdAt: new Date().toISOString(),
      },
    ]);

  // Reports - create
  nock(baseURL)
    .persist()
    .post('/analytics/reports')
    .reply(201, (uri, requestBody: any) => ({
      id: `report-${Date.now()}`,
      ...requestBody,
      status: 'generating',
      createdAt: new Date().toISOString(),
    }));

  // Reports - get by ID
  nock(baseURL)
    .persist()
    .get(/\/analytics\/reports\/[^/]+$/)
    .reply(200, (uri) => ({
      id: uri.split('/').pop(),
      name: 'Weekly Summary',
      type: 'weekly',
      status: 'completed',
      data: { totalApplications: 10 },
      createdAt: new Date().toISOString(),
    }));

  // Reports - download
  nock(baseURL)
    .persist()
    .get(/\/analytics\/reports\/[^/]+\/download$/)
    .reply(200, Buffer.from('Report content'), {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="report.pdf"',
    });

  // Legacy paths (for backward compatibility)
  nock(baseURL)
    .persist()
    .get('/dashboard')
    .reply(200, {
      totalApplications: 10,
      interviews: 3,
      offers: 1,
      rejections: 2,
    });

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'analytics-service' });

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
 * Payment Service Mocks
 */
export function setupPaymentMocks(): void {
  const baseURL = config.paymentServiceUrl || 'http://localhost:8088';

  // Get subscription plans
  nock(baseURL)
    .persist()
    .get('/subscriptions/plans')
    .reply(200, [
      {
        id: 'plan-free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: ['5 applications/month', 'Basic resume builder'],
      },
      {
        id: 'plan-pro',
        name: 'Professional',
        price: 29.99,
        interval: 'month',
        features: ['Unlimited applications', 'AI resume optimization', 'Priority support'],
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        price: 99.99,
        interval: 'month',
        features: ['Everything in Pro', 'Team features', 'Custom integrations'],
      },
    ]);

  // Get current subscription
  nock(baseURL)
    .persist()
    .get('/subscriptions/current')
    .reply(200, {
      id: 'sub-1',
      planId: 'plan-free',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

  // Create subscription
  nock(baseURL)
    .persist()
    .post('/subscriptions')
    .reply(201, (uri, requestBody: any) => ({
      id: `sub-${Date.now()}`,
      planId: requestBody.planId,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

  // Cancel subscription
  nock(baseURL)
    .persist()
    .post('/subscriptions/cancel')
    .reply(200, {
      status: 'canceled',
      canceledAt: new Date().toISOString(),
    });

  // Payment methods
  nock(baseURL)
    .persist()
    .get('/payment-methods')
    .reply(200, []);

  nock(baseURL)
    .persist()
    .post('/payment-methods')
    .reply(201, (uri, requestBody: any) => ({
      id: `pm-${Date.now()}`,
      type: requestBody.type || 'card',
      last4: '4242',
      brand: 'visa',
      isDefault: true,
    }));

  nock(baseURL)
    .persist()
    .delete(/\/payment-methods\/.*/)
    .reply(204);

  // Invoices
  nock(baseURL)
    .persist()
    .get('/invoices')
    .reply(200, [
      {
        id: 'inv-1',
        amount: 29.99,
        status: 'paid',
        paidAt: new Date().toISOString(),
      },
    ]);

  // Health
  nock(baseURL)
    .persist()
    .get('/health')
    .reply(200, { status: 'ok', service: 'payment-service' });

  nock(baseURL)
    .persist()
    .get('/health/ready')
    .reply(200, { status: 'ok', ready: true });

  nock(baseURL)
    .persist()
    .get('/health/live')
    .reply(200, { status: 'ok', alive: true });
}

export default setupAllMocks;
