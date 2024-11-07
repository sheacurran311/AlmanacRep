// Environment configuration
import { Client } from '@replit/object-storage';

// Environment variables
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEV: process.env.NODE_ENV !== 'production',
  PROD: process.env.NODE_ENV === 'production',
  BASE_URL: '/',
  API_URL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api',
  REPLIT_DB_URL: process.env.REPLIT_DB_URL
};

// Export environment helpers
export const isDevelopment = env.DEV;
export const isProduction = env.PROD;
export const apiBaseUrl = env.API_URL;

// Object storage client singleton
export const objectStorage = new Client();

// Export environment
export default env;
