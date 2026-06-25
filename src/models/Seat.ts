import { Schema, model, Document, Types } from 'mongoose';

export type SeatStatus = 'available' | 'held' | 'booked';

export interface ISeat extends Document {
  _id: Types.ObjectId;
  trip: Types.ObjectId;
  seatNumber: string;
  status: SeatStatus;
  holderId?: string | null;
  holderUser?: Types.ObjectId | null;
  holdExpiresAt?: Date | null;
  booking?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const seatSchema = new Schema<ISeat>(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    seatNumber: { type: String, required: true },
    status: { type: String, enum: ['available', 'held', 'booked'], default: 'available', index: true },
    holderId: { type: String, default: null },
    holderUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    holdExpiresAt: { type: Date, default: null, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  { timestamps: true }
);

seatSchema.index({ trip: 1, seatNumber: 1 }, { unique: true });

export const Seat = model<ISeat>('Seat', seatSchema);
