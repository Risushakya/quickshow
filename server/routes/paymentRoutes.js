import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { createCheckoutSession, stripeWebhook } from '../controllers/paymentController.js';

const router = Router();

// Webhook must use raw body — registered BEFORE express.json() in server.js
router.post('/webhook', stripeWebhook);

router.post('/create-checkout', requireAuth(), createCheckoutSession);

export default router;
