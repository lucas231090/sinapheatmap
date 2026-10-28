module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.js", "!src/tests/**"],
  coverageDirectory: "coverage",
  clearMocks: true,
};
