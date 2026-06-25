import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  listUsers,
  listVendors,
  createVendor,
  updateUserRole,
  markFraud,
} from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createVendorSchema, updateRoleSchema } from '../validators/schemas';

const router = Router();

router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);

// Admin
router.get('/', requireAuth, requireRole('admin'), listUsers);
router.get('/vendors', requireAuth, requireRole('admin'), listVendors);
router.post('/vendors', requireAuth, requireRole('admin'), validate(createVendorSchema), createVendor);
router.patch('/:id/role', requireAuth, requireRole('admin'), validate(updateRoleSchema), updateUserRole);
router.patch('/:id/fraud', requireAuth, requireRole('admin'), markFraud);

export default router;
