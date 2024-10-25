export const constants = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
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
  }
};

export const roles = {
  ADMIN: 'admin',
  USER: 'user',
  CLIENT: 'client',
  TENANT_ADMIN: 'tenant_admin',
};

export const schemaConfig = {
  MAX_TENANTS: 1000,
  DEFAULT_SCHEMA: 'public',
  SCHEMA_PREFIX: 'tenant_',
};

export const tenantConfig = {
  MAX_USERS_PER_TENANT: 10000,
  MAX_REWARDS_PER_TENANT: 1000,
  DEFAULT_POINTS_EXPIRY_DAYS: 365,
};
