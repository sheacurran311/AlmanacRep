// Enhanced type declarations for Process interface
interface CustomProcess extends Partial<NodeJS.Process> {
  env: Record<string, string>;
  title?: string;
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
  };
}

// Object storage interface
export interface ObjectStorage {
  getSignedUrl: (objectPath: string) => Promise<string>;
}

// Get domain configuration
export const getReplitDomain = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Always return the actual hostname
      return hostname;
    }
    return process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.repl.co` : '0.0.0.0';
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
      baseUrl: import.meta.env.VITE_OBJECT_STORAGE_URL || ''
    }
  };

  // Set API base URL correctly for development and production
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

// Object storage implementation with local fallback
export const objectStorage: ObjectStorage = {
  getSignedUrl: async (objectPath: string): Promise<string> => {
    // For development, return local path
    if (config.isDev) {
      return `/${objectPath}`;
    }
    // For production, implement proper signed URL logic
    try {
      const response = await fetch(`${config.api.baseUrl}/api/storage/sign?path=${encodeURIComponent(objectPath)}`);
      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('[ObjectStorage] Error getting signed URL:', error);
      return `/${objectPath}`;  // Fallback to local path
    }
  }
};

// Initialize process.env in browser environment
if (typeof window !== 'undefined') {
  try {
    const processEnv: Record<string, string> = {
      NODE_ENV: config.NODE_ENV,
      DEV: String(config.isDev),
      PROD: String(config.isProduction),
      BASE_URL: import.meta.env.BASE_URL || '/',
      MODE: config.NODE_ENV,
      VITE_API_BASE_URL: config.api.baseUrl,
      VITE_WS_PROTOCOL: config.ws.protocol,
      VITE_WS_HOST: config.host,
      VITE_WS_PORT: String(config.ws.port),
      VITE_DEV_SERVER_PORT: String(config.ports.frontend),
      VITE_API_SERVER_PORT: String(config.ports.api)
    };

    if (!window.process) {
      (window as any).process = {
        env: processEnv,
        title: 'browser',
      } as CustomProcess;
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
export const getWebSocketUrl = () => `${config.ws.protocol}://${config.ws.host}${config.ws.port !== 443 ? `:${config.ws.port}` : ''}`;
export const getApiUrl = () => config.api.baseUrl;

// Export configuration
export const env = config;
