export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

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

  // run all page tests (including admin)
  testMatch: ["<rootDir>/client/src/pages/**/*.test.js"],

  // jest code 
  // Xiao Ao, A0273305L
  collectCoverage: true,
  collectCoverageFrom: ["client/src/pages/Auth/**"],
  coverageThreshold: {
    "client/src/pages/Auth/Login.js": {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    "client/src/pages/Auth/Register.js": {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
