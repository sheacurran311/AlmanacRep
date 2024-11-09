// Enhanced type declarations for Process interface
interface Process {
  env: Record<string, string>;
  // ... other process interface properties remain unchanged
}

// Enhanced type declarations for Vite's import.meta.env
declare global {
  interface ImportMetaEnv {
    MODE: string;
    DEV: boolean;
    PROD: boolean;
    SSR: boolean;
    BASE_URL: string;
    VITE_REPL_SLUG?: string;
    VITE_REPL_OWNER?: string;
    VITE_DEV_SERVER_PORT?: string;
    VITE_API_SERVER_PORT?: string;
    VITE_EXTERNAL_PORT?: string;
    VITE_HMR_TIMEOUT?: string;
    VITE_HMR_MAX_RETRIES?: string;
    VITE_HMR_RECONNECT_DELAY_MIN?: string;
    VITE_HMR_RECONNECT_DELAY_MAX?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
      readonly accept: Function;
      readonly dispose: Function;
      readonly invalidate: Function;
      readonly on: Function;
      readonly send: Function;
      readonly data: any;
      readonly socket?: WebSocket;
    }
  }

  interface Window {
    process: Process;
  }
}

// Import constants from main config
import { constants } from '../../config/constants';

// Environment configuration interface
interface EnvConfig {
  NODE_ENV: string;
  isDev: boolean;
  isProduction: boolean;
  host: string;
  ports: {
    frontend: number;
    api: number;
    external: number;
  };
  ws: {
    protocol: string;
    host: string;
    port: number;
    reconnect: {
      maxRetries: number;
      minDelay: number;
      maxDelay: number;
      timeout: number;
    };
  };
  api: {
    protocol: string;
    host: string;
    port: number;
  };
}

// Enhanced domain configuration
export const getReplitDomain = (): string => {
  try {
    const replSlug = import.meta.env.VITE_REPL_SLUG;
    const replOwner = import.meta.env.VITE_REPL_OWNER;
    
    if (replSlug && replOwner) {
      return `${replSlug}.${replOwner}.repl.co`;
    }
    return '0.0.0.0';
  } catch (error) {
    console.error('[Environment] Error getting Replit domain:', error);
    return '0.0.0.0';
  }
};

// Initialize environment configuration
const initializeConfig = (): EnvConfig => {
  const isDev = import.meta.env.DEV;
  const domain = getReplitDomain();
  const isLocalhost = domain === '0.0.0.0';

  return {
    NODE_ENV: import.meta.env.MODE || 'development',
    isDev,
    isProduction: !isDev,
    host: domain,
    ports: {
      frontend: constants.VITE.DEV_SERVER_PORT,
      api: constants.VITE.API_SERVER_PORT,
      external: constants.VITE.EXTERNAL_PORT
    },
    ws: {
      protocol: isLocalhost ? 'ws' : 'wss',
      host: domain,
      port: isLocalhost ? constants.VITE.DEV_SERVER_PORT : 443,
      reconnect: {
        maxRetries: constants.VITE.HMR_MAX_RETRIES,
        minDelay: constants.VITE.HMR_RECONNECT_DELAY_MIN,
        maxDelay: constants.VITE.HMR_RECONNECT_DELAY_MAX,
        timeout: constants.VITE.HMR_TIMEOUT
      }
    },
    api: {
      protocol: isLocalhost ? 'http' : 'https',
      host: domain,
      port: isLocalhost ? constants.VITE.API_SERVER_PORT : 80
    }
  };
};

// Initialize configuration
let config: EnvConfig;
try {
  config = initializeConfig();
} catch (error) {
  console.error('[Environment] Critical initialization error:', error);
  throw error;
}

// Initialize process.env in browser environment
if (typeof window !== 'undefined') {
  try {
    const processEnv: Record<string, string> = {
      NODE_ENV: import.meta.env.MODE || 'development',
      DEV: String(import.meta.env.DEV),
      PROD: String(import.meta.env.PROD),
      SSR: String(import.meta.env.SSR),
      BASE_URL: import.meta.env.BASE_URL || '/',
      MODE: import.meta.env.MODE || 'development',
      VITE_WS_PROTOCOL: config.ws.protocol,
      VITE_API_URL: `${config.api.protocol}://${config.api.host}:${config.api.port}`,
      VITE_WS_HOST: config.host,
      VITE_WS_PORT: String(config.ws.port),
      VITE_EXTERNAL_PORT: String(config.ports.external),
      VITE_DEV_SERVER_PORT: String(config.ports.frontend),
      VITE_API_SERVER_PORT: String(config.ports.api),
      VITE_HMR_TIMEOUT: String(config.ws.reconnect.timeout),
      VITE_HMR_MAX_RETRIES: String(config.ws.reconnect.maxRetries),
      VITE_HMR_RECONNECT_DELAY_MIN: String(config.ws.reconnect.minDelay),
      VITE_HMR_RECONNECT_DELAY_MAX: String(config.ws.reconnect.maxDelay)
    };

    if (!window.process) {
      window.process = {
        env: processEnv,
        title: 'browser'
      } as Process;
    } else {
      window.process.env = { ...window.process.env, ...processEnv };
    }
  } catch (error) {
    console.error('[Environment] Error initializing process.env:', error);
    throw error;
  }
}

// Export environment helpers
export const isDevelopment = config.isDev;
export const isProduction = config.isProduction;
export const getWebSocketUrl = () => `${config.ws.protocol}://${config.ws.host}:${config.ws.port}`;
export const getApiUrl = () => `${config.api.protocol}://${config.api.host}:${config.api.port}`;

// Export configuration
export const env = config;
