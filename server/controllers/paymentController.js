import Stripe from 'stripe';
import Booking from '../models/Booking.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /api/payment/create-checkout
export const createCheckoutSession = async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, message: 'Payment not configured. Add STRIPE_SECRET_KEY to server .env' });
  try {
    const { bookingId } = req.body;
    const { userId } = req.auth();

    const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate('show');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.isPaid) return res.status(400).json({ success: false, message: 'Already paid' });

    const movie = booking.show?.movie;
    const theater = booking.show?.theater;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: movie?.title || 'Movie Ticket',
            description: [
              `Seats: ${booking.bookedSeats.join(', ')}`,
              theater?.name ? `Theater: ${theater.name}, ${theater.city}` : '',
            ].filter(Boolean).join(' | '),
            images: movie?.poster_path ? [movie.poster_path] : [],
          },
          unit_amount: booking.amount * 100, // paise
        },
        quantity: 1,
      }],
      metadata: { bookingId: booking._id.toString(), userId },
      success_url: `${process.env.CLIENT_URL}/payment-success?bookingId=${booking._id}`,
      cancel_url: `${process.env.CLIENT_URL}/my-bookings`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/payment/webhook  (raw body required — set up in server.js)
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { bookingId } = session.metadata;
    await Booking.findByIdAndUpdate(bookingId, { isPaid: true });
  }

  res.json({ received: true });
};
