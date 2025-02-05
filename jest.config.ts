export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  moduleDirectories: ['node_modules', 'src'], // 👈 Add 'src' to resolve absolute imports
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1', // 👈 Fix absolute imports
  },
};
