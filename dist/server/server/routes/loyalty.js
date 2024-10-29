import { Router } from 'express';
import { createReward } from '../controllers/loyaltyController';
import { authenticate } from '../middleware/auth';
const router = Router();
// Properly type the route handler
router.post('/rewards', authenticate, (req, res) => createReward(req, res));
export default router;
