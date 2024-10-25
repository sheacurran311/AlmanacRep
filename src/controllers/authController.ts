import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { constants } from '../config/constants';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // In production, use proper password hashing comparison
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      constants.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
};
