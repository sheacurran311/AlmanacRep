import { nodePolyfills } from 'vite-plugin-node-polyfills';

const federationConfig = {
  name: 'host',
  filename: 'remoteEntry.js',
  remotes: {},
  exposes: {
    './components/admin': './src/client/components/admin/index.ts'
  },
  shared: {
    react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
    'react-router-dom': { singleton: true, eager: true, requiredVersion: '^6.0.0' },
    '@mui/material': { singleton: true, eager: true },
    '@mui/icons-material': { singleton: true, eager: true },
    '@emotion/react': { singleton: true, eager: true },
    '@emotion/styled': { singleton: true, eager: true },
    '@replit/object-storage': { singleton: true },
    // Node polyfills shared configuration
    events: { singleton: true, eager: true },
    util: { singleton: true, eager: true },
    'stream-browserify': { singleton: true, eager: true },
    process: { singleton: true, eager: true }
  }
};

export const vitePlugins = [
  nodePolyfills({
    include: ['stream', 'util', 'events', 'process'],
    globals: {
      Buffer: true,
      global: true,
      process: true
    },
    prototypes: true,
    overrides: {
      stream: 'stream-browserify',
      util: 'util'
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
        polyfills: ['events', 'stream-browserify', 'util', 'process']
      }
    }
  }
};

export default federationConfig;
