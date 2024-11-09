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

// Enhanced error handling
pool.on('error', (err: Error & { code?: string }) => {
  console.error(`[${new Date().toISOString()}] [DATABASE] Unexpected error on idle client:`, {
    error: err.message,
    code: err.code,
    stack: err.stack
  });
});

pool.on('connect', () => {
  console.log(`[${new Date().toISOString()}] [DATABASE] New client connected to pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

export class DatabaseManager extends BaseDatabaseManager {
  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      const startTime = Date.now();
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      const duration = Date.now() - startTime;
      
      console.log(`[${new Date().toISOString()}] [DATABASE] Transaction completed:`, {
        duration: `${duration}ms`,
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      });
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[${new Date().toISOString()}] [DATABASE] Transaction failed:`, {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

export default pool;
