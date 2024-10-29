import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { validateLoginInput } from '@middleware/validation.js';
const router = Router();
router.post('/login', validateLoginInput, async (req, res) => {
    try {
        await login(req, res);
    }
    catch (error) {
        console.error('Login route error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
export default router;
