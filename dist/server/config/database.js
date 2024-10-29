import { Pool } from 'pg';
const poolConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
};
const pool = new Pool(poolConfig);
export class DatabaseManager {
    static async query(text, params) {
        const client = await pool.connect();
        try {
            return await client.query(text, params);
        }
        catch (error) {
            const dbError = error;
            console.error('Database query error:', {
                message: dbError.message,
                code: dbError.code,
                detail: dbError.detail
            });
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
export const query = DatabaseManager.query.bind(DatabaseManager);
export default pool;
