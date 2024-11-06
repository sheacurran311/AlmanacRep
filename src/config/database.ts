import pkg from 'pg';
const { Pool } = pkg;
import type { PoolConfig, QueryResult, QueryResultRow } from 'pg';

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
}

const poolConfig: PoolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false,
    mode: 'require'
  },
  // Add connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

// Add connection error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export class DatabaseManager {
  static async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
      const startTime = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        console.warn(`[${new Date().toISOString()}] [DATABASE] Slow query (${duration}ms):`, text);
      }
      
      return result;
    } catch (error) {
      const dbError = error as DatabaseError;
      console.error('[DATABASE] Query error:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        schema: dbError.schema,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const query = DatabaseManager.query.bind(DatabaseManager);
export default pool;
