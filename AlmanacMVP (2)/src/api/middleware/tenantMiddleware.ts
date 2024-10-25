import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabaseClient';

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    // Set the current tenant ID using the set_current_tenant function
    await supabase.rpc('set_current_tenant', { p_tenant_id: tenantId });
    
    // Add the tenant ID to the request object for later use if needed
    (req as any).tenantId = tenantId;
    
    next();
  } catch (error) {
    console.error('Error setting tenant:', error);
    res.status(500).json({ error: 'Error setting tenant' });
  }
};