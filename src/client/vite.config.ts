import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Get Replit domain information
const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER
  ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'localhost';

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: '/',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
      '@client': path.resolve(__dirname, '.'),
      '@server': path.resolve(__dirname, '../server'),
      '@components': path.resolve(__dirname, './components'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@theme': path.resolve(__dirname, './theme'),
      '@utils': path.resolve(__dirname, './utils'),
      '@services': path.resolve(__dirname, '../services'),
      '@config': path.resolve(__dirname, '../config'),
      '@middleware': path.resolve(__dirname, '../middleware')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: replitDomain,
      port: 443,
      clientPort: 443,
      path: '/_hmr',
      timeout: 120000
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
