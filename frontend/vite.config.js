/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  // Vitest configuration (unit/component tests)
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  // Dev-only proxy so the relative URLs (/api, /ws, /ai) work locally.
  // In production these are handled by nginx instead.
  server: {
    proxy: {
      '/api': 'http://localhost:9000',
      '/ws':  { target: 'http://localhost:9000', ws: true },
      '/ai':  { target: 'http://localhost:8001', rewrite: (p) => p.replace(/^\/ai/, '') },
    },
  },
})
