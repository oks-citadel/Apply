/**
 * E2E Test Setup
 * Configures the test environment for end-to-end API testing with mocked HTTP responses
 */

import axios, { AxiosInstance } from "axios";
import nock from "nock";
import { setupAllMocks } from "./mocks/api-mocks";

// Test configuration
export const config = {
  authServiceUrl: "http://localhost:3001",
  userServiceUrl: "http://localhost:8002",
  resumeServiceUrl: "http://localhost:8003",
  jobServiceUrl: "http://localhost:8004",
  autoApplyServiceUrl: "http://localhost:8005",
  analyticsServiceUrl: "http://localhost:8006",
  notificationServiceUrl: "http://localhost:8007",
  aiServiceUrl: "http://localhost:8000",
  testEmail: "e2e-test@example.com",
  testPassword: "TestPassword123!",
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
      if (testState.accessToken) {
        config.headers.Authorization = `Bearer ${testState.accessToken}`;
      }
      return config;
    });
  }

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

// Increase Jest timeout for E2E tests
jest.setTimeout(60000);

// Global setup
beforeAll(async () => {
  nock.disableNetConnect();
  setupAllMocks();
  console.log("E2E Test Suite starting with mocked HTTP...");
});

// Global teardown
afterAll(async () => {
  nock.cleanAll();
  nock.enableNetConnect();
  console.log("E2E Test Suite complete");
});

// Reset mocks before each test to ensure fresh state
beforeEach(() => {
  nock.cleanAll();
  setupAllMocks();
});

