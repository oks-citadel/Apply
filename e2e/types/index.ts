/**
 * Type definitions for E2E tests
 */

/**
 * Test user credentials
 */
export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  role?: 'user' | 'admin' | 'premium' | 'recruiter';
}

/**
 * Test user with authentication tokens
 */
export interface AuthenticatedTestUser extends TestUser {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
  };
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * Test environment configuration
 */
export interface TestEnvironment {
  baseUrl: string;
  apiUrl: string;
  databaseUrl: string;
  skipCleanup: boolean;
  headless: boolean;
  workers: number;
  timeout: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data?: T;
  error?: string;
  headers: Headers;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username?: string;
    role: string;
    status: string;
    isEmailVerified: boolean;
    isMfaEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Database table row
 */
export interface TableRow {
  [key: string]: any;
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  tables: Array<{
    name: string;
    rowCount: number;
  }>;
  totalRows: number;
}

/**
 * Test fixture data
 */
export interface TestFixture {
  users?: TestUser[];
  jobs?: any[];
  applications?: any[];
  resumes?: any[];
}

/**
 * Page object base interface
 */
export interface PageObject {
  goto(): Promise<void>;
  isLoaded(): Promise<boolean>;
}

/**
 * Test context
 */
export interface TestContext {
  user?: AuthenticatedTestUser;
  database?: {
    connection: any;
    tables: string[];
  };
  cleanup?: Array<() => Promise<void>>;
}

/**
 * Service endpoints
 */
export interface ServiceEndpoints {
  auth: string;
  user: string;
  job: string;
  resume: string;
  ai: string;
  notification: string;
  analytics: string;
  autoApply: string;
}

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  name: string;
  enabled: boolean;
  timeout?: number;
  retries?: number;
  parallel?: boolean;
}

/**
 * Database query result
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

/**
 * Test cleanup function
 */
export type CleanupFunction = () => Promise<void> | void;

/**
 * Test setup function
 */
export type SetupFunction = () => Promise<void> | void;

/**
 * Environment variable keys
 */
export enum EnvVar {
  TEST_DATABASE_URL = 'TEST_DATABASE_URL',
  TEST_API_URL = 'TEST_API_URL',
  BASE_URL = 'BASE_URL',
  SKIP_DB_CLEANUP = 'SKIP_DB_CLEANUP',
  HEADLESS = 'HEADLESS',
  WORKERS = 'WORKERS',
  TEST_TIMEOUT = 'TEST_TIMEOUT',
  CI = 'CI',
  DEBUG = 'DEBUG',
}

/**
 * Database table names
 */
export enum TableName {
  USERS = 'users',
  JOBS = 'jobs',
  APPLICATIONS = 'applications',
  RESUMES = 'resumes',
  PAYMENTS = 'payments',
  SUBSCRIPTIONS = 'subscriptions',
  AI_GENERATIONS = 'ai_generations',
  NOTIFICATIONS = 'notifications',
  ANALYTICS = 'analytics',
}

/**
 * User roles
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PREMIUM = 'premium',
  RECRUITER = 'recruiter',
  MODERATOR = 'moderator',
}

/**
 * User status
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * HTTP methods
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * Test result status
 */
export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  PENDING = 'pending',
}

/**
 * Browser types
 */
export enum BrowserType {
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
  WEBKIT = 'webkit',
}

/**
 * Assertion helpers type
 */
export interface AssertionHelpers {
  assertApiSuccess(response: ApiResponse, message?: string): void;
  assertApiStatus(response: ApiResponse, status: number, message?: string): void;
  assertApiData<T>(response: ApiResponse<T>): asserts response is ApiResponse<T> & { data: T };
  assertDatabaseRowExists(tableName: string, conditions: Record<string, any>): Promise<void>;
  assertDatabaseRowCount(tableName: string, expectedCount: number): Promise<void>;
}

/**
 * Database helpers type
 */
export interface DatabaseHelpers {
  clearTable(tableName: string): Promise<void>;
  clearTables(tableNames: string[]): Promise<void>;
  insertTestRecord<T>(tableName: string, data: Record<string, any>): Promise<T>;
  updateTestRecord<T>(tableName: string, id: string | number, data: Record<string, any>): Promise<T>;
  deleteTestRecord(tableName: string, id: string | number): Promise<void>;
  findRecords<T>(tableName: string, conditions?: Record<string, any>): Promise<T[]>;
  findOneRecord<T>(tableName: string, conditions: Record<string, any>): Promise<T | null>;
  executeQuery<T>(query: string, params?: any[]): Promise<T[]>;
  getTableRowCount(tableName: string): Promise<number>;
  recordExists(tableName: string, conditions: Record<string, any>): Promise<boolean>;
}

/**
 * API helpers type
 */
export interface ApiHelpers {
  apiGet<T>(endpoint: string, options?: any): Promise<ApiResponse<T>>;
  apiPost<T>(endpoint: string, data?: any, options?: any): Promise<ApiResponse<T>>;
  apiPut<T>(endpoint: string, data?: any, options?: any): Promise<ApiResponse<T>>;
  apiPatch<T>(endpoint: string, data?: any, options?: any): Promise<ApiResponse<T>>;
  apiDelete<T>(endpoint: string, options?: any): Promise<ApiResponse<T>>;
  createTestUser(overrides?: Partial<TestUser>): Promise<AuthenticatedTestUser>;
  deleteTestUser(email: string, token: string): Promise<void>;
  waitForApi(maxAttempts?: number, interval?: number): Promise<boolean>;
}

/**
 * Test utilities
 */
export interface TestUtilities {
  database: DatabaseHelpers;
  api: ApiHelpers;
  assertions: AssertionHelpers;
  cleanup: CleanupFunction[];
  setup: SetupFunction[];
}

/**
 * Global test configuration
 */
export interface GlobalTestConfig {
  environment: TestEnvironment;
  services: ServiceEndpoints;
  testUsers: TestUser[];
  fixtures: TestFixture;
  utilities: TestUtilities;
}
