import { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { buildSeatNumbers } from '../services/seat.service';

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    type: string;
    name: string;
    operator: string;
    registrationNo?: string;
    seatLayout: { rows: number; columns: number; aisleAfterColumn?: number; labelStyle?: 'numeric' | 'alpha-row' };
    assignedVendor?: string | null;
    images?: string[];
  };

  const totalSeats = body.seatLayout.rows * body.seatLayout.columns;
  if (body.assignedVendor) {
    const vendor = await User.findById(body.assignedVendor);
    if (!vendor || vendor.role !== 'vendor') throw new ApiError(400, 'Assigned user must be a vendor');
  }

  const vehicle = await Vehicle.create({
    type: body.type,
    name: body.name,
    operator: body.operator,
    registrationNo: body.registrationNo || '',
    seatLayout: {
      rows: body.seatLayout.rows,
      columns: body.seatLayout.columns,
      aisleAfterColumn: body.seatLayout.aisleAfterColumn ?? 2,
      labelStyle: body.seatLayout.labelStyle ?? 'alpha-row',
      totalSeats,
    },
    assignedVendor: body.assignedVendor || null,
    images: body.images || [],
  });

  res.status(201).json({ success: true, vehicle });
});

export const listVehicles = asyncHandler(async (_req: Request, res: Response) => {
  const vehicles = await Vehicle.find().populate('assignedVendor', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, vehicles });
});

export const myVehicles = asyncHandler(async (req: Request, res: Response) => {
  const vehicles = await Vehicle.find({ assignedVendor: req.user!.id, isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, vehicles });
});

export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await Vehicle.findById(req.params.id).populate('assignedVendor', 'name email');
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.json({ success: true, vehicle, seatPreview: buildSeatNumbers(vehicle.seatLayout) });
});

export const assignVendor = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId } = req.body as { vendorId: string | null };
  if (vendorId) {
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') throw new ApiError(400, 'Assigned user must be a vendor');
  }
  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    { $set: { assignedVendor: vendorId } },
    { new: true }
  ).populate('assignedVendor', 'name email');
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.json({ success: true, vehicle });
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.json({ success: true, message: 'Vehicle deleted' });
});
