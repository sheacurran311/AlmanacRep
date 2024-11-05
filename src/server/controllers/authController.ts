import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { constants } from '@config/constants.js';
import { DatabaseManager } from '@config/database.js';
import { AuthError } from '@middleware/auth.js';
import { TenantManager } from '@services/tenantManager.js';

export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

export interface RegistrationRequest {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

export const register = async (
  req: Request<{}, {}, RegistrationRequest>,
  res: Response
): Promise<void> => {
  try {
    const { fullName, email, companyName, password } = req.body;

    if (!email || !password || !fullName || !companyName) {
      throw new AuthError('All fields are required', 400);
    }

    // Start transaction
    await DatabaseManager.query('BEGIN');

    try {
      // Check if email already exists
      const existingUser = await DatabaseManager.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new AuthError('Email already registered', 400);
      }

      // Create tenant
      const tenantApiKey = generateApiKey();
      const tenantId = await TenantManager.createTenant(companyName, tenantApiKey);

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userResult = await DatabaseManager.query(
        `INSERT INTO users (tenant_id, email, full_name, password_hash, role)
         VALUES ($1, $2, $3, $4, 'tenant_admin')
         RETURNING id, email, role`,
        [tenantId, email, fullName, passwordHash]
      );

      const user = userResult.rows[0];
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

      await DatabaseManager.query('COMMIT');

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId
        }
      });
    } catch (error) {
      await DatabaseManager.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ message: error.message });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

function generateApiKey(): string {
  return `alm_${Buffer.from(Math.random().toString()).toString('base64').slice(0, 32)}`;
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
      'SELECT id, email, role, password_hash FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (result.rows.length === 0) {
      throw new AuthError('Invalid credentials', 401);
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      throw new AuthError('Invalid credentials', 401);
    }

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
