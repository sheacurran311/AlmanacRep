import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../config/constants.js';
import { DatabaseManager } from '../config/database.js';
import { AuthError } from '../middleware/auth.js';

export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response
): Promise<void> => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      throw new AuthError('Email, password, and tenant ID are required', 400);
    }

    // Verify credentials
    const result = await DatabaseManager.query<UserResponse>(
      'SELECT id, email, role FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (result.rows.length === 0) {
      throw new AuthError('Invalid credentials', 401);
    }

    const user = result.rows[0];
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId
      },
      constants.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await DatabaseManager.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({ token, user });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ message: error.message });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
