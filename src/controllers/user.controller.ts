import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Vehicle } from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, avatar, phone } = req.body as { name?: string; avatar?: string; phone?: string };
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $set: { ...(name && { name }), ...(avatar && { avatar }), ...(phone && { phone }) } },
    { new: true }
  );
  res.json({ success: true, user });
});

// ---- Admin only ----

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const listVendors = asyncHandler(async (_req: Request, res: Response) => {
  const vendors = await User.find({ role: 'vendor', isFraud: false }).sort({ name: 1 });
  res.json({ success: true, vendors });
});

export const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body as {
    name: string;
    email: string;
    password: string;
    phone?: string;
  };
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');
  const passwordHash = await bcrypt.hash(password, 10);
  const vendor = await User.create({ name, email, passwordHash, phone, role: 'vendor', provider: 'local' });
  res.status(201).json({ success: true, vendor });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body as { role: 'user' | 'vendor' | 'admin' };
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

export const markFraud = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role !== 'vendor') throw new ApiError(400, 'Only vendors can be marked as fraud');
  user.isFraud = true;
  await user.save();
  // Hide all vehicles assigned to this vendor (their trips will be hidden via populate checks).
  await Vehicle.updateMany({ assignedVendor: user._id }, { $set: { isActive: false } });
  res.json({ success: true, user });
});
