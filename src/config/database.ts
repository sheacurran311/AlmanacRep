import pkg from 'pg';
const { Pool } = pkg;
import type { PoolConfig, QueryResult, QueryResultRow, PoolClient } from 'pg';

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
    sslmode: 'require'
  }
};

const pool = new Pool(poolConfig);

export class DatabaseManager {
  static async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
      return await client.query<T>(text, params);
    } catch (error) {
      const dbError = error as DatabaseError;
      console.error('Database query error:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        schema: dbError.schema
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
}

export const query = DatabaseManager.query.bind(DatabaseManager);
export default pool;
