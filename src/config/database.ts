import pg from 'pg';
const { Pool } = pg;
import type { PoolConfig, PoolClient, QueryResult } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  // Enhanced connection handling
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

const pool = new Pool(poolConfig);

// Add connection error handling
pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('[DATABASE] New client connected to pool');
});

export class DatabaseManager {
  static async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
      const startTime = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        console.warn(`[${new Date().toISOString()}] [DATABASE] Slow query (${duration}ms):`, text);
      }
      
      return result;
    } catch (error: any) {
      console.error('[DATABASE] Query error:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        schema: error.schema,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      client.release();
    }
  }

  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      return result.rowCount === 1;
    } catch (error) {
      console.error('[DATABASE] Connection test failed:', error);
      return false;
    }
  }
}

export const query = DatabaseManager.query.bind(DatabaseManager);
export default pool;
