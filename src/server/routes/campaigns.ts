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

// Get all campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const result = await DatabaseManager.query(
      'SELECT * FROM campaigns WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { name, description, startDate, endDate, type, metadata } = req.body;
    
    const result = await DatabaseManager.query(
      `INSERT INTO campaigns (tenant_id, name, description, start_date, end_date, type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, name, description, startDate, endDate, type, metadata]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get campaign by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const { id } = req.params;
    
    const result = await DatabaseManager.query(
      'SELECT * FROM campaigns WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
