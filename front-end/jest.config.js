
module.exports = {
  preset: 'jest-preset-angular',
  roots: ['<rootDir>/src/'],
  testMatch: ['**/+(*.)+(spec).+(ts|js)'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  collectCoverage: true,
  coverageReporters: ['html', 'text-summary'],
  // npm test échoue sous 80 % de couverture
  coverageThreshold: {
    global: {statements: 80, branches: 80, functions: 80, lines: 80},
  },
};
