const path = require("path");

module.exports = {
  displayName: "e2e-tests",
  testEnvironment: "<rootDir>/tests/e2e/custom-environment.js",
  rootDir: path.resolve(__dirname, "../.."),
  testMatch: ["**/tests/e2e/**/*.test.ts"],
  transform: {
    "^.+\.ts$": ["ts-jest", {
      useESM: false,
      tsconfig: "<rootDir>/tsconfig.json",
    }],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "tests/e2e/**/*.ts",
    "!tests/e2e/**/*.test.ts",
    "!tests/e2e/**/*.d.ts",
  ],
  coverageDirectory: "<rootDir>/coverage/e2e",
  testTimeout: 60000,
  setupFilesAfterEnv: ["<rootDir>/tests/e2e/setup.ts"],
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
};
