import { Client } from '@replit/object-storage';

interface ProcessEnv {
  NODE_ENV: string;
  DEV: string;
  PROD: string;
  SSR: string;
  BASE_URL: string;
  MODE: string;
  VITE_WS_PROTOCOL: string;
  VITE_API_URL: string;
  VITE_WS_HOST: string;
  VITE_WS_PORT: string;
  VITE_EXTERNAL_PORT: string;
  VITE_REPL_SLUG?: string;
  VITE_REPL_OWNER?: string;
  VITE_HMR_TIMEOUT?: string;
  VITE_HMR_MAX_RETRIES?: string;
  VITE_HMR_RECONNECT_DELAY_MIN?: string;
  VITE_HMR_RECONNECT_DELAY_MAX?: string;
}

declare global {
  interface Window {
    process: {
      env: ProcessEnv;
    };
  }
}

const getReplitDomain = () => {
  const replSlug = import.meta.env.VITE_REPL_SLUG;
  const replOwner = import.meta.env.VITE_REPL_OWNER;
  
  if (replSlug && replOwner) {
    return `${replSlug}.${replOwner}.repl.co`;
  }
  return '0.0.0.0';
};

const getHostInfo = () => {
  const defaultConfig = {
    wsProtocol: 'ws',
    wsHost: '0.0.0.0',
    frontendInternalPort: '5173',    // Dev server port
    frontendExternalPort: '5000',    // External frontend port
    apiInternalPort: '3001',         // API server internal port
    apiExternalPort: '80',           // API server external port
    hmrPort: '443',                  // Default HMR port for production
    hmrTimeout: '120000',
    hmrMaxRetries: '100',
    hmrReconnectDelayMin: '1000',
    hmrReconnectDelayMax: '30000'
  };

  try {
    const isDev = import.meta.env.DEV;
    const isHttps = window.location.protocol === 'https:';
    const replitDomain = getReplitDomain();

    // For development environment
    if (isDev) {
      return {
        ...defaultConfig,
        wsProtocol: isHttps ? 'wss' : 'ws',
        wsHost: replitDomain,
        wsPort: defaultConfig.frontendInternalPort,
        hmrPort: defaultConfig.frontendInternalPort,
        apiUrl: `http://${replitDomain}:${defaultConfig.apiInternalPort}/api`,
        externalPort: defaultConfig.frontendExternalPort
      };
    }

    // For production environment
    return {
      ...defaultConfig,
      wsProtocol: 'wss',
      wsHost: replitDomain,
      wsPort: '443',
      hmrPort: '443',
      apiUrl: `https://${replitDomain}/api`,
      externalPort: defaultConfig.apiExternalPort
    };
  } catch (error) {
    console.error('[Environment] Error in getHostInfo:', error);
    return defaultConfig;
  }
};

// Initialize configuration
const config = getHostInfo();

// Set up process.env for browser environment
if (!window.process) {
  window.process = {
    env: {
      NODE_ENV: import.meta.env.MODE || 'development',
      DEV: String(import.meta.env.DEV || false),
      PROD: String(import.meta.env.PROD || false),
      SSR: String(import.meta.env.SSR || false),
      BASE_URL: import.meta.env.BASE_URL || '/',
      MODE: import.meta.env.MODE || 'development',
      VITE_WS_PROTOCOL: config.wsProtocol,
      VITE_API_URL: config.apiUrl,
      VITE_WS_HOST: config.wsHost,
      VITE_WS_PORT: config.wsPort,
      VITE_EXTERNAL_PORT: config.externalPort,
      VITE_REPL_SLUG: import.meta.env.VITE_REPL_SLUG,
      VITE_REPL_OWNER: import.meta.env.VITE_REPL_OWNER,
      VITE_HMR_TIMEOUT: config.hmrTimeout,
      VITE_HMR_MAX_RETRIES: config.hmrMaxRetries,
      VITE_HMR_RECONNECT_DELAY_MIN: config.hmrReconnectDelayMin,
      VITE_HMR_RECONNECT_DELAY_MAX: config.hmrReconnectDelayMax
    }
  };
}

// Export environment configuration
export const env = {
  NODE_ENV: window.process.env.NODE_ENV,
  DEV: window.process.env.DEV === 'true',
  PROD: window.process.env.PROD === 'true',
  SSR: window.process.env.SSR === 'true',
  BASE_URL: window.process.env.BASE_URL,
  API_URL: window.process.env.VITE_API_URL,
  WS_PROTOCOL: window.process.env.VITE_WS_PROTOCOL,
  WS_HOST: window.process.env.VITE_WS_HOST,
  WS_PORT: window.process.env.VITE_WS_PORT,
  EXTERNAL_PORT: window.process.env.VITE_EXTERNAL_PORT,
  REPL_SLUG: window.process.env.VITE_REPL_SLUG,
  REPL_OWNER: window.process.env.VITE_REPL_OWNER,
  HMR_TIMEOUT: parseInt(window.process.env.VITE_HMR_TIMEOUT || '120000'),
  HMR_MAX_RETRIES: parseInt(window.process.env.VITE_HMR_MAX_RETRIES || '100'),
  HMR_RECONNECT_DELAY_MIN: parseInt(window.process.env.VITE_HMR_RECONNECT_DELAY_MIN || '1000'),
  HMR_RECONNECT_DELAY_MAX: parseInt(window.process.env.VITE_HMR_RECONNECT_DELAY_MAX || '30000')
} as const;

export const isDevelopment = env.DEV;
export const isProduction = env.PROD;

// Get WebSocket URL for HMR
export const getWebSocketUrl = () => {
  const replitDomain = getReplitDomain();
  const isHttps = window.location.protocol === 'https:';
  const config = getHostInfo();
  
  if (env.DEV) {
    const wsProtocol = isHttps ? 'wss' : 'ws';
    return `${wsProtocol}://${replitDomain}:${config.hmrPort}`;
  }
  return `wss://${replitDomain}`;
};

// Get API URL
export const getApiUrl = () => {
  const replitDomain = getReplitDomain();
  const config = getHostInfo();
  
  if (env.DEV) {
    return `http://${replitDomain}:${config.apiInternalPort}/api`;
  }
  return `https://${replitDomain}/api`;
};

// Export object storage client
export const objectStorage = new Client();
