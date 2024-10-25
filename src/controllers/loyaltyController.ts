import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getTenantDB } from '../config/database';

export const createReward = async (req: AuthRequest, res: Response) => {
  try {
    const { name, points, description } = req.body;
    const tenantId = req.tenantId;

    const tenantDB = await getTenantDB(tenantId!);
    const result = await query(
      'INSERT INTO rewards (name, points, description, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, points, description, tenantId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create reward' });
  }
};
