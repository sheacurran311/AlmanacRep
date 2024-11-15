import { createObjectStorageClient } from './objectStorageClient';
import { validateConfig, validateEnvironment, validateLogLevel, validateLogFormat } from '../../utils/configValidation';

const REPLIT_BUCKET_ID = 'replit-objstore-abf868d0-76be-42b3-ba44-42573994d8a9';
const DEFAULT_LOGO_PATH = '/public/assets/almanaclogo.png';
const MAX_LOGO_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_CACHE_SIZE = 100;

// Update object storage client configuration
const client = createObjectStorageClient({
  bucketId: REPLIT_BUCKET_ID,
  maxRetries: MAX_LOGO_RETRIES,
  initialRetryDelay: INITIAL_RETRY_DELAY,
  maxCacheSize: MAX_CACHE_SIZE,
  cacheDuration: 3600000, // 1 hour cache duration
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
});

// Environment type definitions
export type Environment = 'development' | 'staging' | 'production' | 'test';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'detailed' | 'json' | 'simple';

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
    retryAttempts: number;
    uploadConfig: {
      maxSize: number;
      timeout: number;
      chunkSize: number;
      concurrency: number;
    };
  };
  logging: {
    level: LogLevel;
    format: LogFormat;
    timestamp: boolean;
    console: boolean;
    file: boolean;
    maxFiles?: number;
    maxSize?: number;
    remoteLogging?: {
      enabled: boolean;
      endpoint?: string;
      batchSize?: number;
      flushInterval?: number;
    };
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'fifo';
    redis?: {
      enabled: boolean;
      host?: string;
      port?: number;
      password?: string;
    };
  };
  security: {
    cors: {
      enabled: boolean;
      origins: string[];
      methods: string[];
      credentials: boolean;
      maxAge?: number;
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
      cookieOptions?: {
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
      };
    };
    headers: {
      hsts: boolean;
      noSniff: boolean;
      xssProtection: boolean;
      frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    };
  };
  features: {
    multitenant: boolean;
    analytics: boolean;
    websockets: boolean;
    objectStorage: boolean;
    caching: boolean;
    compression: boolean;
    monitoring: boolean;
  };
  monitoring: {
    enabled: boolean;
    metrics: {
      collection: boolean;
      endpoint?: string;
      interval: number;
    };
    tracing: {
      enabled: boolean;
      samplingRate: number;
    };
    healthCheck: {
      enabled: boolean;
      interval: number;
      timeout: number;
    };
  };
}

const getReplitDomain = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('.repl.co')) {
      return hostname;
    }
  }
  return 'localhost';
};

