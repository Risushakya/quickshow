import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { syncUser, toggleFavorite, getFavorites } from '../controllers/userController.js';

const router = Router();

router.post('/sync', requireAuth(), syncUser);
router.post('/favorites', requireAuth(), toggleFavorite);
router.get('/favorites', requireAuth(), getFavorites);

export default router;
