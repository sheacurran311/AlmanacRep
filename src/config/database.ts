import pg from 'pg';
const { Pool } = pg;
import type { PoolConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';

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

const pool = new Pool(poolConfig);

// Enhanced connection monitoring
pool.on('connect', () => {
  console.log(`[${new Date().toISOString()}] [DATABASE] New client connected to pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

pool.on('acquire', () => {
  console.log(`[${new Date().toISOString()}] [DATABASE] Client acquired from pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

pool.on('remove', () => {
  console.log(`[${new Date().toISOString()}] [DATABASE] Client removed from pool`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

pool.on('error', (err: Error & { code?: string }) => {
  console.error(`[${new Date().toISOString()}] [DATABASE] Unexpected error on idle client:`, {
    error: err.message,
    code: err.code,
    stack: err.stack,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

export class DatabaseManager {
  static async query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
      const startTime = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - startTime;
      
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
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Query error:`, {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any).code,
        detail: (error as any).detail,
        schema: (error as any).schema,
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
        error: error instanceof Error ? error.message : String(error),
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

  static async initializeDatabase() {
    try {
      console.log(`[${new Date().toISOString()}] [DATABASE] Starting initialization`);
      
      // Read and execute schema.sql
      const schemaPath = path.join(process.cwd(), 'src', 'config', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      await this.query(schemaSql);
      
      // Create default tenant if it doesn't exist
      const checkTenant = await this.query(
        'SELECT id FROM tenants WHERE name = $1',
        ['default']
      );
      
      if (checkTenant.rowCount === 0) {
        console.log('Creating default tenant...');
        await this.query(
          'INSERT INTO tenants (name, display_name) VALUES ($1, $2) RETURNING id',
          ['default', 'Default Tenant']
        );
        console.log('Default tenant created, initializing tenant schema...');
        
        // Initialize tenant-specific schema
        await this.query(`
          CREATE SCHEMA IF NOT EXISTS tenant_default;
          SET search_path TO tenant_default, public;
        `);
      }
      
      // Create admin user if it doesn't exist
      const checkAdmin = await this.query(
        'SELECT id FROM users WHERE email = $1',
        ['admin@example.com']
      );
      
      if (checkAdmin.rowCount === 0) {
        console.log('Creating admin user...');
        await this.query(
          'INSERT INTO users (email, password_hash, role, tenant_id) VALUES ($1, $2, $3, (SELECT id FROM tenants WHERE name = $4))',
          ['admin@example.com', 'admin', 'admin', 'default']
        );
      }
      
      console.log('Database initialization completed successfully');
      console.log(`[${new Date().toISOString()}] [DATABASE] Initialization completed`);
      return true;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Initialization failed:`, error);
      throw error;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.query('SELECT NOW()', []);
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
        error: error instanceof Error ? error.message : String(error),
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

// Export everything needed for backward compatibility
export const query = DatabaseManager.query.bind(DatabaseManager);
export const initializeDatabase = DatabaseManager.initializeDatabase.bind(DatabaseManager);
export { Pool, PoolConfig, PoolClient, QueryResult, QueryResultRow };
export default pool;