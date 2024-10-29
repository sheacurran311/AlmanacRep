import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isReplit = Boolean(process.env.REPL_SLUG && process.env.REPL_OWNER);
  const replitDomain = isReplit 
    ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : undefined;

  return {
    plugins: [react()],
    root: './src/client',
    base: '/',
    build: {
      outDir: '../../dist/client',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@client': path.resolve(__dirname, './src/client'),
        '@server': path.resolve(__dirname, './src/server'),
        '@components': path.resolve(__dirname, './src/client/components'),
        '@hooks': path.resolve(__dirname, './src/client/hooks'),
        '@theme': path.resolve(__dirname, './src/client/theme'),
        '@styles': path.resolve(__dirname, './src/client/styles'),
        '@services': path.resolve(__dirname, './src/services'),
        '@config': path.resolve(__dirname, './src/config'),
        '@middleware': path.resolve(__dirname, './src/middleware'),
        '@utils': path.resolve(__dirname, './src/utils')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: {
        clientPort: isReplit ? 443 : undefined,
        host: isReplit ? replitDomain : undefined,
        path: '/@vite/client',
        protocol: isReplit ? 'wss' : 'ws'
      },
      proxy: {
        '/api': {
          target: isReplit ? `https://${replitDomain}` : 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };
});
