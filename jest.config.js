module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    "<rootDir>/src/",
    "<rootDir>/tests/"
  ],
  clearMocks: false,
  coverageDirectory: "coverage",
  watchman: true
};