const initializeConfig = (): EnvConfig => {
  try {
    const mode = validateEnvironment(import.meta.env.MODE || 'development');
    const isDev = mode === 'development';
    const isProduction = mode === 'production';
    const isStaging = mode === 'staging';
    const isTest = mode === 'test';
    
    const domain = getReplitDomain();
    const isLocalDev = domain === 'localhost';
    
    const frontendPort = parseInt(import.meta.env.VITE_DEV_SERVER_PORT || '5173');
    const apiPort = parseInt(import.meta.env.VITE_API_SERVER_PORT || '3001');
    const externalPort = parseInt(import.meta.env.VITE_EXTERNAL_PORT || '80');

    if (isNaN(frontendPort) || isNaN(apiPort) || isNaN(externalPort)) {
      throw new Error('Invalid port configuration');
    }

    const config: EnvConfig = {
      NODE_ENV: mode,
      isDev,
      isProduction,
      isStaging,
      isTest,
      host: domain,
      ports: {
        frontend: isDev ? frontendPort : externalPort,
        api: isDev ? apiPort : 443,
        external: externalPort
      },
      ws: {
        protocol: isDev ? 'ws' : 'wss',
        host: isLocalDev ? 'localhost' : domain,
        port: isDev ? apiPort : 443,
        reconnect: {
          maxRetries: isDev ? 5 : 3,
          minDelay: 1000,
          maxDelay: isDev ? 5000 : 30000,
          timeout: isDev ? 10000 : 30000
        }
      },
      api: {
        protocol: isDev ? 'http' : 'https',
        host: isLocalDev ? 'localhost' : domain,
        port: isDev ? apiPort : 443,
        baseUrl: '',
        timeout: isDev ? 10000 : 30000,
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
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'],
        cacheDuration: isDev ? 300000 : 3600000, // 5 minutes in dev, 1 hour in prod
        retryAttempts: isDev ? 3 : 5,
        uploadConfig: {
          maxSize: isDev ? 10 * 1024 * 1024 : 5 * 1024 * 1024,
          timeout: isDev ? 30000 : 60000,
          chunkSize: 1024 * 1024,
          concurrency: isDev ? 3 : 2
        }
      },
      logging: {
        level: validateLogLevel(isDev ? 'debug' : isProduction ? 'info' : 'debug'),
        format: validateLogFormat(isDev ? 'detailed' : 'json'),
        timestamp: true,
        console: isDev || isStaging,
        file: !isDev,
        maxFiles: isDev ? 5 : 30,
        maxSize: isDev ? 10 * 1024 * 1024 : 100 * 1024 * 1024,
        remoteLogging: isProduction ? {
          enabled: true,
          endpoint: import.meta.env.VITE_REMOTE_LOGGING_URL,
          batchSize: 100,
          flushInterval: 5000
        } : undefined
      },
      cache: {
        enabled: true, // Enable caching even in dev for better performance
        ttl: isDev ? 300 : isProduction ? 3600 : 1800,
        maxSize: isDev ? 100 : isProduction ? 1000 : 500,
        strategy: isDev ? 'fifo' : 'lru',
        redis: isProduction ? {
          enabled: true,
          host: import.meta.env.VITE_REDIS_HOST,
          port: parseInt(import.meta.env.VITE_REDIS_PORT || '6379'),
          password: import.meta.env.VITE_REDIS_PASSWORD
        } : undefined
      },
      security: {
        cors: {
          enabled: true,
          origins: isDev ? ['*'] : [domain],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          credentials: !isDev,
          maxAge: isProduction ? 86400 : 3600
        },
        rateLimit: {
          enabled: !isDev,
          maxRequests: isDev ? 1000 : isProduction ? 100 : 200,
          windowMs: 60000,
          errorMessage: 'Too many requests, please try again later.'
        },
        csrf: {
          enabled: !isDev,
          ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
          cookieOptions: isProduction ? {
            secure: true,
            sameSite: 'strict'
          } : undefined
        },
        headers: {
          hsts: isProduction,
          noSniff: true,
          xssProtection: true,
          frameOptions: isProduction ? 'DENY' : 'SAMEORIGIN'
        }
      },
      features: {
        multitenant: true,
        analytics: !isDev,
        websockets: true,
        objectStorage: true,
        caching: true,
        compression: !isDev,
        monitoring: !isDev
      },
      monitoring: {
        enabled: !isDev,
        metrics: {
          collection: !isDev,
          endpoint: import.meta.env.VITE_METRICS_ENDPOINT,
          interval: isDev ? 30000 : 60000
        },
        tracing: {
          enabled: !isDev,
          samplingRate: isDev ? 1 : isProduction ? 0.1 : 0.5
        },
        healthCheck: {
          enabled: true,
          interval: isDev ? 30000 : 60000,
          timeout: 5000
        }
      }
    };

    // Update API base URL construction
    config.api.baseUrl = isDev
      ? `${config.api.protocol}://${config.api.host}:${config.api.port}`
      : `${config.api.protocol}://${config.host}`;

    return validateConfig(config);
  } catch (error) {
    console.error('[Environment] Configuration validation error:', error);
    throw error;
  }
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

interface ImageLoadOptions {
  fallbackUrl?: string;
  maxRetries?: number;
  initialRetryDelay?: number;
}

export const objectStorage = {
  getSignedUrl: async (objectPath: string, options: ImageLoadOptions = {}): Promise<string> => {
    const {
      fallbackUrl = DEFAULT_LOGO_PATH,
      maxRetries = MAX_LOGO_RETRIES,
      initialRetryDelay = INITIAL_RETRY_DELAY
    } = options;

    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        const signedUrl = await client.getSignedUrl(objectPath);
        if (signedUrl) {
          return signedUrl;
        }
        throw new Error('Failed to get signed URL');
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          const delay = initialRetryDelay * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error('[ObjectStorage] Failed to load image after retries:', lastError);
        return fallbackUrl;
      }
    }

    return fallbackUrl;
  }
};

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
export const getMonitoringConfig = () => config.monitoring;

export const env = config;