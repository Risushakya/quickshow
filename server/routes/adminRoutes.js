import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { getDashboardData } from '../controllers/adminController.js';
import { adminOnly } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/dashboard', requireAuth(), adminOnly, getDashboardData);

export default router;
