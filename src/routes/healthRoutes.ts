import express from 'express';
import { healthCheck, readiness } from '../controllers/healthController';

const router = express.Router();

// Health check endpoint mounted at root level
router.get('/', healthCheck);

export default router;
