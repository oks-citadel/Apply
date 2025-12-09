module.exports = {
  displayName: 'e2e-tests',
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'tests/e2e/**/*.ts',
    '!tests/e2e/**/*.test.ts',
    '!tests/e2e/**/*.d.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/e2e',
  testTimeout: 60000, // 60 seconds for E2E tests
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
  maxWorkers: 1, // Run tests serially
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  // Environment variables for E2E tests
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // Global variables
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
