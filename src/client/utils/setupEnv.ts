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
    console.debug('[Environment] Using Replit domain:', `${replSlug}.${replOwner}.repl.co`);
    return `${replSlug}.${replOwner}.repl.co`;
  }
  return null;
};

const getHostInfo = () => {
  const defaultConfig = {
    wsProtocol: 'ws',
    wsHost: '0.0.0.0',
    wsPort: '5173',
    apiUrl: 'http://0.0.0.0:3001/api',
    hmrTimeout: '120000',
    hmrMaxRetries: '100',
    hmrReconnectDelayMin: '1000',
    hmrReconnectDelayMax: '30000'
  };

  try {
    const isDev = import.meta.env.DEV;
    const isHttps = window.location.protocol === 'https:';
    const replitDomain = getReplitDomain();
    const hostname = window.location.hostname;

    // Development configuration
    if (isDev) {
      const port = isHttps ? '5000' : '5173';
      const protocol = isHttps ? 'wss' : 'ws';
      const host = hostname || '0.0.0.0';
      
      const devConfig = {
        ...defaultConfig,
        wsProtocol: protocol,
        wsHost: host,
        wsPort: port,
        apiUrl: `http://${host}:3001/api`
      };
      console.debug('[Environment] Development config:', devConfig);
      return devConfig;
    }

    // Replit production configuration
    if (replitDomain) {
      const prodConfig = {
        ...defaultConfig,
        wsProtocol: 'wss',
        wsHost: replitDomain,
        wsPort: '443',
        apiUrl: `https://${replitDomain}/api`
      };
      console.debug('[Environment] Replit production config:', prodConfig);
      return prodConfig;
    }

    // Fallback configuration
    const fallbackConfig = {
      ...defaultConfig,
      wsProtocol: isHttps ? 'wss' : 'ws',
      wsHost: hostname || '0.0.0.0',
      wsPort: isHttps ? '443' : '5173',
      apiUrl: '/api'
    };
    console.debug('[Environment] Fallback config:', fallbackConfig);
    return fallbackConfig;
  } catch (error) {
    console.error('[Environment] Error in getHostInfo:', error);
    return defaultConfig;
  }
};

if (!window.process) {
  const config = getHostInfo();
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
      VITE_EXTERNAL_PORT: import.meta.env.DEV ? '5000' : '443',
      VITE_REPL_SLUG: import.meta.env.VITE_REPL_SLUG,
      VITE_REPL_OWNER: import.meta.env.VITE_REPL_OWNER,
      VITE_HMR_TIMEOUT: config.hmrTimeout,
      VITE_HMR_MAX_RETRIES: config.hmrMaxRetries,
      VITE_HMR_RECONNECT_DELAY_MIN: config.hmrReconnectDelayMin,
      VITE_HMR_RECONNECT_DELAY_MAX: config.hmrReconnectDelayMax
    }
  };
}

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

export const getWebSocketUrl = () => {
  try {
    if (isDevelopment) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = env.WS_HOST;
      const port = window.location.protocol === 'https:' ? '5000' : '5173';
      const wsUrl = `${protocol}://${host}:${port}`;
      console.debug('[WebSocket] Development URL:', wsUrl);
      return wsUrl;
    }

    if (env.REPL_SLUG && env.REPL_OWNER) {
      const wsUrl = `wss://${env.REPL_SLUG}.${env.REPL_OWNER}.repl.co`;
      console.debug('[WebSocket] Production URL:', wsUrl);
      return wsUrl;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = env.WS_HOST;
    const port = env.WS_PORT;
    const wsUrl = `${protocol}://${host}:${port}`;
    console.debug('[WebSocket] Fallback URL:', wsUrl);
    return wsUrl;
  } catch (error) {
    console.error('[WebSocket] Error generating URL:', error);
    return 'ws://0.0.0.0:5173';
  }
};

export const getApiUrl = () => {
  try {
    if (isDevelopment) {
      const host = window.location.protocol === 'https:' ? 
        `${window.location.hostname}:3001` : 
        '0.0.0.0:3001';
      const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
      const apiUrl = `${protocol}://${host}/api`;
      console.debug('[API] Development URL:', apiUrl);
      return apiUrl;
    }

    console.debug('[API] Using URL:', env.API_URL);
    return env.API_URL;
  } catch (error) {
    console.error('[API] Error getting API URL:', error);
    return '/api';
  }
};

export { env };
