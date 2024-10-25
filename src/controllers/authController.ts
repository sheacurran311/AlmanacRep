import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../config/constants';
import { DatabaseManager } from '../config/database';
import { DynamicAuthService } from '../services/dynamicAuthService';

interface LoginRequest extends Request {
  body: {
    email?: string;
    password?: string;
    dynamicToken?: string;
    walletAddress?: string;
  };
}

export const login = async (req: LoginRequest, res: Response) => {
  try {
    const { email, password, dynamicToken, walletAddress } = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Initialize Dynamic.xyz service
    const dynamicAuth = new DynamicAuthService(tenantId);

    let userId: string;
    let userEmail = email;

    if (dynamicToken) {
      // Web3 authentication using Dynamic.xyz
      try {
        const verificationResult = await dynamicAuth.verifyAuthToken(dynamicToken);
        if (!verificationResult.verified || !walletAddress) {
          return res.status(401).json({ message: 'Invalid Dynamic.xyz token' });
        }
        
        // Create or update user with wallet address
        userId = await dynamicAuth.createOrUpdateUser(walletAddress, email);
        
        // Log successful web3 authentication
        await dynamicAuth.logAuthActivity(userId, 'WEB3_LOGIN', {
          wallet: walletAddress,
          provider: 'dynamic.xyz'
        });
      } catch (error) {
        console.error('Dynamic.xyz authentication failed:', error);
        return res.status(401).json({ message: 'Web3 authentication failed' });
      }
    } else if (email && password) {
      // Traditional Web2 authentication
      const result = await DatabaseManager.query(
        'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
        [email, tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];
      userId = user.id;

      // TODO: Implement proper password hashing and comparison
      // For now, we'll just log the Web2 login attempt
      await dynamicAuth.logAuthActivity(userId, 'WEB2_LOGIN', {
        email: email
      });
    } else {
      return res.status(400).json({ message: 'Invalid authentication method' });
    }

    // Generate JWT token with tenant isolation
    const token = jwt.sign(
      { 
        userId,
        tenantId,
        email: userEmail,
        walletAddress
      },
      constants.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login timestamp
    await DatabaseManager.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    res.json({ 
      token,
      user: {
        id: userId,
        email: userEmail,
        walletAddress
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};
