import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateTenantApiKey, requireTenantAccess } from '../middleware/tenantAuth';
import { createMerkleTree, getMerkleTrees } from '../controllers/nftController';
import { Request, Response } from 'express';

const router = Router();

// Add tenant authentication middleware
router.use(validateTenantApiKey);
router.use(requireTenantAccess);

// NFT endpoints with tenant isolation
router.post('/merkle-tree', authenticate, createMerkleTree);
router.get('/merkle-trees', authenticate, getMerkleTrees);

// Basic status endpoint
router.get('/status', authenticate, (req: Request, res: Response) => {
  res.json({ status: 'NFT service is running' });
});

export default router;
