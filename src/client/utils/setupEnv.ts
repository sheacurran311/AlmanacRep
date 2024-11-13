import { Client } from '@replit/object-storage';

// Object storage interface
export interface ObjectStorage {
  createSignedUrl: (objectPath: string) => Promise<string>;
}

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
    baseUrl: string;
  };
  objectStorage: {
    baseUrl: string;
    bucketId: string;
  };
}

const REPLIT_BUCKET_ID = 'replit-objstore-abf868d0-76be-42b3-ba44-42573994d8a9';

// Initialize object storage client with proper typing
export const objectStorage = new Client({
  bucketId: REPLIT_BUCKET_ID
}) as unknown as ObjectStorage;

// Get domain configuration
export const getReplitDomain = (): string => {
  try {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    return import.meta.env.VITE_REPL_SLUG ? `${import.meta.env.VITE_REPL_SLUG}.repl.co` : '0.0.0.0';
  } catch (error) {
    console.error('[Environment] Error getting domain:', error);
    return '0.0.0.0';
  }
};

// Initialize environment configuration
const initializeConfig = (): EnvConfig => {
  const isDev = import.meta.env.DEV;
  const domain = getReplitDomain();
  const isLocalhost = domain === '0.0.0.0' || domain === 'localhost';

  const config = {
    NODE_ENV: import.meta.env.MODE || 'development',
    isDev,
    isProduction: !isDev,
    host: domain,
    ports: {
      frontend: parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '5173'),
      api: parseInt(import.meta.env.VITE_API_SERVER_PORT || '3001'),
      external: parseInt(import.meta.env.VITE_EXTERNAL_PORT || '5000')
    },
    ws: {
      protocol: isLocalhost ? 'ws' : 'wss',
      host: domain,
      port: isLocalhost ? parseInt(import.meta.env.VITE_API_SERVER_PORT || '3001') : 443,
      reconnect: {
        maxRetries: 100,
        minDelay: 1000,
        maxDelay: 30000,
        timeout: 30000
      }
    },
    api: {
      protocol: isLocalhost ? 'http' : 'https',
      host: domain,
      port: isLocalhost ? parseInt(import.meta.env.VITE_API_SERVER_PORT || '3001') : 443,
      baseUrl: ''
    },
    objectStorage: {
      baseUrl: import.meta.env.VITE_OBJECT_STORAGE_URL || '',
      bucketId: REPLIT_BUCKET_ID
    }
  };

  config.api.baseUrl = isLocalhost
    ? `${config.api.protocol}://${config.host}:${config.api.port}`
    : `${config.api.protocol}://${config.host}`;

  return config;
};

// Initialize configuration
let config: EnvConfig;
try {
  config = initializeConfig();
  console.log('[Environment] Configuration initialized:', {
    nodeEnv: config.NODE_ENV,
    isDev: config.isDev,
    apiBaseUrl: config.api.baseUrl,
    wsConfig: {
      protocol: config.ws.protocol,
      host: config.ws.host,
      port: config.ws.port
    }
  });
} catch (error) {
  console.error('[Environment] Critical initialization error:', error);
  throw error;
}

export const getSignedUrl = async (objectPath: string): Promise<string> => {
  try {
    if (config.isDev) {
      const signedUrl = await objectStorage.createSignedUrl(objectPath);
      return signedUrl;
    }
    return `/${objectPath}`;
  } catch (error) {
    console.error('[ObjectStorage] Error getting signed URL:', error);
    return `/${objectPath}`;
  }
};

// Export environment helpers
export const isDevelopment = config.isDev;
export const isProduction = config.isProduction;
export const getWebSocketUrl = () => `${config.ws.protocol}://${config.ws.host}${config.ws.port !== 443 ? `:${config.ws.port}` : ''}`;
export const getApiUrl = () => config.api.baseUrl;

// Export configuration
export const env = config;

// Define process.env for the browser environment
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      NODE_ENV: config.NODE_ENV,
      VITE_DEV_SERVER_PORT: String(config.ports.frontend),
      VITE_API_SERVER_PORT: String(config.ports.api),
      VITE_API_BASE_URL: config.api.baseUrl,
      VITE_WS_PROTOCOL: config.ws.protocol,
      VITE_WS_HOST: config.host,
      VITE_WS_PORT: String(config.ws.port)
    }
  };
}
