module.exports = {
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*)'
  ],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  // テスト実行時のみ使用するカバレッジ設定
  coverageThreshold: process.env.CI ? {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  } : undefined,
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
