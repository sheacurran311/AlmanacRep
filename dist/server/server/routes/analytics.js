import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateTenantApiKey, requireTenantAccess } from '../middleware/tenantAuth';
import { getAnalyticsDashboard, getUserEngagementMetrics, getRewardsAnalytics, getPointsAnalytics, getNFTAnalytics } from '../controllers/analyticsController';
const router = Router();
// Add tenant authentication middleware
router.use(validateTenantApiKey);
router.use(requireTenantAccess);
// Analytics endpoints with tenant isolation
router.get('/dashboard', authenticate, getAnalyticsDashboard);
router.get('/users', authenticate, getUserEngagementMetrics);
router.get('/rewards', authenticate, getRewardsAnalytics);
router.get('/points', authenticate, getPointsAnalytics);
router.get('/nfts', authenticate, getNFTAnalytics);
export default router;
