module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@proxy/(.*)$': '<rootDir>/proxy/$1',
    '^@auth/(.*)$': '<rootDir>/auth/$1',
    '^@rate-limit/(.*)$': '<rootDir>/rate-limit/$1',
    '^@health/(.*)$': '<rootDir>/health/$1',
  },
};
