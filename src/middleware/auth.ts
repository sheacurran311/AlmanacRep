import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../config/constants';

interface JwtPayloadCustom {
  userId: string;
  tenantId: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayloadCustom;
  tenantId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, constants.JWT_SECRET) as JwtPayloadCustom;
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
