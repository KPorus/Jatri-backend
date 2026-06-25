import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import vehicleRoutes from './vehicle.routes';
import tripRoutes from './trip.routes';
import bookingRoutes from './booking.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);

export default router;
