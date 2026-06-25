import { Seat } from '../models/Seat';
import { Trip } from '../models/Trip';
import { Vehicle, ISeatLayout } from '../models/Vehicle';
import { env } from '../config/env';

const ALPHA = 'ABCDEFGHIJKL';

export function buildSeatNumbers(layout: ISeatLayout): string[] {
  const seats: string[] = [];
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.columns; c++) {
      if (seats.length >= layout.totalSeats) break;
      if (layout.labelStyle === 'numeric') {
        seats.push(String(r * layout.columns + c + 1));
      } else {
        seats.push(`${ALPHA[r] || `R${r + 1}`}${c + 1}`);
      }
    }
  }
  return seats;
}

export async function generateSeatsForTrip(tripId: string): Promise<void> {
  const trip = await Trip.findById(tripId);
  if (!trip) return;
  const vehicle = await Vehicle.findById(trip.vehicle);
  if (!vehicle) return;
  const seatNumbers = buildSeatNumbers(vehicle.seatLayout);
  const docs = seatNumbers.map((seatNumber) => ({ trip: trip._id, seatNumber, status: 'available' as const }));
  await Seat.insertMany(docs, { ordered: false }).catch(() => undefined);
}

export function holdExpiry(): Date {
  return new Date(Date.now() + env.holdMinutes * 60 * 1000);
}

/**
 * Attempt to hold a single seat for holderId. Returns the updated seat or null if it could not be held.
 * Uses an atomic conditional update so concurrent requests cannot both win.
 */
export async function holdSeat(tripId: string, seatNumber: string, holderId: string, holderUser?: string | null) {
  const now = new Date();
  return Seat.findOneAndUpdate(
    {
      trip: tripId,
      seatNumber,
      $or: [
        { status: 'available' },
        { status: 'held', holderId },
        { status: 'held', holdExpiresAt: { $lt: now } },
      ],
    },
    {
      $set: {
        status: 'held',
        holderId,
        holderUser: holderUser || null,
        holdExpiresAt: holdExpiry(),
      },
    },
    { new: true }
  );
}

export async function releaseSeat(tripId: string, seatNumber: string, holderId: string) {
  return Seat.findOneAndUpdate(
    { trip: tripId, seatNumber, status: 'held', holderId },
    { $set: { status: 'available', holderId: null, holderUser: null, holdExpiresAt: null } },
    { new: true }
  );
}
