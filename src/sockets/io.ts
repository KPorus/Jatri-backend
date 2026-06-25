import { Server } from 'socket.io';

let io: Server | null = null;

export function setIO(server: Server): void {
  io = server;
}

export function getIO(): Server | null {
  return io;
}

export function emitToTrip(tripId: string, event: string, payload: unknown): void {
  if (io) {
    io.to(`trip:${tripId}`).emit(event, payload);
  }
}
