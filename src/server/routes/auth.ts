import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

// Use router.post correctly with the route handler
router.post('/login', (req, res) => login(req, res));

export default router;
