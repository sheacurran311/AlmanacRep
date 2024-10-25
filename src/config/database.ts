import { Pool, PoolConfig, PoolClient } from 'pg';
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

export class DatabaseManager {
  private static async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
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

  static async query(text: string, params?: any[], tenantId?: string) {
    return this.withTransaction(async (client) => {
      if (tenantId) {
        await client.query(`SET search_path TO ${getTenantSchema(tenantId)}, public`);
      }
      return client.query(text, params);
    });
  }

  static async getTenantDB(tenantId: string) {
    return {
      query: (text: string, params?: any[]) => this.query(text, params, tenantId),
      withTransaction: <T>(callback: (client: PoolClient) => Promise<T>) =>
        this.withTransaction(async (client) => {
          await client.query(`SET search_path TO ${getTenantSchema(tenantId)}, public`);
          return callback(client);
        })
    };
  }
}

export const query = DatabaseManager.query.bind(DatabaseManager);
export const getTenantDB = DatabaseManager.getTenantDB.bind(DatabaseManager);
export default pool;
