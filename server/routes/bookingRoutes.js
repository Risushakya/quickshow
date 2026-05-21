import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  payBooking,
  cancelBooking,
} from '../controllers/bookingController.js';
import { adminOnly } from '../middlewares/authMiddleware.js';

const router = Router();

// Admin route first to avoid /:id shadowing
router.get('/admin/all', requireAuth(), adminOnly, getAllBookings);

router.post('/', requireAuth(), createBooking);
router.get('/user', requireAuth(), getUserBookings);
router.put('/pay/:id', requireAuth(), payBooking);
router.delete('/:id', requireAuth(), cancelBooking);

export default router;
