module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // テスト用にモジュール解決を上書き
        module: 'commonjs',
        esModuleInterop: true,
        jsx: 'react-jsx',
      },
    }],
  },
  moduleNameMapper: {
    '^expo-localization$': '<rootDir>/src/__mocks__/expo-localization.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/async-storage.ts',
  },
};
