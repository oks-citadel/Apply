module.exports = {
  displayName: 'integration-tests',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
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
