import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../config/constants';
import { DatabaseManager } from '../config/database';
import { DynamicAuthService } from '../services/dynamicAuthService';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await DatabaseManager.query(
      'SELECT id, email, role FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      constants.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
