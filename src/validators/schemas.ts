import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const transportType = z.enum(['bus', 'train', 'launch', 'plane']);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    email: z.string().email(),
    password: z.string().min(6).max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const googleSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    googleId: z.string().min(1),
    avatar: z.string().optional(),
  }),
});

export const createVehicleSchema = z.object({
  body: z.object({
    type: transportType,
    name: z.string().min(2),
    operator: z.string().min(2),
    registrationNo: z.string().optional(),
    seatLayout: z.object({
      rows: z.number().int().min(1).max(60),
      columns: z.number().int().min(1).max(12),
      aisleAfterColumn: z.number().int().min(0).max(11).optional(),
      labelStyle: z.enum(['numeric', 'alpha-row']).optional(),
    }),
    assignedVendor: objectId.nullable().optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const assignVendorSchema = z.object({
  body: z.object({ vendorId: objectId.nullable() }),
  params: z.object({ id: objectId }),
});

export const createTripSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    vehicle: objectId,
    from: z.string().min(2),
    to: z.string().min(2),
    departureAt: z.string().datetime().or(z.string().min(1)),
    arrivalAt: z.string().optional(),
    pricePerSeat: z.number().min(0),
    perks: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    from: z.string().min(2).optional(),
    to: z.string().min(2).optional(),
    departureAt: z.string().optional(),
    arrivalAt: z.string().optional(),
    pricePerSeat: z.number().min(0).optional(),
    perks: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: objectId }),
});

export const checkoutSchema = z.object({
  body: z.object({
    tripId: objectId,
    seatNumbers: z.array(z.string()).min(1),
    guestId: z.string().optional(),
  }),
});

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({ role: z.enum(['user', 'vendor', 'admin']) }),
  params: z.object({ id: objectId }),
});
