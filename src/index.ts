import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { setIO } from './sockets/io';
import { registerSeatSocket } from './sockets/seat.socket';
import { startReleaseHoldsJob } from './jobs/releaseHolds';

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });
  setIO(io);
  registerSeatSocket(io);

  startReleaseHoldsJob();

  server.listen(env.port, () => {
    console.log(`[server] running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
