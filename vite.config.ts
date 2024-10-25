import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './src/client',
  base: '/',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, './src/client/components'),
      '@hooks': path.resolve(__dirname, './src/client/hooks'),
      '@theme': path.resolve(__dirname, './src/client/theme'),
      '@styles': path.resolve(__dirname, './src/client/styles'),
      '@routes': path.resolve(__dirname, './src/client/routes'),
      '@services': path.resolve(__dirname, './src/client/services'),
      '@utils': path.resolve(__dirname, './src/client/utils'),
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled', '@mui/material', '@mui/icons-material'],
  },
});
