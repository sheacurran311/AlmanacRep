import express from 'express';
import { healthCheck, readiness } from '../controllers/healthController';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/ready', readiness);

export default router;
