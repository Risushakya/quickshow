import dns from 'dns';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from 'inngest/express';
import { inngest, functions } from './inngest/index.js';
import userRoutes from './routes/userRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import theaterRoutes from './routes/theaterRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();
const port = process.env.PORT || 3000;

await connectDB();

app.use(cors());

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is Live'));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/user', userRoutes);
app.use('/api/show', showRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/theater', theaterRoutes);
app.use('/api/payment', paymentRoutes);

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
