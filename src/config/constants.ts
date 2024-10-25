export const constants = {
  PORT: 8000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  STRIPE_KEY: process.env.STRIPE_KEY,
  METAPLEX_RPC: process.env.METAPLEX_RPC || 'https://api.devnet.solana.com',
};

export const roles = {
  ADMIN: 'admin',
  USER: 'user',
  CLIENT: 'client',
};
