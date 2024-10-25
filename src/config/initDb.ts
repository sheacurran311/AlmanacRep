import fs from 'fs';
import path from 'path';
import { query } from './database';
import { supabase, createTenantSchema } from './supabase';

export const initializeDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Test database connection first
    try {
      await query('SELECT NOW()');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Database connection failed');
    }

    // Read and execute schema
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    await query(schema);
    console.log('Database schema initialized successfully');
    
    // Create a default tenant for testing
    console.log('Creating default tenant...');
    const tenantResult = await query(
      "INSERT INTO tenants (name, api_key) VALUES ('Default Tenant', 'default-api-key') ON CONFLICT (api_key) DO NOTHING RETURNING id"
    );
    
    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].id;
      console.log('Default tenant created, initializing tenant schema...');
      
      // Create tenant schema
      await createTenantSchema(tenantId.toString());
      
      console.log('Creating admin user...');
      // Create a default admin user for testing
      await query(
        "INSERT INTO users (tenant_id, email, password_hash, role) VALUES ($1, 'admin@example.com', 'default-hash', 'admin') ON CONFLICT (email, tenant_id) DO NOTHING",
        [tenantId]
      );
      console.log('Admin user created successfully');
    } else {
      console.log('Default tenant already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error in database initialization:', error);
    throw error;
  }
};
