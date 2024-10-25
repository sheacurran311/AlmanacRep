import { constants } from '../config/constants';
import { DatabaseManager } from '../config/database';
import { getTenantSchema } from '../config/supabase';

interface DynamicAuthConfig {
  environmentId: string;
  apiKey: string;
}

export class DynamicAuthService {
  private config: DynamicAuthConfig;
  private tenantId: string;

  constructor(tenantId: string) {
    if (!constants.DYNAMIC.ENVIRONMENT_ID || !constants.DYNAMIC.API_KEY) {
      throw new Error('Dynamic.xyz configuration is missing');
    }

    this.config = {
      environmentId: constants.DYNAMIC.ENVIRONMENT_ID,
      apiKey: constants.DYNAMIC.API_KEY
    };
    this.tenantId = tenantId;
  }

  async verifyAuthToken(token: string): Promise<any> {
    try {
      const response = await fetch('https://api.dynamic.xyz/v1/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Failed to verify Dynamic.xyz token');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Dynamic.xyz token verification failed:', error);
      throw error;
    }
  }

  async createOrUpdateUser(walletAddress: string, email?: string): Promise<string> {
    const schemaName = getTenantSchema(this.tenantId);
    
    try {
      // Check if user exists
      const existingUser = await DatabaseManager.query(
        `SELECT id FROM ${schemaName}.users WHERE wallet_address = $1`,
        [walletAddress]
      );

      if (existingUser.rows.length > 0) {
        // Update existing user
        await DatabaseManager.query(
          `UPDATE ${schemaName}.users 
           SET last_login = CURRENT_TIMESTAMP,
               email = COALESCE($1, email)
           WHERE wallet_address = $2
           RETURNING id`,
          [email, walletAddress]
        );
        return existingUser.rows[0].id;
      }

      // Create new user
      const result = await DatabaseManager.query(
        `INSERT INTO ${schemaName}.users 
         (wallet_address, email, role, created_at) 
         VALUES ($1, $2, 'user', CURRENT_TIMESTAMP)
         RETURNING id`,
        [walletAddress, email]
      );

      // Initialize loyalty points for new user
      await DatabaseManager.query(
        `INSERT INTO ${schemaName}.loyalty_points 
         (user_id, points, last_updated) 
         VALUES ($1, 0, CURRENT_TIMESTAMP)`,
        [result.rows[0].id]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  async logAuthActivity(userId: string, action: string, metadata: any = {}) {
    const schemaName = getTenantSchema(this.tenantId);
    
    try {
      await DatabaseManager.query(
        `INSERT INTO ${schemaName}.audit_logs 
         (action, entity_type, entity_id, user_id, metadata) 
         VALUES ($1, 'AUTH', $2, $3, $4)`,
        [action, userId, userId, metadata]
      );
    } catch (error) {
      console.error('Error logging auth activity:', error);
      // Don't throw error for logging failures
    }
  }
}
