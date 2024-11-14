import { nodePolyfills } from 'vite-plugin-node-polyfills';

const federationConfig = {
  name: 'host',
  filename: 'remoteEntry.js',
  remotes: {},
  exposes: {
    './components/admin': './src/client/components/admin/index.ts'
  },
  shared: {
    // React ecosystem
    react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
    'react-router-dom': { singleton: true, eager: true, requiredVersion: '^6.0.0' },
    
    // Material UI
    '@mui/material': { singleton: true, eager: true },
    '@mui/icons-material': { singleton: true, eager: true },
    '@emotion/react': { singleton: true, eager: true },
    '@emotion/styled': { singleton: true, eager: true },
    
    // Storage and utilities
    '@replit/object-storage': { singleton: true },
    
    // Core Node.js polyfills
    events: { singleton: true, eager: true },
    util: { singleton: true, eager: true }
  }
};

export const vitePlugins = [
  nodePolyfills({
    include: ['events', 'process'],
    globals: {
      Buffer: true,
      global: true,
      process: true
    },
    overrides: {
      util: './src/client/utils/utilPolyfill.ts'
    }
  })
];

export const buildConfig = {
  target: 'esnext',
  minify: 'esbuild',
  sourcemap: true,
  commonjsOptions: {
    transformMixedEsModules: true
  },
  rollupOptions: {
    input: {
      main: './src/client/index.html'
    },
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        mui: ['@mui/material', '@mui/icons-material'],
        polyfills: ['events', 'util']
      }
    }
  }
};

export default federationConfig;
