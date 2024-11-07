// Environment setup and polyfills
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

// Get host information with enhanced error handling and retry logic
const getHostInfo = () => {
  const defaultConfig = {
    wsProtocol: 'ws',
    wsHost: '0.0.0.0',
    wsPort: '5173',
    apiUrl: 'http://localhost:3001/api',
    hmrTimeout: '120000',
    hmrMaxRetries: '50',
    hmrReconnectDelayMin: '1000',
    hmrReconnectDelayMax: '30000'
  };

  try {
    if (import.meta.env.DEV) {
      return defaultConfig;
    }

    // In production, determine the correct host and protocol
    const isReplit = import.meta.env.VITE_REPL_SLUG && import.meta.env.VITE_REPL_OWNER;
    const host = isReplit 
      ? `${import.meta.env.VITE_REPL_SLUG}.${import.meta.env.VITE_REPL_OWNER}.repl.co`
      : window.location.hostname;
    
    return {
      wsProtocol: window.location.protocol === 'https:' ? 'wss' : 'ws',
      wsHost: host,
      wsPort: window.location.port || '80',
      apiUrl: '/api',
      hmrTimeout: '300000',
      hmrMaxRetries: '50',
      hmrReconnectDelayMin: '2000',
      hmrReconnectDelayMax: '60000'
    };
  } catch (error) {
    console.error('[Environment] Error getting host info:', error);
    return defaultConfig;
  }
};

// Initialize process with proper environment variables
if (!window.process) {
  try {
    const { 
      wsProtocol, 
      wsHost, 
      wsPort, 
      apiUrl, 
      hmrTimeout, 
      hmrMaxRetries,
      hmrReconnectDelayMin,
      hmrReconnectDelayMax 
    } = getHostInfo();

    window.process = {
      env: {
        NODE_ENV: String(import.meta.env.MODE || 'development'),
        DEV: String(import.meta.env.DEV || false),
        PROD: String(import.meta.env.PROD || false),
        SSR: String(import.meta.env.SSR || false),
        BASE_URL: String(import.meta.env.BASE_URL || '/'),
        MODE: String(import.meta.env.MODE || 'development'),
        VITE_WS_PROTOCOL: wsProtocol,
        VITE_API_URL: apiUrl,
        VITE_WS_HOST: wsHost,
        VITE_WS_PORT: wsPort,
        VITE_EXTERNAL_PORT: import.meta.env.DEV ? '5000' : '80',
        VITE_REPL_SLUG: import.meta.env.VITE_REPL_SLUG,
        VITE_REPL_OWNER: import.meta.env.VITE_REPL_OWNER,
        VITE_HMR_TIMEOUT: hmrTimeout,
        VITE_HMR_MAX_RETRIES: hmrMaxRetries,
        VITE_HMR_RECONNECT_DELAY_MIN: hmrReconnectDelayMin,
        VITE_HMR_RECONNECT_DELAY_MAX: hmrReconnectDelayMax
      }
    };

    console.debug('[Environment] Configuration:', {
      mode: window.process.env.NODE_ENV,
      wsProtocol,
      wsHost,
      wsPort,
      apiUrl,
      hmrTimeout,
      hmrMaxRetries,
      hmrReconnectDelayMin,
      hmrReconnectDelayMax
    });
  } catch (error) {
    console.error('[Environment] Error initializing process:', error);
    const defaultConfig = getHostInfo();
    window.process = {
      env: {
        NODE_ENV: 'development',
        DEV: 'true',
        PROD: 'false',
        SSR: 'false',
        BASE_URL: '/',
        MODE: 'development',
        VITE_WS_PROTOCOL: defaultConfig.wsProtocol,
        VITE_API_URL: defaultConfig.apiUrl,
        VITE_WS_HOST: defaultConfig.wsHost,
        VITE_WS_PORT: defaultConfig.wsPort,
        VITE_EXTERNAL_PORT: '5000',
        VITE_HMR_TIMEOUT: defaultConfig.hmrTimeout,
        VITE_HMR_MAX_RETRIES: defaultConfig.hmrMaxRetries,
        VITE_HMR_RECONNECT_DELAY_MIN: defaultConfig.hmrReconnectDelayMin,
        VITE_HMR_RECONNECT_DELAY_MAX: defaultConfig.hmrReconnectDelayMax
      }
    };
  }
}

// Environment configuration
const env = {
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
  HMR_MAX_RETRIES: parseInt(window.process.env.VITE_HMR_MAX_RETRIES || '50'),
  HMR_RECONNECT_DELAY_MIN: parseInt(window.process.env.VITE_HMR_RECONNECT_DELAY_MIN || '1000'),
  HMR_RECONNECT_DELAY_MAX: parseInt(window.process.env.VITE_HMR_RECONNECT_DELAY_MAX || '30000')
} as const;

// Environment helpers
export const isDevelopment = env.DEV;
export const isProduction = env.PROD;
export const baseUrl = env.BASE_URL;

// WebSocket URL helper with enhanced error handling
export const getWebSocketUrl = () => {
  try {
    const protocol = env.WS_PROTOCOL;
    const host = env.WS_HOST;
    const port = env.WS_PORT;
    const wsUrl = `${protocol}://${host}:${port}`;
    console.debug('[WebSocket] Generated URL:', wsUrl, {
      protocol,
      host,
      port,
      env: env.NODE_ENV
    });
    return wsUrl;
  } catch (error) {
    console.error('[WebSocket] Error generating URL:', error);
    const fallbackUrl = isDevelopment ? 'ws://localhost:5173' : 'ws://0.0.0.0:5173';
    console.debug('[WebSocket] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
};

// API URL helper with error handling
export const getApiUrl = () => {
  try {
    console.debug('[API] Using URL:', env.API_URL);
    return env.API_URL;
  } catch (error) {
    console.error('[API] Error getting API URL:', error);
    const fallbackUrl = '/api';
    console.debug('[API] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
};

export { env };
