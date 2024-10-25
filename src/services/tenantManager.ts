import { query } from '../config/database';
import { createTenantSchema, getTenantSchema } from '../config/supabase';

export class TenantManager {
  static async createTenant(name: string, apiKey: string) {
    const client = await query('BEGIN');
    try {
      // Create tenant record
      const result = await query(
        'INSERT INTO tenants (name, api_key) VALUES ($1, $2) RETURNING id',
        [name, apiKey]
      );
      
      const tenantId = result.rows[0].id;
      
      // Create tenant schema
      await createTenantSchema(tenantId.toString());
      
      // Initialize tenant-specific tables in their schema
      const schemaName = getTenantSchema(tenantId.toString());
      await query(`
        SET search_path TO ${schemaName};
        
        CREATE TABLE IF NOT EXISTS tenant_settings (
          key VARCHAR(255) PRIMARY KEY,
          value JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          action VARCHAR(255) NOT NULL,
          entity_type VARCHAR(255) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          user_id INTEGER,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await query('COMMIT');
      return tenantId;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async deleteTenant(tenantId: string) {
    const client = await query('BEGIN');
    try {
      const schemaName = getTenantSchema(tenantId);
      
      // Drop tenant schema
      await query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
      
      // Delete tenant record
      await query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      
      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async validateTenantAccess(apiKey: string, resource: string) {
    const result = await query(
      'SELECT id, name FROM tenants WHERE api_key = $1',
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid API key');
    }
    
    return result.rows[0];
  }
}
