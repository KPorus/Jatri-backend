import { Schema, model, Document, Types } from 'mongoose';
import type { TransportType } from './Vehicle';

export interface ITrip extends Document {
  _id: Types.ObjectId;
  title: string;
  vehicle: Types.ObjectId;
  vendor: Types.ObjectId;
  transportType: TransportType;
  from: string;
  to: string;
  departureAt: Date;
  arrivalAt?: Date;
  pricePerSeat: number;
  totalSeats: number;
  perks: string[];
  images: string[];
  isAdvertised: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    title: { type: String, required: true, trim: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transportType: { type: String, enum: ['bus', 'train', 'launch', 'plane'], required: true, index: true },
    from: { type: String, required: true, trim: true, index: true },
    to: { type: String, required: true, trim: true, index: true },
    departureAt: { type: Date, required: true, index: true },
    arrivalAt: { type: Date },
    pricePerSeat: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    perks: { type: [String], default: [] },
    images: { type: [String], default: [] },
    isAdvertised: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Trip = model<ITrip>('Trip', tripSchema);
