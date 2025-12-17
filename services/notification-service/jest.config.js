module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/migrations/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: '<rootDir>/../test/jest-environment.js',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@applyforus/telemetry$': '<rootDir>/../test/mocks/telemetry.mock.ts',
    '^@applyforus/logging$': '<rootDir>/../test/mocks/logging.mock.ts',
    '^@applyforus/security$': '<rootDir>/../test/mocks/security.mock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
};
