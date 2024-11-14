export const constants = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  INTERNAL_PORT: process.env.INTERNAL_PORT ? parseInt(process.env.INTERNAL_PORT) : 3001,
  EXTERNAL_PORT: process.env.EXTERNAL_PORT ? parseInt(process.env.EXTERNAL_PORT) : 3000, // Updated to 3000
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  STRIPE_KEY: process.env.STRIPE_KEY,
  METAPLEX_RPC: process.env.METAPLEX_RPC || 'https://api.devnet.solana.com',
  SUPABASE: {
    URL: process.env.SUPABASE_URL,
    ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  DATABASE: {
    HOST: process.env.PGHOST,
    PORT: parseInt(process.env.PGPORT || '5432'),
    NAME: process.env.PGDATABASE,
    USER: process.env.PGUSER,
    PASSWORD: process.env.PGPASSWORD,
    URL: process.env.DATABASE_URL,
  },
  DYNAMIC: {
    ENVIRONMENT_ID: process.env.DYNAMIC_ENVIRONMENT_ID,
    API_KEY: process.env.DYNAMIC_API_KEY,
  },
  HELIUS: {
    API_KEY: process.env.HELIUS_API_KEY,
  },
  VITE: {
    DEV_SERVER_PORT: parseInt(process.env.VITE_DEV_SERVER_PORT || '5173'),
    API_SERVER_PORT: parseInt(process.env.VITE_API_SERVER_PORT || '3001'),
    EXTERNAL_PORT: parseInt(process.env.EXTERNAL_PORT || '3000'), // Use external port
    HMR_TIMEOUT: parseInt(process.env.VITE_HMR_TIMEOUT || '30000'),
    HMR_MAX_RETRIES: parseInt(process.env.VITE_HMR_MAX_RETRIES || '100'),
    HMR_RECONNECT_DELAY_MIN: parseInt(process.env.VITE_HMR_RECONNECT_DELAY_MIN || '1000'),
    HMR_RECONNECT_DELAY_MAX: parseInt(process.env.VITE_HMR_RECONNECT_DELAY_MAX || '30000'),
  },
  ENV: {
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
  PORTS: {
    getFrontendPort: () => process.env.NODE_ENV === 'development' ? constants.VITE.DEV_SERVER_PORT : constants.EXTERNAL_PORT,
    getAPIPort: () => process.env.NODE_ENV === 'development' ? constants.INTERNAL_PORT : 443, // Assume HTTPS in production
    getExternalPort: () => constants.EXTERNAL_PORT,
  }
};