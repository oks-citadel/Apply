// @ts-check
/** @type {import("ts-jest").JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\.(spec|test)\.ts$",
  transform: {
    "^.+\.(t|j)s$": ["ts-jest", {
      tsconfig: "tsconfig.json",
    }],
  },
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/*.dto.ts",
    "!**/*.interface.ts",
    "!**/index.ts",
  ],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
