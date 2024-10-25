import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

export interface TenantRequest extends Request {
  tenantId?: string;
  apiKey?: string;
}

export const validateTenantApiKey = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({ message: 'API key is required' });
      return;
    }

    const result = await query(
      'SELECT id, name FROM tenants WHERE api_key = $1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Invalid API key' });
      return;
    }

    req.tenantId = result.rows[0].id.toString();
    req.apiKey = apiKey;
    next();
  } catch (error) {
    console.error('Tenant validation error:', error);
    res.status(500).json({ message: 'Tenant validation failed' });
  }
};

export const requireTenantAccess = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.tenantId) {
    res.status(403).json({ message: 'Tenant access required' });
    return;
  }
  next();
};
