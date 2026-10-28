export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(mp4|webm|ogg|mp3|wav|png|jpg|jpeg|gif|svg)$":
      "<rootDir>/__mocks__/fileMock.js",
    config$: "<rootDir>/__mocks__/config.js",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/main.jsx",
  ],
  coverageDirectory: "coverage",
};
