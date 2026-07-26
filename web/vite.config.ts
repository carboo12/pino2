/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const appBase = process.env.VITE_APP_BASENAME || '/';
const backendOrigin = process.env.VITE_DEV_BACKEND_ORIGIN || 'http://localhost:3010';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**', 'functions/**'],
  },
  base: appBase,
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/socket.io': {
        target: backendOrigin,
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: backendOrigin,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'vendor-react';
          }

          if (id.includes('/recharts/')) {
            return 'vendor-charts';
          }

          if (
            id.includes('/axios/') ||
            id.includes('/lucide-react/') ||
            id.includes('/date-fns/')
          ) {
            return 'vendor-utils';
          }

          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
