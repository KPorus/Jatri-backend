import Stripe from 'stripe';
import { env } from '../config/env';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripeClient) {
    // Use the account's default API version to avoid coupling to a specific pinned literal.
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

interface CheckoutParams {
  userId: string;
  userEmail: string;
  bookingId: string;
  tripId: string;
  ticketTitle: string;
  amount: number; // total amount in major currency unit (BDT)
  quantity: number;
}

/**
 * Creates a Stripe Product and Price dynamically for this user's purchase (no manual product import),
 * then returns a Checkout Session.
 */
export async function createCheckoutSession(params: CheckoutParams): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  const product = await stripe.products.create({
    name: `${params.ticketTitle} - ${params.userEmail}`,
    metadata: { userId: params.userId, bookingId: params.bookingId, tripId: params.tripId },
  });

  const unitAmount = Math.round((params.amount / params.quantity) * 100);

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'bdt',
    unit_amount: unitAmount,
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: price.id, quantity: params.quantity }],
    customer_email: params.userEmail,
    metadata: {
      userId: params.userId,
      bookingId: params.bookingId,
      tripId: params.tripId,
      productId: product.id,
    },
    success_url: `${env.clientUrl}/dashboard/my-bookings?payment=success&booking=${params.bookingId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/dashboard/my-bookings?payment=cancelled&booking=${params.bookingId}`,
  });

  return session;
}
