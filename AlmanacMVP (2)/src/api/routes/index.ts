import express from 'express';
import clientRoutes from './clientRoutes';
import customerRoutes from './customerRoutes';
import pointsRoutes from './pointsRoutes';
import rewardRoutes from './rewardRoutes';
import campaignRoutes from './campaignRoutes';
import dashboardRoutes from './dashboardRoutes';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

router.use('/clients', clientRoutes);
router.use('/customers', authenticateJWT, customerRoutes);
router.use('/points', authenticateJWT, pointsRoutes);
router.use('/rewards', authenticateJWT, rewardRoutes);
router.use('/campaigns', authenticateJWT, campaignRoutes);
router.use('/dashboard', authenticateJWT, dashboardRoutes);

export default router;