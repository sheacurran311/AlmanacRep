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

// Get Replit domain configuration
export const getReplitDomain = () => {
  if (import.meta.env.VITE_REPL_SLUG && import.meta.env.VITE_REPL_OWNER) {
    return `${import.meta.env.VITE_REPL_SLUG}.${import.meta.env.VITE_REPL_OWNER}.repl.co`;
  }
  return 'localhost';
};

// Enhanced host information with proper configurations
export const getHostInfo = () => {
  const defaultConfig = {
    wsProtocol: 'ws',
    wsHost: '0.0.0.0',
    frontendInternalPort: '5173',
    frontendExternalPort: '5000',
    apiInternalPort: '3001',
    apiExternalPort: '80',
    hmrTimeout: '120000',
    hmrMaxRetries: '100',
    hmrReconnectDelayMin: '1000',
    hmrReconnectDelayMax: '30000',
    hmrPath: '/@vite/client',
    hmrClientPort: '443',
    dbPort: process.env.PGPORT || '5432'
  };

  try {
    const isDev = import.meta.env.DEV;
    const replitDomain = getReplitDomain();
    const isLocalhost = replitDomain === 'localhost';
    const protocol = isLocalhost ? 'ws' : 'wss';

    // Base URLs with proper host configuration
    const apiBaseUrl = isLocalhost 
      ? `http://0.0.0.0:${defaultConfig.apiInternalPort}`
      : `https://${replitDomain}`;

    const wsBaseUrl = isLocalhost
      ? `${protocol}://0.0.0.0:${defaultConfig.frontendInternalPort}`
      : `${protocol}://${replitDomain}`;

    // Enhanced configuration
    const config = {
      ...defaultConfig,
      wsProtocol: protocol,
      wsHost: isLocalhost ? '0.0.0.0' : replitDomain,
      wsPort: isLocalhost ? defaultConfig.frontendInternalPort : '443',
      hmrPort: isLocalhost ? defaultConfig.frontendInternalPort : '443',
      hmrProtocol: protocol,
      hmrHost: isLocalhost ? '0.0.0.0' : replitDomain,
      apiUrl: `${apiBaseUrl}/api`,
      externalPort: isDev ? defaultConfig.frontendExternalPort : defaultConfig.apiExternalPort,
      hmrWebSocketURL: wsBaseUrl,
      hmrEnabled: true,
      hmrWebSocketOptions: {
        path: defaultConfig.hmrPath,
        timeout: parseInt(defaultConfig.hmrTimeout),
        overlay: true,
        reconnect: true,
        reloadOnFail: true,
        host: isLocalhost ? '0.0.0.0' : replitDomain,
        port: isLocalhost ? defaultConfig.frontendInternalPort : '443',
        protocol: protocol,
        clientPort: isLocalhost ? defaultConfig.frontendInternalPort : '443'
      }
    };

    // Log configuration in development
    if (isDev) {
      console.log('[Environment] Development configuration:', {
        replitDomain,
        apiUrl: config.apiUrl,
        wsUrl: config.hmrWebSocketURL,
        ports: {
          frontend: defaultConfig.frontendInternalPort,
          api: defaultConfig.apiInternalPort,
          db: defaultConfig.dbPort
        }
      });
    }

    // Return production config if not in development
    return isDev ? config : {
      ...config,
      wsProtocol: 'wss',
      wsHost: replitDomain,
      wsPort: '443',
      hmrPort: '443',
      hmrProtocol: 'wss',
      hmrHost: replitDomain,
      hmrWebSocketURL: `wss://${replitDomain}`
    };
  } catch (error) {
    console.error('[Environment] Error in getHostInfo:', error);
    return defaultConfig;
  }
};

const config = getHostInfo();

// Initialize process.env if not exists
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
};

// Export environment helpers
export const isDevelopment = env.DEV;
export const isProduction = env.PROD;
export const getWebSocketUrl = () => {
  const config = getHostInfo();
  return config.hmrWebSocketURL;
};
export const getApiUrl = () => {
  const config = getHostInfo();
  return config.apiUrl;
};

// Initialize object storage client
export const objectStorage = new Client();
