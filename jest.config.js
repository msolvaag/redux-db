module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    "<rootDir>/src/"
  ],
  clearMocks: false,
  coverageDirectory: "coverage",
  watchman: true,
  timeout: 1000
};