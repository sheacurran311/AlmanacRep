import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
import { validateLoginInput } from '@middleware/validation.js';
import { Request, Response } from 'express';
import type { LoginRequest, RegistrationRequest } from '../controllers/authController.js';

const router = Router();

router.post('/login', validateLoginInput, async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    await login(req, res);
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register', async (req: Request<{}, {}, RegistrationRequest>, res: Response) => {
  try {
    await register(req, res);
  } catch (error) {
    console.error('Registration route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
