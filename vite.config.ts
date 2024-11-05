import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Get Replit domain information
const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER
  ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'localhost';

export default defineConfig({
  plugins: [react()],
  root: "./src/client",
  base: "/",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
    sourcemap: true,
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
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: replitDomain,
      clientPort: 443,
      timeout: 60000,
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      "/api": {
        target: "http://0.0.0.0:3001",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
