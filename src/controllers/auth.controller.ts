import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function tokenFor(user: { _id: { toString(): string }; role: string; email: string }) {
  return signToken({ id: user._id.toString(), role: user.role, email: user.email });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, provider: 'local', role: 'user' });
  const token = tokenFor(user);
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ success: true, token, user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) throw new ApiError(401, 'Invalid credentials');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const token = tokenFor(user);
  res.cookie('token', token, cookieOptions);
  res.json({ success: true, token, user });
});

// Bridge endpoint: BetterAuth handles Google on the client; we upsert the profile and issue our JWT.
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, googleId, avatar } = req.body as {
    email: string;
    name: string;
    googleId: string;
    avatar?: string;
  };

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, googleId, avatar: avatar || '', provider: 'google', role: 'user' });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (avatar) user.avatar = avatar;
    await user.save();
  }

  const token = tokenFor(user);
  res.cookie('token', token, cookieOptions);
  res.json({ success: true, token, user });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'Logged out' });
});
