import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { addTheater, getTheaters, deleteTheater } from '../controllers/theaterController.js';
import { adminOnly } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/public', getTheaters);            // no auth — for the public theaters page
router.get('/', requireAuth(), adminOnly, getTheaters);
router.post('/add', requireAuth(), adminOnly, addTheater);
router.delete('/:id', requireAuth(), adminOnly, deleteTheater);

export default router;
