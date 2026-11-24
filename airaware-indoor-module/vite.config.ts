import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Standalone sandbox for the Indoor Air Doctor module.
// The module itself is imported by the parent app; this config only serves the demo page.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '127.0.0.1',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
  },
});
