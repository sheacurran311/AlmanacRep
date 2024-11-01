import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Get Replit domain information
const isReplit = Boolean(process.env.REPL_SLUG && process.env.REPL_OWNER);
const replitDomain = isReplit 
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
    port: 3000,
    strictPort: true,
    hmr: {
      protocol: isReplit ? 'wss' : 'ws',
      host: replitDomain,
      clientPort: 3000,
      path: '/_hmr',
      timeout: 120000,
      overlay: false
    },
    proxy: {
      '/api': {
        target: isReplit 
          ? `https://${replitDomain}:5000` 
          : 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
