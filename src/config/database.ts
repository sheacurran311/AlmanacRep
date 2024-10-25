import pg from 'pg';
const { Pool } = pg;

const poolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : {
    rejectUnauthorized: false
  }
};

const pool = new Pool(poolConfig);

export class DatabaseManager {
  static async query(text: string, params?: any[]) {
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const query = DatabaseManager.query.bind(DatabaseManager);
export default pool;
