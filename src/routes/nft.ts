import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

// Fix the route handler typing
router.get('/status', authenticate, (req: Request, res: Response) => {
  res.json({ status: 'NFT service is running' });
});

export default router;
