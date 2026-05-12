module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/server/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/'
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!server/node_modules/**'
  ]
};
