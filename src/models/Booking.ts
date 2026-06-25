import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  trip: Types.ObjectId;
  seatNumbers: string[];
  totalPrice: number;
  status: BookingStatus;
  holdExpiresAt: Date;
  stripeSessionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    seatNumbers: { type: [String], required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid', 'expired', 'cancelled'], default: 'pending', index: true },
    holdExpiresAt: { type: Date, required: true, index: true },
    stripeSessionId: { type: String, default: null },
  },
  { timestamps: true }
);

export const Booking = model<IBooking>('Booking', bookingSchema);
