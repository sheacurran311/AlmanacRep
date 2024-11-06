import { DatabaseManager } from '../config/database';

export class TenantManager {
  static async createTenant(name: string, apiKey: string) {
    try {
      // Start transaction
      await DatabaseManager.query('BEGIN');
      
      // Create tenant record
      const result = await DatabaseManager.query(
        'INSERT INTO tenants (company_name, api_key) VALUES ($1, $2) RETURNING id',
        [name, apiKey]
      );
      
      const tenantId = result.rows[0].id;
      
      // Create tenant schema using database function
      await DatabaseManager.query('SELECT create_tenant_schema($1)', [tenantId]);
      
      await DatabaseManager.query('COMMIT');
      return tenantId;
    } catch (error) {
      await DatabaseManager.query('ROLLBACK');
      throw error;
    }
  }

  static async deleteTenant(tenantId: string) {
    try {
      await DatabaseManager.query('BEGIN');
      
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
      
      // Drop tenant schema
      await DatabaseManager.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
      
      // Delete tenant record
      await DatabaseManager.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      
      await DatabaseManager.query('COMMIT');
    } catch (error) {
      await DatabaseManager.query('ROLLBACK');
      throw error;
    }
  }

  static async validateTenantAccess(apiKey: string): Promise<{ id: string; name: string }> {
    const result = await DatabaseManager.query(
      'SELECT id, company_name as name FROM tenants WHERE api_key = $1',
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid API key');
    }
    
    return result.rows[0];
  }
}
