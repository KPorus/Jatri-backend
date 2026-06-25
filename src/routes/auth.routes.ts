import { Router } from 'express';
import { register, login, googleAuth, me, logout } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { registerSchema, loginSchema, googleSchema } from '../validators/schemas';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleSchema), googleAuth);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export default router;
