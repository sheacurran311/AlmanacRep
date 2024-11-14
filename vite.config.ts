import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { constants } from './src/config/constants'; // Import constants

export default defineConfig({
  server: {
    port: constants.VITE.DEV_SERVER_PORT, // Using the dev server port
    host: '0.0.0.0',                       // Allow connections from any host
    hmr: {
      host: '0.0.0.0',                     // Set the HMR host
      protocol: 'ws',                      // Use ws for HMR
      // If using SSL, uncomment the next line
      // protocol: 'wss',                   // Use wss for secure HMR connection
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});