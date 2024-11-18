import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Shared dependency versions
const DEPENDENCY_VERSIONS = {
  react: '^18.0.0',
  reactDom: '^18.0.0',
  reactRouter: '^6.0.0',
  mui: '^6.1.6'
};

const federationConfig = {
  name: 'host',
  filename: 'remoteEntry.js',
  remotes: {},
  exposes: {
    './components/admin': './src/client/components/admin/index.ts',
    './components/auth': './src/client/components/auth/index.ts',
    './components/shared': './src/client/components/shared/index.ts',
    './utils/common': './src/client/utils/common/index.ts'
  },
  shared: {
    // Core React ecosystem - always eager loaded
    react: { 
      singleton: true, 
      eager: true, 
      requiredVersion: DEPENDENCY_VERSIONS.react 
    },
    'react-dom': { 
      singleton: true, 
      eager: true, 
      requiredVersion: DEPENDENCY_VERSIONS.reactDom 
    },
    'react-router-dom': { 
      singleton: true, 
      eager: true, 
      requiredVersion: DEPENDENCY_VERSIONS.reactRouter 
    },
    
    // UI Components - eager loaded for consistent styling
    '@mui/material': { 
      singleton: true, 
      eager: true, 
      requiredVersion: DEPENDENCY_VERSIONS.mui 
    },
    '@mui/icons-material': { 
      singleton: true, 
      eager: true 
    },
    '@emotion/react': { 
      singleton: true, 
      eager: true 
    },
    '@emotion/styled': { 
      singleton: true, 
      eager: true 
    },
    
    // Form handling - lazy loaded
    'formik': { singleton: true },
    'yup': { singleton: true },
    'zod': { singleton: true },
    
    // Core utilities - eager loaded
    '@replit/object-storage': { singleton: true, eager: true },
    'date-fns': { singleton: true, eager: true },
    'uuid': { singleton: true, eager: true },
    
    // Node.js polyfills - always eager loaded
    events: { singleton: true, eager: true },
    util: { singleton: true, eager: true }
  }
};

// Optimized polyfills configuration
export const vitePlugins = [
  nodePolyfills({
    include: ['events', 'process', 'util'],
    globals: {
      Buffer: true,
      global: true,
      process: true
    },
    overrides: {
      util: './src/client/utils/utilPolyfill.ts'
    },
    protocolImports: true
  })
];

// Build optimization configuration
export const buildConfig = {
  target: 'esnext',
  minify: 'esbuild',
  sourcemap: process.env.NODE_ENV !== 'production',
  commonjsOptions: {
    transformMixedEsModules: true
  },
  rollupOptions: {
    input: {
      main: './src/client/index.html'
    },
    output: {
      manualChunks: {
        'core-deps': ['react', 'react-dom', 'react-router-dom'],
        'ui-deps': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        'form-deps': ['formik', 'yup', 'zod'],
        'utils': ['date-fns', 'uuid'],
        'polyfills': ['events', 'util']
      }
    }
  }
};

export default federationConfig;
