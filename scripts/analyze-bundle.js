import { visualizer } from 'rollup-plugin-visualizer';
import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeBuild() {
  try {
    await build({
      root: resolve(__dirname, '../src/client'),
      build: {
        outDir: resolve(__dirname, '../dist'),
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
        minify: true,
        sourcemap: true,
        rollupOptions: {
          input: resolve(__dirname, '../src/client/index.html'),
          output: {
            manualChunks: {
              // Core React dependencies
              react: ['react', 'react-dom'],
              // UI Components
              mui: [
                '@mui/material',
                '@mui/icons-material',
                '@mui/lab',
                '@mui/system'
              ],
              // Feature specific chunks
              charts: ['apexcharts', 'react-apexcharts'],
              forms: ['formik', 'yup'],
              routing: ['react-router-dom'],
              state: ['react-redux', 'redux'],
              // Vendor chunk for external dependencies
              vendor: [
                '@replit/object-storage',
                'axios',
                'date-fns',
                'uuid'
              ],
              // Polyfills chunk
              polyfills: [
                'events',
                'buffer',
                'process/browser'
              ]
            }
          }
        }
      },
      plugins: [
        nodePolyfills({
          include: ['buffer', 'events', 'process'],
          prototypes: false,
          globals: {
            Buffer: true,
            process: true
          }
        }),
        visualizer({
          filename: resolve(__dirname, '../dist/bundle-analysis.html'),
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'sunburst', // Changed to sunburst for better visualization
          sourcemap: true,
          projectRoot: resolve(__dirname, '..'),
          exclude: [/node_modules/],
          json: true,
          title: 'Bundle Analysis Report'
        })
      ],
      resolve: {
        alias: {
          '@client': resolve(__dirname, '../src/client')
        }
      },
      optimizeDeps: {
        exclude: ['stream', 'util', 'fsevents']
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'global': 'globalThis'
      }
    });
    console.log('Bundle analysis completed. Check dist/bundle-analysis.html for the visualization.');
  } catch (error) {
    console.error('Bundle analysis failed:', error);
    process.exit(1);
  }
}

analyzeBuild();
