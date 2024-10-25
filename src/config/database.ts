import { Pool, PoolConfig, PoolClient } from 'pg';
import { getTenantSchema } from './supabase';

const poolConfig: PoolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
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

  static async validateSchema(schemaName: string): Promise<boolean> {
    const result = await this.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1",
      [schemaName]
    );
    return result.rows.length > 0;
  }

  static async ensureSchema(tenantId: string): Promise<void> {
    const schemaName = getTenantSchema(tenantId);
    if (!(await this.validateSchema(schemaName))) {
      throw new Error(`Schema ${schemaName} does not exist`);
    }
  }

  static async setTenantContext(client: PoolClient, tenantId: string): Promise<void> {
    await client.query('SELECT set_current_tenant($1)', [tenantId]);
    const schemaName = getTenantSchema(tenantId);
    await client.query(`SET search_path TO ${schemaName}, public`);
  }

  static async query(text: string, params?: any[], tenantId?: string) {
    return this.withTransaction(async (client) => {
      if (tenantId) {
        await this.setTenantContext(client, tenantId);
      }
      try {
        return await client.query(text, params);
      } catch (error) {
        console.error('Database query error:', error);
        throw error;
      }
    });
  }

  static async getTenantDB(tenantId: string) {
    // Validate schema existence before returning tenant DB instance
    await this.ensureSchema(tenantId);
    
    return {
      query: (text: string, params?: any[]) => this.query(text, params, tenantId),
      withTransaction: <T>(callback: (client: PoolClient) => Promise<T>) =>
        this.withTransaction(async (client) => {
          await this.setTenantContext(client, tenantId);
          return callback(client);
        })
    };
  }

  static async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = getTenantSchema(tenantId);
    await this.withTransaction(async (client) => {
      // Create schema and namespace entry
      await client.query('SELECT create_tenant_schema($1)', [tenantId]);
      
      // Set up RLS for the new tenant
      await client.query(`
        SET search_path TO ${schemaName};
        
        -- Create tenant-specific tables with RLS
        CREATE TABLE IF NOT EXISTS tenant_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
        
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          action VARCHAR(255) NOT NULL,
          entity_type VARCHAR(255) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          user_id INTEGER,
          metadata JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      `);
    });
  }

  static async deleteTenantSchema(tenantId: string): Promise<void> {
    const schemaName = getTenantSchema(tenantId);
    await this.withTransaction(async (client) => {
      // Remove namespace entry first
      await client.query('DELETE FROM tenant_namespaces WHERE tenant_id = $1', [tenantId]);
      // Drop the schema
      await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    });
  }

  static async validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
    const result = await this.query(
      'SELECT 1 FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
    return result.rows.length > 0;
  }

  static async getTenantRole(tenantId: string, userId: string): Promise<string> {
    const result = await this.query(
      'SELECT role FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );
    return result.rows[0]?.role || 'user';
  }
}

export const query = DatabaseManager.query.bind(DatabaseManager);
export const getTenantDB = DatabaseManager.getTenantDB.bind(DatabaseManager);
export default pool;
