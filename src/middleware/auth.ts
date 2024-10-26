import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '@config/constants';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  permissions?: Record<string, boolean>;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AuthError('Authentication required');
    }

    try {
      const decoded = jwt.verify(token, constants.JWT_SECRET) as JWTPayload;
      req.user = decoded;
      next();
    } catch (jwtError) {
      throw new AuthError('Invalid or expired token');
    }
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
