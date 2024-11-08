import pg from 'pg';
const { Pool } = pg;
import type { PoolConfig, PoolClient, QueryResult } from 'pg';

// Enhanced pool configuration with detailed documentation
const poolConfig: PoolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000 // Delay before starting keepalive probes
};

const pool = new Pool(poolConfig);

// Enhanced connection monitoring
pool.on('connect', (client) => {
  console.log(`[${new Date().toISOString()}] [DATABASE] New client connected to pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

pool.on('acquire', (client) => {
  console.log(`[${new Date().toISOString()}] [DATABASE] Client acquired from pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

pool.on('remove', (client) => {
  console.log(`[${new Date().toISOString()}] [DATABASE] Client removed from pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

pool.on('error', (err, client) => {
  console.error(`[${new Date().toISOString()}] [DATABASE] Unexpected error on idle client:`, {
    error: err.message,
    stack: err.stack,
    code: err.code,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

export class DatabaseManager {
  static async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
      const startTime = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - startTime;
      
      // Enhanced query logging with performance metrics
      console.log(`[${new Date().toISOString()}] [DATABASE] Query executed:`, {
        duration: `${duration}ms`,
        rowCount: result.rowCount,
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      });

      if (duration > 1000) {
        console.warn(`[${new Date().toISOString()}] [DATABASE] Slow query detected:`, {
          duration: `${duration}ms`,
          query: text,
          params
        });
      }
      
      return result;
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Query error:`, {
        message: error.message,
        code: error.code,
        detail: error.detail,
        schema: error.schema,
        query: text,
        params,
        timestamp: new Date().toISOString(),
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      });
      throw error;
    } finally {
      client.release();
    }
  }

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
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      });
      throw error;
    } finally {
      client.release();
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.query('SELECT NOW()');
      const duration = Date.now() - startTime;
      
      console.log(`[${new Date().toISOString()}] [DATABASE] Connection test successful:`, {
        duration: `${duration}ms`,
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      });
      
      return result.rowCount === 1;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Connection test failed:`, {
        error,
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      });
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
export default pool;
