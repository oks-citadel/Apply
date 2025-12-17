module.exports = {
  "moduleFileExtensions": [
    "js",
    "json",
    "ts"
  ],
  "rootDir": "src",
  "testRegex": ".*.spec.ts",
  "transform": {
    "^.+.(t|j)s": "ts-jest"
  },
  "coverageDirectory": "../coverage",
  "testEnvironment": "node",
  "moduleNameMapper": {
    "^@/(.*)": "<rootDir>/",
    "^@applyforus/telemetry": "<rootDir>/../__mocks__/telemetry.ts",
    "^@applyforus/logging": "<rootDir>/../__mocks__/logging.ts",
    "^@applyforus/security": "<rootDir>/../__mocks__/security.ts"
  },
  "setupFilesAfterEnv": [
    "<rootDir>/../jest.setup.js"
  ]
};