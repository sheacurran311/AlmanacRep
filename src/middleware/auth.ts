import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../config/constants';
import { TenantManager } from '../services/tenantManager';

interface JwtPayloadCustom {
  userId: string;
  tenantId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayloadCustom;
  tenantId?: string;
  apiKey?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const apiKey = req.headers['x-api-key'] as string;

    if (!token || !apiKey) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Validate API key first
    try {
      const tenant = await TenantManager.validateTenantAccess(apiKey, req.path);
      req.tenantId = tenant.id.toString();
      req.apiKey = apiKey;
    } catch (error) {
      res.status(401).json({ message: 'Invalid API key' });
      return;
    }

    // Validate JWT token
    const decoded = jwt.verify(token, constants.JWT_SECRET) as JwtPayloadCustom;
    
    // Ensure token belongs to the same tenant
    if (decoded.tenantId !== req.tenantId) {
      res.status(403).json({ message: 'Invalid tenant access' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
