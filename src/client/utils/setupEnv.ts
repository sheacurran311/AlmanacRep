// Type declarations
declare global {
  interface Window {
    process: Process;
  }
}

import { Client } from '@replit/object-storage';

// Define Process interface
interface Process {
  env: ProcessEnv;
}

// Define ProcessEnv interface
interface ProcessEnv {
  NODE_ENV: string;
  VITE_DEV_SERVER_PORT?: string;
  VITE_API_SERVER_PORT?: string;
  VITE_API_BASE_URL?: string;
  VITE_WS_PROTOCOL?: string;
  VITE_WS_HOST?: string;
  VITE_WS_PORT?: string;
  [key: string]: string | undefined;
}

// Initialize process in window if it doesn't exist
if (typeof window !== 'undefined') {
  window.process = window.process || {
    env: {
      NODE_ENV: import.meta.env.MODE || 'development',
      VITE_DEV_SERVER_PORT: import.meta.env.VITE_DEV_SERVER_PORT,
      VITE_API_SERVER_PORT: import.meta.env.VITE_API_SERVER_PORT,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_WS_PROTOCOL: import.meta.env.VITE_WS_PROTOCOL,
      VITE_WS_HOST: import.meta.env.VITE_WS_HOST,
      VITE_WS_PORT: import.meta.env.VITE_WS_PORT
    }
  };
}

// Object storage interface
export interface ObjectStorage {
  createSignedUrl: (objectPath: string) => Promise<string>;
}

// Initialize object storage client with proper typing
export const objectStorage = new Client({
  bucketId: 'replit-objstore-abf868d0-76be-42b3-ba44-42573994d8a9'
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

// Initialize configuration
const config = {
  NODE_ENV: import.meta.env.MODE || 'development',
  isDev: import.meta.env.DEV,
  isProduction: !import.meta.env.DEV,
  host: getReplitDomain(),
  api: {
    protocol: getReplitDomain() === '0.0.0.0' ? 'http' : 'https',
    baseUrl: ''
  }
};

// Set API base URL
config.api.baseUrl = config.isDev
  ? `${config.api.protocol}://${config.host}:${import.meta.env.VITE_API_SERVER_PORT || '3001'}`
  : `${config.api.protocol}://${config.host}`;

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
export const getApiUrl = () => config.api.baseUrl;

// Export configuration
export const env = config;
