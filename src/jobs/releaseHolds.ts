import cron from 'node-cron';
import { Seat } from '../models/Seat';
import { Booking } from '../models/Booking';
import { emitToTrip } from '../sockets/io';

/**
 * Runs every minute. Releases any seat whose 5-minute hold expired (and was not paid),
 * expires the related pending bookings, and broadcasts the release so UIs update live.
 */
export function startReleaseHoldsJob(): void {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      const expiredSeats = await Seat.find({
        status: 'held',
        holdExpiresAt: { $lt: now },
      }).select('trip seatNumber');

      if (expiredSeats.length === 0) return;

      const seatIds = expiredSeats.map((s) => s._id);
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { $set: { status: 'available', holderId: null, holderUser: null, holdExpiresAt: null } }
      );

      await Booking.updateMany(
        { status: 'pending', holdExpiresAt: { $lt: now } },
        { $set: { status: 'expired' } }
      );

      const byTrip = new Map<string, string[]>();
      for (const seat of expiredSeats) {
        const key = seat.trip.toString();
        const arr = byTrip.get(key) || [];
        arr.push(seat.seatNumber);
        byTrip.set(key, arr);
      }
      for (const [tripId, seatNumbers] of byTrip) {
        emitToTrip(tripId, 'seat:released', { seatNumbers });
      }
      console.log(`[cron] released ${expiredSeats.length} expired seat hold(s)`);
    } catch (err) {
      console.error('[cron] releaseHolds error', err);
    }
  });
  console.log('[cron] releaseHolds job scheduled (every minute)');
}
