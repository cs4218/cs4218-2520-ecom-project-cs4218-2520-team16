// Code guided by ChatGPT
// Xiao Ao, A0273305L
export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/**/*.test.js"],

  // jest code coverage
  testPathIgnorePatterns: ["node_modules", "<rootDir>/client/"],
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
