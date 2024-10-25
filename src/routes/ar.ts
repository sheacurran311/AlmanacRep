import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateTenantApiKey, requireTenantAccess } from '../middleware/tenantAuth';
import { getARExperience, createARAnchor } from '../controllers/arController';

const router = Router();

// Add tenant authentication middleware
router.use(validateTenantApiKey);
router.use(requireTenantAccess);

// AR endpoints with tenant isolation
router.get('/experience', authenticate, getARExperience);
router.post('/anchor', authenticate, createARAnchor);

export default router;
