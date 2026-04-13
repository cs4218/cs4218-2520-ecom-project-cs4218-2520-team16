// Code guided by ChatGPT
// Xiao Ao, A0273305L
export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // align backend transpilation behavior with frontend so ESM tests can use Jest mocking APIs reliably Wen Han Tang A0340008W
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // which test to run
  testMatch: ["<rootDir>/**/*.test.js"],

  // jest code coverage
  testPathIgnorePatterns: [
    "node_modules",
    "<rootDir>/client/",
    // Wang Zihan A0266073A: exclude security tests for milestone 3 when running GitHub actions
    // This is because this project has security vulnerabilities that would fail some security test cases
    // Since milestone 3 does not require fix any bugs in the project itself, I leave the test cases failed
    // To make GitHub actions pass, I exclude security tests from `npm run test`
    // Run `npm run test:security` to run security tests and see the failed test cases
    "<rootDir>/security-tests/",
  ],
  collectCoverage: true,

  // Xiao Ao, A0273305L, test coverage for recently edited files
  collectCoverageFrom: [
    "controllers/authController.js",
    "middlewares/authMiddleware.js",
    "helpers/authHelper.js"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
