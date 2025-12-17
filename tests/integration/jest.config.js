const path = require('path');

module.exports = {
  displayName: 'integration-tests',
  testEnvironment: '<rootDir>/tests/integration/custom-environment.js',
  rootDir: path.resolve(__dirname, '../..'),
  testMatch: ['**/tests/integration/**/*.integration.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tests/integration/tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'tests/integration/**/*.ts',
    '!tests/integration/**/*.test.ts',
    '!tests/integration/**/*.d.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/integration',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  maxWorkers: 1, // Run tests serially to avoid database conflicts
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
};
