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

  // only run these tests
  testMatch: ["<rootDir>/client/src/**/**/*.test.js"],

  // jest code 
  collectCoverage: true,
  
  // Xiao Ao, A0273305L, test coverage for recently edited files
  // Appended by Wen Han Tang, A0340008W, to include additional files for coverage
  collectCoverageFrom: [
    "client/src/context/auth.js",
    "client/src/pages/Auth/Register.js",
    "client/src/pages/Auth/Login.js",
    "client/src/components/AdminMenu.js",
    "client/src/pages/admin/AdminDashboard.js",
    "client/src/pages/user/Profile.js",
    "client/src/pages/admin/Users.js",
    "client/src/pages/Search.js",
    "client/src/pages/user/Orders.js",
    "client/src/pages/Policy.js"
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
