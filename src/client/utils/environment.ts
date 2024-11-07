// Environment configuration
import { Client } from '@replit/object-storage';

// Environment variables from import.meta.env
const env = {
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL,
  API_URL: import.meta.env.PROD ? '/api' : 'http://localhost:3000/api',
  REPLIT_DB_URL: import.meta.env.REPLIT_DB_URL
};

// Export environment helpers
export const isDevelopment = env.DEV;
export const isProduction = env.PROD;
export const apiBaseUrl = env.API_URL;

// Object storage client singleton
export const objectStorage = new Client();

// Export environment
export default env;
