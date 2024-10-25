import { query } from '../config/database';

export interface Tenant {
  id: string;
  name: string;
  api_key: string;
  created_at: Date;
}

export const createTenant = async (name: string): Promise<Tenant> => {
  const result = await query(
    'INSERT INTO tenants (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
};

export const getTenantById = async (id: string): Promise<Tenant | null> => {
  const result = await query('SELECT * FROM tenants WHERE id = $1', [id]);
  return result.rows[0] || null;
};
