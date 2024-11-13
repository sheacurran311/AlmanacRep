// Initialize process for browser environment first
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {}
  };
}

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

// Validation interfaces
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

const REPLIT_BUCKET_ID = 'replit-objstore-abf868d0-76be-42b3-ba44-42573994d8a9';

// Initialize object storage client with proper typing
export const objectStorage = new Client({
  bucketId: REPLIT_BUCKET_ID
}) as unknown as ObjectStorage;

// Environment variable validation
const validateEnvironmentVariables = (): ValidationError[] => {
  const errors: ValidationError[] = [];
  const requiredVars = [
    'VITE_DEV_SERVER_PORT',
    'VITE_API_SERVER_PORT',
    'MODE'
  ];

  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      errors.push({
        field: varName,
        message: `Required environment variable ${varName} is missing`,
        severity: 'error'
      });
    }
  }

  return errors;
};

// Validate port number
const validatePort = (port: number, fieldName: string): ValidationError | null => {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    return {
      field: fieldName,
      message: `Invalid port number: ${port}. Must be between 0 and 65535`,
      severity: 'error'
    };
  }
  return null;
};

// Validate URL protocol
const validateProtocol = (protocol: string, fieldName: string): ValidationError | null => {
  if (!['http', 'https', 'ws', 'wss'].includes(protocol)) {
    return {
      field: fieldName,
      message: `Invalid protocol: ${protocol}. Must be one of: http, https, ws, wss`,
      severity: 'error'
    };
  }
  return null;
};

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

// Validate configuration
const validateConfig = (config: EnvConfig): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Environment variable validation
  errors.push(...validateEnvironmentVariables());

  // Validate ports
  const portFields = {
    'ports.frontend': config.ports.frontend,
    'ports.api': config.ports.api,
    'ports.external': config.ports.external,
    'ws.port': config.ws.port,
    'api.port': config.api.port
  };

  Object.entries(portFields).forEach(([field, port]) => {
    const error = validatePort(port, field);
    if (error) errors.push(error);
  });

  // Validate protocols
  const protocolFields = {
    'ws.protocol': config.ws.protocol,
    'api.protocol': config.api.protocol
  };

  Object.entries(protocolFields).forEach(([field, protocol]) => {
    const error = validateProtocol(protocol, field);
    if (error) errors.push(error);
  });

  // Validate reconnection settings
  if (config.ws.reconnect.maxRetries < 1) {
    errors.push({
      field: 'ws.reconnect.maxRetries',
      message: 'Maximum retries must be at least 1',
      severity: 'error'
    });
  }

  if (config.ws.reconnect.minDelay < 0) {
    errors.push({
      field: 'ws.reconnect.minDelay',
      message: 'Minimum delay must be non-negative',
      severity: 'error'
    });
  }

  if (config.ws.reconnect.maxDelay < config.ws.reconnect.minDelay) {
    errors.push({
      field: 'ws.reconnect.maxDelay',
      message: 'Maximum delay must be greater than minimum delay',
      severity: 'error'
    });
  }

  // Environment-specific validations
  if (config.isProduction) {
    if (config.api.protocol !== 'https') {
      errors.push({
        field: 'api.protocol',
        message: 'Production environment must use HTTPS',
        severity: 'error'
      });
    }
    if (config.ws.protocol !== 'wss') {
      errors.push({
        field: 'ws.protocol',
        message: 'Production environment must use WSS',
        severity: 'error'
      });
    }
  } else {
    // Development-specific warnings
    if (config.api.protocol === 'https') {
      warnings.push({
        field: 'api.protocol',
        message: 'Using HTTPS in development environment',
        severity: 'warning'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
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

  const validationResult = validateConfig(config);
  
  // Log validation results
  if (validationResult.warnings.length > 0) {
    console.warn('[Environment] Configuration warnings:', validationResult.warnings);
  }
  
  if (!validationResult.isValid) {
    console.error('[Environment] Configuration validation failed:', validationResult.errors);
    if (config.isProduction) {
      throw new Error('Invalid production configuration');
    }
  }

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

// Define process.env for the browser environment
if (typeof window !== 'undefined') {
  window.process.env = {
    NODE_ENV: config.NODE_ENV,
    VITE_DEV_SERVER_PORT: String(config.ports.frontend),
    VITE_API_SERVER_PORT: String(config.ports.api),
    VITE_API_BASE_URL: config.api.baseUrl,
    VITE_WS_PROTOCOL: config.ws.protocol,
    VITE_WS_HOST: config.host,
    VITE_WS_PORT: String(config.ws.port)
  };
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
