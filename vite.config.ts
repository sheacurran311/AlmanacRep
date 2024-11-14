import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import federation from "@originjs/vite-plugin-federation";

// Get Replit domain information
const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER
  ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'localhost';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "clientComponents",
      filename: "remoteEntry.js",
      exposes: {
        "./Admin": "./src/client/components/admin/index.tsx"
      },
      shared: ["react", "react-dom"]
    })
  ],
  root: "src/client",
  base: "/",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'almanaclogo.png') {
            return 'assets/[name][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      }
    }
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
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  }
});
