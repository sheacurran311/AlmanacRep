import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../../config/constants.js';
import { JWTPayload, AuthError } from '../../middleware/auth.js';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AuthError('Authentication required');
    }

    const decoded = jwt.verify(token, constants.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(401).json({ message: 'Invalid token' });
    }
  }
};
