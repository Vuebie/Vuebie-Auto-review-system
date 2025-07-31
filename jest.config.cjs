/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '@/lib/(.*)': '<rootDir>/src/lib/$1',
    '@/components/(.*)': '<rootDir>/src/components/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@supabase|supabase-js|isows)/).+\\.js$'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/mocks/**'
  ],
  globals: {
    'import.meta': {
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
      }
    }
  }
};