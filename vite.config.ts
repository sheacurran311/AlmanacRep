import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Get Replit domain information
const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER
  ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'localhost';

export default defineConfig({
  plugins: [react()],
  root: "src/client",
  base: "/",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@client": path.resolve(__dirname, "./src/client"),
      "@server": path.resolve(__dirname, "./src/server"),
      "@components": path.resolve(__dirname, "./src/client/components"),
      "@hooks": path.resolve(__dirname, "./src/client/hooks"),
      "@theme": path.resolve(__dirname, "./src/client/theme"),
      "@utils": path.resolve(__dirname, "./src/client/utils"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@middleware": path.resolve(__dirname, "./src/middleware"),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: replitDomain === 'localhost' ? 'ws' : 'wss',
      host: replitDomain,
      clientPort: replitDomain === 'localhost' ? 5173 : 443,
      timeout: 60000,
      overlay: false,
      path: '/_hmr',
      clientTracking: true,
      reconnect: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Proxy Error]:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy Request]:', req.method, req.url);
          });
          proxy.on('proxyRes', (_proxyRes, req) => {
            console.log('[Proxy Response]:', req.method, req.url);
          });
        }
      }
    },
    watch: {
      usePolling: true,
      interval: 1000,
      binaryInterval: 3000
    }
  }
});
