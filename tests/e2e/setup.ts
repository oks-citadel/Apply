/**
 * E2E Test Setup
 * Configures the test environment for end-to-end API testing with mocked HTTP responses
 *
 * Environment Variables:
 * - E2E_USE_REAL_SERVICES: Set to 'true' to run against real local services
 * - E2E_AUTH_SERVICE_URL: Override auth service URL
 * - E2E_USER_SERVICE_URL: Override user service URL
 * - E2E_RESUME_SERVICE_URL: Override resume service URL
 * - E2E_JOB_SERVICE_URL: Override job service URL
 * - E2E_AUTO_APPLY_SERVICE_URL: Override auto-apply service URL
 * - E2E_ANALYTICS_SERVICE_URL: Override analytics service URL
 * - E2E_NOTIFICATION_SERVICE_URL: Override notification service URL
 * - E2E_PAYMENT_SERVICE_URL: Override payment service URL
 * - E2E_AI_SERVICE_URL: Override AI service URL
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import nock from "nock";
import { setupAllMocks, resetMockState } from "./mocks/api-mocks";

// Determine if we're running against real services or mocks
export const useRealServices = process.env.E2E_USE_REAL_SERVICES === 'true';

// Test configuration with environment variable overrides
export const config = {
  authServiceUrl: process.env.E2E_AUTH_SERVICE_URL || "http://localhost:8081",
  userServiceUrl: process.env.E2E_USER_SERVICE_URL || "http://localhost:8082",
  resumeServiceUrl: process.env.E2E_RESUME_SERVICE_URL || "http://localhost:8083",
  jobServiceUrl: process.env.E2E_JOB_SERVICE_URL || "http://localhost:8084",
  autoApplyServiceUrl: process.env.E2E_AUTO_APPLY_SERVICE_URL || "http://localhost:8085",
  analyticsServiceUrl: process.env.E2E_ANALYTICS_SERVICE_URL || "http://localhost:8086",
  notificationServiceUrl: process.env.E2E_NOTIFICATION_SERVICE_URL || "http://localhost:8087",
  paymentServiceUrl: process.env.E2E_PAYMENT_SERVICE_URL || "http://localhost:8088",
  aiServiceUrl: process.env.E2E_AI_SERVICE_URL || "http://localhost:8089",
  testEmail: process.env.E2E_TEST_EMAIL || "e2e-test@example.com",
  testPassword: process.env.E2E_TEST_PASSWORD || "TestPassword123!",
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
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  userId: "mock-user-id-123",
};

// Create axios instances for each service
export const createApiClient = (baseURL: string, withAuth = true): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (withAuth) {
    client.interceptors.request.use((config) => {
      // Only add auth header if not explicitly set (including empty string)
      // Check if Authorization was explicitly set in the request
      const explicitlySet = config.headers && 'Authorization' in config.headers;
      if (!explicitlySet && testState.accessToken) {
        config.headers.Authorization = `Bearer ${testState.accessToken}`;
      }
      return config;
    });
  }

  return client;
};

// Service clients (with authentication)
export const authClient = createApiClient(config.authServiceUrl, false);
export const authClientWithAuth = createApiClient(config.authServiceUrl);
export const userClient = createApiClient(config.userServiceUrl);
export const resumeClient = createApiClient(config.resumeServiceUrl);
export const jobClient = createApiClient(config.jobServiceUrl);
export const autoApplyClient = createApiClient(config.autoApplyServiceUrl);
export const analyticsClient = createApiClient(config.analyticsServiceUrl);
export const notificationClient = createApiClient(config.notificationServiceUrl);
export const aiClient = createApiClient(config.aiServiceUrl);
export const paymentClient = createApiClient(config.paymentServiceUrl);

// Service clients (without authentication - for testing unauth scenarios)
export const userClientNoAuth = createApiClient(config.userServiceUrl, false);
export const resumeClientNoAuth = createApiClient(config.resumeServiceUrl, false);
export const jobClientNoAuth = createApiClient(config.jobServiceUrl, false);

// Helper functions
export async function login(email: string, password: string): Promise<void> {
  const response = await authClient.post("/auth/login", { email, password });
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
  const response = await authClient.post("/auth/register", data);
  testState.accessToken = response.data.accessToken;
  testState.refreshToken = response.data.refreshToken;
  testState.userId = response.data.user.id;
}

export async function logout(): Promise<void> {
  await authClientWithAuth.post("/auth/logout");
  testState.accessToken = "";
  testState.refreshToken = "";
  testState.userId = "";
}

/**
 * Reset test state to initial values
 */
export function resetTestState(): void {
  testState.accessToken = "mock-access-token";
  testState.refreshToken = "mock-refresh-token";
  testState.userId = "mock-user-id-123";
  testState.testJobId = undefined;
  testState.testResumeId = undefined;
  testState.testApplicationId = undefined;
}

/**
 * Wait for a condition with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  options: { timeout?: number; interval?: number; message?: string } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, message = "Condition not met" } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout: ${message}`);
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; delay?: number; backoffMultiplier?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoffMultiplier = 2 } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(backoffMultiplier, attempt - 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Check if a service is healthy
 */
export async function isServiceHealthy(serviceUrl: string): Promise<boolean> {
  try {
    const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Wait for all services to be healthy
 */
export async function waitForServices(timeout = 30000): Promise<void> {
  const services = [
    { name: "Auth", url: config.authServiceUrl },
    { name: "User", url: config.userServiceUrl },
    { name: "Resume", url: config.resumeServiceUrl },
    { name: "Job", url: config.jobServiceUrl },
    { name: "AutoApply", url: config.autoApplyServiceUrl },
    { name: "Analytics", url: config.analyticsServiceUrl },
    { name: "Notification", url: config.notificationServiceUrl },
    { name: "AI", url: config.aiServiceUrl },
  ];

  const startTime = Date.now();

  for (const service of services) {
    while (Date.now() - startTime < timeout) {
      if (await isServiceHealthy(service.url)) {
        console.log(`  [OK] ${service.name} service is healthy`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!(await isServiceHealthy(service.url))) {
      throw new Error(`${service.name} service failed to become healthy within ${timeout}ms`);
    }
  }
}

// Increase Jest timeout for E2E tests
jest.setTimeout(60000);

// Global setup
beforeAll(async () => {
  if (useRealServices) {
    console.log("E2E Test Suite starting with REAL services...");
    console.log("Waiting for services to be healthy...");
    await waitForServices();
    console.log("All services are healthy!");
  } else {
    // Restore nock to clean state
    nock.restore();
    nock.cleanAll();
    // Activate nock
    nock.activate();
    // Disable all network connections first
    nock.disableNetConnect();
    // Set up the mocks (nock will intercept these specific hosts)
    setupAllMocks();
    console.log("E2E Test Suite starting with mocked HTTP...");
  }
});

// Global teardown
afterAll(async () => {
  if (!useRealServices) {
    nock.cleanAll();
    nock.enableNetConnect();
  }
  console.log("E2E Test Suite complete");
});

// Reset state before each test
beforeEach(() => {
  if (!useRealServices) {
    // Clean up all existing mocks
    nock.cleanAll();
    // Restore the network block
    nock.disableNetConnect();
    // Reset mock internal state
    resetMockState();
    // Set up fresh mocks
    setupAllMocks();
  }
  resetTestState();
});

// Clean up after each test
afterEach(() => {
  // Clear any pending timers
  jest.clearAllTimers();
  // Ensure all nock interceptors are cleaned
  if (!useRealServices) {
    nock.cleanAll();
  }
});

