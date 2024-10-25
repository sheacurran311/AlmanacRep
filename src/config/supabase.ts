import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getTenantSchema = (tenantId: string) => {
  return `tenant_${tenantId}`;
};

export const createTenantSchema = async (tenantId: string) => {
  const schemaName = getTenantSchema(tenantId);
  
  // Create a new schema for the tenant
  const { error } = await supabase.rpc('create_tenant_schema', {
    schema_name: schemaName
  });

  if (error) {
    throw error;
  }

  return schemaName;
};
