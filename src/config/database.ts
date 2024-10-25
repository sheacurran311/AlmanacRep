import { Pool, PoolConfig } from 'pg';
import { getTenantSchema } from './supabase';

const poolConfig: PoolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
};

const pool = new Pool(poolConfig);

export const query = async (text: string, params?: any[], tenantId?: string) => {
  const client = await pool.connect();
  try {
    if (tenantId) {
      // Set the search path to the tenant's schema
      await client.query(`SET search_path TO ${getTenantSchema(tenantId)}, public`);
    }
    const result = await client.query(text, params);
    return result;
  } finally {
    if (tenantId) {
      // Reset search path
      await client.query('SET search_path TO public');
    }
    client.release();
  }
};

export const getTenantDB = async (tenantId: string) => {
  return {
    query: (text: string, params?: any[]) => query(text, params, tenantId)
  };
};

export default pool;
