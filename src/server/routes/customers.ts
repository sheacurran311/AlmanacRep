import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateTenantApiKey, requireTenantAccess } from '../middleware/tenantAuth.js';
import { DatabaseManager } from '@config/database.js';
import { Request, Response } from 'express';

const router = Router();

// Add tenant authentication middleware
router.use(validateTenantApiKey);
router.use(requireTenantAccess);
router.use(authenticate);

// Get all customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const result = await DatabaseManager.query(
      `SELECT u.*, lp.points, lp.tier
       FROM users u
       LEFT JOIN loyalty_points lp ON u.id = lp.user_id
       WHERE u.tenant_id = $1 AND u.role = 'user'
       ORDER BY u.created_at DESC`,
      [tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get customer details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { id } = req.params;
    
    const result = await DatabaseManager.query(
      `SELECT u.*, lp.points, lp.tier, lp.lifetime_points,
              json_agg(pt.*) as transactions
       FROM users u
       LEFT JOIN loyalty_points lp ON u.id = lp.user_id
       LEFT JOIN points_transactions pt ON u.id = pt.user_id
       WHERE u.id = $1 AND u.tenant_id = $2 AND u.role = 'user'
       GROUP BY u.id, lp.points, lp.tier, lp.lifetime_points`,
      [id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
