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
    "^braintree-web-drop-in-react$":
      "<rootDir>/client/src/test-mocks/braintree-web-drop-in-react.js",
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: ["**/client/src/**/*.test.js"],
  testPathIgnorePatterns: ["<rootDir>/client/src/_site/"],

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
    "client/src/pages/Policy.js",
    "client/src/pages/CartPage.js",
    "client/src/pages/admin/AdminOrders.js"
  ],
  coverageThreshold: {
    global: {
    statements: 99,
    branches: 99,
    functions: 99,
    lines: 99,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],

  // Force Jest to exit after all tests complete, preventing hangs from open handles
  // (e.g. react-hot-toast internal timers)
  forceExit: true,
};
