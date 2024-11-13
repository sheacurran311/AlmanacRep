import { Client } from '@replit/object-storage';
import StreamModule from './streamPolyfill';

const REPLIT_BUCKET_ID = 'replit-objstore-abf868d0-76be-42b3-ba44-42573994d8a9';

interface ExtendedClient extends Client {
  getSignedUrl(objectPath: string): Promise<string>;
}

const client = new Client({ bucketId: REPLIT_BUCKET_ID }) as ExtendedClient;

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
  };
}

const getReplitDomain = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname.includes('.repl.co') ? hostname : '0.0.0.0';
  }
  return '0.0.0.0';
};

const initializeConfig = (): EnvConfig => {
  const isDev = import.meta.env.MODE === 'development';
  const domain = getReplitDomain();
  const isLocalhost = domain === '0.0.0.0';

  // Get ports from environment or use defaults
  const frontendPort = parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '5173');
  const apiPort = parseInt(import.meta.env.VITE_API_SERVER_PORT || '3001');
  const externalPort = parseInt(import.meta.env.VITE_EXTERNAL_PORT || '5000');

  const config: EnvConfig = {
    NODE_ENV: import.meta.env.MODE || 'development',
    isDev,
    isProduction: !isDev,
    host: domain,
    ports: {
      frontend: isDev ? frontendPort : externalPort,
      api: apiPort,
      external: externalPort
    },
    ws: {
      protocol: isLocalhost ? 'ws' : 'wss',
      host: domain,
      port: isLocalhost ? apiPort : 443,
      reconnect: {
        maxRetries: 100,
        minDelay: 1000,
        maxDelay: 30000,
        timeout: 30000
      }
    },
    api: {
      protocol: isLocalhost ? 'http' : 'https',
      host: isLocalhost ? '0.0.0.0' : domain,
      port: isLocalhost ? apiPort : 443,
      baseUrl: ''
    },
    objectStorage: {
      baseUrl: import.meta.env.VITE_OBJECT_STORAGE_URL || ''
    }
  };

  // Set API base URL based on environment
  config.api.baseUrl = isLocalhost
    ? `${config.api.protocol}://0.0.0.0:${config.api.port}`
    : `${config.api.protocol}://${config.host}`;

  return config;
};

let config: EnvConfig;
try {
  config = initializeConfig();
  console.log('[Environment] Configuration initialized:', {
    nodeEnv: config.NODE_ENV,
    isDev: config.isDev,
    host: config.host,
    ports: config.ports,
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

export const objectStorage = {
  getSignedUrl: async (objectPath: string): Promise<string> => {
    if (config.isDev) {
      try {
        return await client.getSignedUrl(objectPath);
      } catch (error) {
        console.error('[ObjectStorage] Error getting signed URL:', error);
        return `/${objectPath}`;
      }
    }
    return `/${objectPath}`;
  }
};

export const getSignedUrl = objectStorage.getSignedUrl;
export const isDevelopment = config.isDev;
export const isProduction = config.isProduction;
export const getWebSocketUrl = () => `${config.ws.protocol}://${config.ws.host}${config.ws.port !== 443 ? `:${config.ws.port}` : ''}`;
export const getApiUrl = () => config.api.baseUrl;
export const stream = StreamModule;
export const env = config;
