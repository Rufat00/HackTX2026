import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['apps/*/src/**/*.integration.test.ts'],
    exclude: ['**/node_modules/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
