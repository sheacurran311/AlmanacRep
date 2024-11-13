import { Client } from '@replit/object-storage';
import streamAPI, { Stream, Readable, Writable, Transform } from './streamPolyfill';
import utilAPI from './utilPolyfill';

const REPLIT_BUCKET_ID = 'replit-objstore-abf868d0-76be-42b3-ba44-42573994d8a9';

interface ExtendedClient extends Client {
  getSignedUrl(objectPath: string): Promise<string>;
}

const client = new Client({ bucketId: REPLIT_BUCKET_ID }) as ExtendedClient;

// Environment type definitions
type Environment = 'development' | 'staging' | 'production' | 'test';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogFormat = 'detailed' | 'json' | 'simple';

interface EnvConfig {
  NODE_ENV: Environment;
  isDev: boolean;
  isProduction: boolean;
  isStaging: boolean;
  isTest: boolean;
  host: string;
  ports: {
    frontend: number;
    api: number;
    external: number;
  };
  ws: {
    protocol: 'ws' | 'wss';
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
    protocol: 'http' | 'https';
    host: string;
    port: number;
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    rateLimiting?: {
      enabled: boolean;
      maxRequests: number;
      timeWindow: number;
    };
  };
  objectStorage: {
    baseUrl: string;
    maxFileSize: number;
    allowedTypes: string[];
    cacheDuration: number;
  };
  logging: {
    level: LogLevel;
    format: LogFormat;
    timestamp: boolean;
    console: boolean;
    file: boolean;
    maxFiles?: number;
    maxSize?: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'fifo';
  };
  security: {
    cors: {
      enabled: boolean;
      origins: string[];
      methods: string[];
      credentials: boolean;
    };
    rateLimit: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
      errorMessage?: string;
    };
    csrf: {
      enabled: boolean;
      ignoreMethods: string[];
    };
  };
  features: {
    multitenant: boolean;
    analytics: boolean;
    websockets: boolean;
    objectStorage: boolean;
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
  const mode = import.meta.env.MODE || 'development';
  const isDev = mode === 'development';
  const isProduction = mode === 'production';
  const isStaging = mode === 'staging';
  const isTest = mode === 'test';
  
  const domain = getReplitDomain();
  const isLocalhost = domain === '0.0.0.0';

  // Environment-specific port configuration
  const frontendPort = parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '5173');
  const apiPort = parseInt(import.meta.env.VITE_API_SERVER_PORT || '3001');
  const externalPort = parseInt(import.meta.env.VITE_EXTERNAL_PORT || '5000');

  const config: EnvConfig = {
    NODE_ENV: mode as Environment,
    isDev,
    isProduction,
    isStaging,
    isTest,
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
        maxRetries: isDev ? 100 : 5,
        minDelay: isDev ? 1000 : 5000,
        maxDelay: isDev ? 30000 : 60000,
        timeout: isDev ? 30000 : 60000
      }
    },
    api: {
      protocol: isLocalhost ? 'http' : 'https',
      host: isLocalhost ? '0.0.0.0' : domain,
      port: isLocalhost ? apiPort : 443,
      baseUrl: '',
      timeout: isDev ? 30000 : 60000,
      retryAttempts: isDev ? 3 : 5,
      rateLimiting: !isDev ? {
        enabled: true,
        maxRequests: isProduction ? 100 : 200,
        timeWindow: 60000
      } : undefined
    },
    objectStorage: {
      baseUrl: import.meta.env.VITE_OBJECT_STORAGE_URL || '',
      maxFileSize: isDev ? 10 * 1024 * 1024 : 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      cacheDuration: isDev ? 0 : isProduction ? 3600 : 1800
    },
    logging: {
      level: isDev ? 'debug' : isProduction ? 'info' : 'debug',
      format: isDev ? 'detailed' : 'json',
      timestamp: true,
      console: isDev || isStaging,
      file: !isDev,
      maxFiles: isDev ? 5 : 30,
      maxSize: isDev ? 10 * 1024 * 1024 : 100 * 1024 * 1024
    },
    cache: {
      enabled: !isDev,
      ttl: isDev ? 300 : isProduction ? 3600 : 1800,
      maxSize: isDev ? 100 : isProduction ? 1000 : 500,
      strategy: isDev ? 'fifo' : 'lru'
    },
    security: {
      cors: {
        enabled: true,
        origins: isDev ? ['*'] : [domain],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: !isDev
      },
      rateLimit: {
        enabled: !isDev,
        maxRequests: isDev ? 1000 : isProduction ? 100 : 200,
        windowMs: 60000,
        errorMessage: 'Too many requests, please try again later.'
      },
      csrf: {
        enabled: !isDev,
        ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
      }
    },
    features: {
      multitenant: true,
      analytics: !isDev,
      websockets: true,
      objectStorage: true
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

// Utility functions
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

// Exports
export const getSignedUrl = objectStorage.getSignedUrl;
export const isDevelopment = config.isDev;
export const isProduction = config.isProduction;
export const isStaging = config.isStaging;
export const isTest = config.isTest;
export const getWebSocketUrl = () => 
  `${config.ws.protocol}://${config.ws.host}${config.ws.port !== 443 ? `:${config.ws.port}` : ''}`;
export const getApiUrl = () => config.api.baseUrl;
export const getCacheConfig = () => config.cache;
export const getLoggingConfig = () => config.logging;
export const getSecurityConfig = () => config.security;
export const getFeaturesConfig = () => config.features;

export const stream = streamAPI;
export const util = utilAPI;
export { Stream, Readable, Writable, Transform };
export const env = config;
