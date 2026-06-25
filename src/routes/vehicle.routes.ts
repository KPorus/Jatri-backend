import { Router } from 'express';
import {
  createVehicle,
  listVehicles,
  myVehicles,
  getVehicle,
  assignVendor,
  deleteVehicle,
} from '../controllers/vehicle.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createVehicleSchema, assignVendorSchema } from '../validators/schemas';

const router = Router();

router.get('/mine', requireAuth, requireRole('vendor'), myVehicles);
router.get('/', requireAuth, requireRole('admin'), listVehicles);
router.post('/', requireAuth, requireRole('admin'), validate(createVehicleSchema), createVehicle);
router.get('/:id', requireAuth, getVehicle);
router.patch('/:id/assign', requireAuth, requireRole('admin'), validate(assignVendorSchema), assignVendor);
router.delete('/:id', requireAuth, requireRole('admin'), deleteVehicle);

export default router;
