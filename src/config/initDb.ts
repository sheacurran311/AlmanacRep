import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from '@/config/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('Starting database initialization...');
    
    // Test database connection
    await DatabaseManager.query('SELECT NOW()');
    console.log('Database connection successful');

    // Enable UUID extension first
    console.log('Enabling UUID extension...');
    await DatabaseManager.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Read and execute schema in chunks to better handle errors
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema within transaction
    console.log('Executing schema...');
    await DatabaseManager.query('BEGIN');
    await DatabaseManager.query(schema);
    
    // Create default tenant if it doesn't exist
    console.log('Creating default tenant...');
    const tenantResult = await DatabaseManager.query(
      `INSERT INTO tenants (company_name, api_key) 
       VALUES ('Default Tenant', 'default-api-key') 
       ON CONFLICT (api_key) DO NOTHING 
       RETURNING id`
    );
    
    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].id;
      console.log('Default tenant created, initializing tenant schema...');
      
      // Create tenant schema using the database function
      await DatabaseManager.query('SELECT create_tenant_schema($1)', [tenantId]);
      
      // Create default admin user
      console.log('Creating admin user...');
      await DatabaseManager.query(
        `INSERT INTO users (tenant_id, email, full_name, password_hash, role) 
         VALUES ($1, 'admin@example.com', 'Admin User', 'default-hash', 'admin') 
         ON CONFLICT (email, tenant_id) DO NOTHING`,
        [tenantId]
      );
      
      await DatabaseManager.query('COMMIT');
      console.log('Database initialization completed successfully');
    } else {
      console.log('Default tenant already exists');
      await DatabaseManager.query('COMMIT');
    }
    
    return true;
  } catch (error: any) {
    await DatabaseManager.query('ROLLBACK');
    console.error('Error in database initialization:', error.message);
    if (error.stack) console.error('Stack:', error.stack);
    throw error;
  }
};
