import { DatabaseManager } from './database.js';

export const getTenantSchema = (tenantId: string) => {
  return `tenant${tenantId.replace(/-/g, '_')}`;
};

export const createTenantSchema = async (tenantId: string) => {
  const schemaName = getTenantSchema(tenantId);
  
  try {
    // Create schema and set RLS
    await DatabaseManager.query(`
      CREATE SCHEMA IF NOT EXISTS ${schemaName};
      
      -- Set default privileges
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName}
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO PUBLIC;
      
      -- Create tenant-specific tables if needed
      SET search_path TO ${schemaName};
      
      -- Add tenant-specific settings table
      CREATE TABLE IF NOT EXISTS tenant_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Add tenant-specific audit logs
      CREATE TABLE IF NOT EXISTS tenant_audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(255) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        user_id UUID,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reset search path after creating tables
    await DatabaseManager.query('SET search_path TO public');

    return schemaName;
  } catch (error) {
    console.error('Error creating tenant schema:', error);
    throw error;
  }
};
