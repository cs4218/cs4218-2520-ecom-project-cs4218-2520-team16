export default {
  displayName: "security",
  testEnvironment: "node",
  rootDir: "..",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  testMatch: ["<rootDir>/security-tests/**/*.test.js"],
  forceExit: true,
};
