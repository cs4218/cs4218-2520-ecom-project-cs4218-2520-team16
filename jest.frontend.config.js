// Xiao Ao, A0273305L
// Code guided by Github Copilot

export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  testMatch: ["<rootDir>/client/src/**/*.test.js"],

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  testMatch: ["<rootDir>/client/src/**/**/*.test.js"],

  // jest code 
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/context/*.js",
    "client/src/components/*.js",
    "client/src/pages/**/*.js",
  ],
  coverageThreshold: {
    global: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
