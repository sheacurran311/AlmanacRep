import { Pool, PoolConfig, PoolClient } from 'pg';
import { DatabaseManager as BaseDatabaseManager } from '../../config/database.js';

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

export class DatabaseManager extends BaseDatabaseManager {
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
}

export default pool;
