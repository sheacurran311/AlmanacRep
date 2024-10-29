import { DatabaseManager } from '../../config/database.js';
import { getTenantSchema } from '../../config/supabase.js';
export const createReward = async (req, res) => {
    try {
        const { name, description, points, category } = req.body;
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            return res.status(400).json({ message: 'Tenant ID is required' });
        }
        const schemaName = getTenantSchema(tenantId);
        const result = await DatabaseManager.query(`INSERT INTO ${schemaName}.rewards 
       (name, description, points, category, tenant_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`, [name, description, points, category, tenantId]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error creating reward:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
