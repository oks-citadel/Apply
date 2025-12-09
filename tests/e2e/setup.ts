/**
 * E2E Test Setup
 * Configures the test environment for end-to-end API testing
 */

import axios, { AxiosInstance } from 'axios';

// Test configuration from environment
export const config = {
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:8002',
  resumeServiceUrl: process.env.RESUME_SERVICE_URL || 'http://localhost:8003',
  jobServiceUrl: process.env.JOB_SERVICE_URL || 'http://localhost:8004',
  autoApplyServiceUrl: process.env.AUTO_APPLY_SERVICE_URL || 'http://localhost:8005',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8006',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8007',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  testEmail: process.env.TEST_EMAIL || `e2e-test-${Date.now()}@example.com`,
  testPassword: process.env.TEST_PASSWORD || 'TestPassword123!',
};

// Global test state
export interface TestState {
  accessToken: string;
  refreshToken: string;
  userId: string;
  testJobId?: string;
  testResumeId?: string;
  testApplicationId?: string;
}

// Initialize global state
export const testState: TestState = {
  accessToken: '',
  refreshToken: '',
  userId: '',
};

// Create axios instances for each service
export const createApiClient = (baseURL: string, withAuth = true): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth interceptor
  if (withAuth) {
    client.interceptors.request.use((config) => {
      if (testState.accessToken) {
        config.headers.Authorization = `Bearer ${testState.accessToken}`;
      }
      return config;
    });
  }

  // Add response error handler
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        console.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Service clients
export const authClient = createApiClient(config.authServiceUrl, false);
export const authClientWithAuth = createApiClient(config.authServiceUrl);
export const userClient = createApiClient(config.userServiceUrl);
export const resumeClient = createApiClient(config.resumeServiceUrl);
export const jobClient = createApiClient(config.jobServiceUrl);
export const autoApplyClient = createApiClient(config.autoApplyServiceUrl);
export const analyticsClient = createApiClient(config.analyticsServiceUrl);
export const notificationClient = createApiClient(config.notificationServiceUrl);
export const aiClient = createApiClient(config.aiServiceUrl);

// Helper functions
export async function login(email: string, password: string): Promise<void> {
  const response = await authClient.post('/auth/login', { email, password });
  testState.accessToken = response.data.accessToken;
  testState.refreshToken = response.data.refreshToken;
  testState.userId = response.data.user.id;
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  const response = await authClient.post('/auth/register', data);
  testState.accessToken = response.data.accessToken;
  testState.refreshToken = response.data.refreshToken;
  testState.userId = response.data.user.id;
}

export async function logout(): Promise<void> {
  await authClientWithAuth.post('/auth/logout');
  testState.accessToken = '';
  testState.refreshToken = '';
  testState.userId = '';
}

// Increase Jest timeout for E2E tests
jest.setTimeout(60000);

// Global setup
beforeAll(async () => {
  console.log('E2E Test Suite starting...');
  console.log('Service URLs:');
  console.log(`  Auth: ${config.authServiceUrl}`);
  console.log(`  User: ${config.userServiceUrl}`);
  console.log(`  Resume: ${config.resumeServiceUrl}`);
  console.log(`  Job: ${config.jobServiceUrl}`);
  console.log(`  Auto-Apply: ${config.autoApplyServiceUrl}`);
  console.log(`  Analytics: ${config.analyticsServiceUrl}`);
  console.log(`  Notification: ${config.notificationServiceUrl}`);
  console.log(`  AI: ${config.aiServiceUrl}`);
});

// Global teardown
afterAll(async () => {
  console.log('E2E Test Suite complete');
  // Cleanup any test data if needed
  if (testState.accessToken) {
    try {
      await logout();
    } catch {
      // Ignore logout errors during cleanup
    }
  }
});
