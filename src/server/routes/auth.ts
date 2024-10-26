import { Router } from 'express';
import { login, LoginRequest } from '../controllers/authController.js';
import { validateLoginInput } from '@middleware/validation.js';
import { Request, Response } from 'express';

const router = Router();

router.post('/login', validateLoginInput, async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    await login(req, res);
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
