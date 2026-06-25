import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getStripe } from '../services/stripe.service';
import { env } from '../config/env';
import { Booking } from '../models/Booking';
import { Seat } from '../models/Seat';
import { Trip } from '../models/Trip';
import { Transaction } from '../models/Transaction';
import { emitToTrip } from '../sockets/io';

async function finalizeBooking(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.status === 'paid') return;

  booking.status = 'paid';
  await booking.save();

  await Seat.updateMany(
    { trip: booking.trip, seatNumber: { $in: booking.seatNumbers } },
    { $set: { status: 'booked', booking: booking._id, holdExpiresAt: null } }
  );

  const trip = await Trip.findById(booking.trip);

  await Transaction.create({
    user: booking.user,
    booking: booking._id,
    trip: booking.trip,
    transactionId: (session.payment_intent as string) || session.id,
    stripeSessionId: session.id,
    stripeProductId: session.metadata?.productId || '',
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || 'bdt',
    ticketTitle: trip?.title || 'Ticket',
    paymentDate: new Date(),
  });

  emitToTrip(booking.trip.toString(), 'seat:booked', { seatNumbers: booking.seatNumbers });
}

// Stripe webhook (raw body). Verifies signature when a webhook secret is configured.
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    if (env.stripeWebhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, env.stripeWebhookSecret);
    } else {
      event = JSON.parse((req.body as Buffer).toString()) as Stripe.Event;
    }
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'invalid'}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    await finalizeBooking(event.data.object as Stripe.Checkout.Session);
  }

  res.json({ received: true });
};

// Fallback used by the success page to confirm payment without relying solely on webhooks (useful in local dev).
export const confirmSession = async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  const { sessionId } = req.body as { sessionId: string };
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === 'paid') {
    await finalizeBooking(session);
    res.json({ success: true, status: 'paid' });
    return;
  }
  res.json({ success: false, status: session.payment_status });
};
