import pg from 'pg';
const { Pool } = pg;
import type { PoolConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

export const pool = new Pool(poolConfig);

// Enhanced connection monitoring
pool.on('connect', () => {
  console.log(`[${new Date().toISOString()}] [DATABASE] New client connected to pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

pool.on('error', (err: Error) => {
  console.error(`[${new Date().toISOString()}] [DATABASE] Unexpected error:`, {
    error: err.message,
    stack: err.stack
  });
});

export class DatabaseManager {
  static async query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
      const result = await client.query<T>(text, params);
      return result;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Query error:`, {
        message: error instanceof Error ? error.message : String(error),
        query: text,
        params
      });
      throw error;
    } finally {
      client.release();
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT NOW()', []);
      return true;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Connection test failed:`, error);
      return false;
    }
  }

  static async getPoolMetrics() {
    return {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
      timestamp: new Date().toISOString()
    };
  }
}

export const query = DatabaseManager.query.bind(DatabaseManager);
export default { pool, DatabaseManager, query };