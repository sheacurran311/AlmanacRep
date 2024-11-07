import { Client } from '@replit/object-storage';
import { env, isDevelopment, isProduction, getApiUrl } from './setupEnv';

// Export environment helpers
export { isDevelopment, isProduction, getApiUrl };

// Object storage client singleton
export const objectStorage = new Client();

// Export environment configuration
export { env };
