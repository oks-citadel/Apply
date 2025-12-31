const path = require("path");

/**
 * Jest Configuration for E2E API Tests
 *
 * Run all E2E tests:
 *   pnpm test:e2e:api
 *
 * Run specific test file:
 *   pnpm test:e2e:api -- --testPathPattern=health.test.ts
 *
 * Run with real services:
 *   E2E_USE_REAL_SERVICES=true pnpm test:e2e:api
 *
 * Run with coverage:
 *   pnpm test:e2e:api -- --coverage
 */
module.exports = {
  displayName: "e2e-tests",

  // Use custom environment for Node.js compatibility
  testEnvironment: "<rootDir>/tests/e2e/custom-environment.js",

  // Root directory for resolving paths
  rootDir: path.resolve(__dirname, "../.."),

  // Pattern for test files
  testMatch: ["**/tests/e2e/**/*.test.ts"],

  // Ignore patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/.*.bak$/",
  ],

  // Explicitly clear any module name mappers from other configs
  modulePathIgnorePatterns: [
    "<rootDir>/apps/",
    "<rootDir>/services/",
    "<rootDir>/packages/",
  ],

  // TypeScript transformation
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      useESM: false,
      tsconfig: "<rootDir>/tests/e2e/tsconfig.json",
      diagnostics: {
        ignoreCodes: [151001], // Ignore "file is not under rootDir" warnings
      },
    }],
  },

  // Module resolution
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/tests/e2e/$1",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "tests/e2e/**/*.ts",
    "!tests/e2e/**/*.test.ts",
    "!tests/e2e/**/*.d.ts",
    "!tests/e2e/fixtures/**",
  ],
  coverageDirectory: "<rootDir>/coverage/e2e",
  coverageReporters: ["text", "lcov", "html"],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/e2e/setup.ts"],

  // Timeouts
  testTimeout: 60000,

  // Run tests serially to avoid port conflicts
  maxWorkers: 1,

  // Reset modules between tests to prevent pollution
  resetModules: true,

  // Clear mocks between tests
  clearMocks: true,

  // Cleanup
  forceExit: true,
  detectOpenHandles: true,

  // Output
  verbose: true,

  // Reporter configuration (default only, add jest-junit if needed)
  reporters: ["default"],

  // Global setup/teardown (if needed for real services)
  // globalSetup: "<rootDir>/tests/e2e/global-setup.ts",
  // globalTeardown: "<rootDir>/tests/e2e/global-teardown.ts",
};
