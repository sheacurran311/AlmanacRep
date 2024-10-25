import { Router } from 'express';
import { createReward } from '../controllers/loyaltyController';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

// Properly type the route handler
router.post('/rewards', authenticate, (req: Request, res: Response) => createReward(req, res));

export default router;
