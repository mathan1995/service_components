/** @type {import('jest').Config} */
const config = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/database/config.js',
    '!src/database/factories/**',
    '!src/database/migrations/**',
    '!src/database/models/index.js',
  ],
  coverageDirectory: '.coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^Config(.*)$': '<rootDir>/config$1',
    '^Database(.*)$': '<rootDir>/src/database$1',
    '^Errors(.*)$': '<rootDir>/src/errors$1',
    '^Handler(.*)$': '<rootDir>/src/handler$1',
    '^Graphql(.*)$': '<rootDir>/src/graphql$1',
    '^Repositories(.*)$': '<rootDir>/src/repositories$1',
    '^Services(.*)$': '<rootDir>/src/services$1',
    '^Utils(.*)$': '<rootDir>/src/utils$1',
  },
  setupFiles: ['<rootDir>/jest.env.js'],
};

module.exports = config;
