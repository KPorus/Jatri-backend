import { Server, Socket } from 'socket.io';
import { holdSeat, releaseSeat } from '../services/seat.service';

interface SelectPayload {
  tripId: string;
  seatNumber: string;
  holderId: string;
  userId?: string | null;
}

export function registerSeatSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on('trip:join', (tripId: string) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on('trip:leave', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });

    // A user/guest tries to select (hold) a seat.
    socket.on('seat:select', async (payload: SelectPayload, ack?: (res: unknown) => void) => {
      const { tripId, seatNumber, holderId, userId } = payload;
      try {
        const seat = await holdSeat(tripId, seatNumber, holderId, userId);
        if (!seat) {
          const msg = { seatNumber, message: `Seat ${seatNumber} is already taken. Please choose another.` };
          socket.emit('seat:unavailable', msg);
          ack?.({ ok: false, ...msg });
          return;
        }
        io.to(`trip:${tripId}`).emit('seat:locked', {
          seatNumber,
          holderId,
          holdExpiresAt: seat.holdExpiresAt,
        });
        ack?.({ ok: true, seatNumber, holdExpiresAt: seat.holdExpiresAt });
      } catch {
        ack?.({ ok: false, message: 'Could not select seat' });
      }
    });

    // Release a seat the holder previously selected.
    socket.on('seat:deselect', async (payload: SelectPayload, ack?: (res: unknown) => void) => {
      const { tripId, seatNumber, holderId } = payload;
      try {
        const seat = await releaseSeat(tripId, seatNumber, holderId);
        if (seat) {
          io.to(`trip:${tripId}`).emit('seat:released', { seatNumbers: [seatNumber] });
        }
        ack?.({ ok: true, seatNumber });
      } catch {
        ack?.({ ok: false });
      }
    });
  });
}
