import { Schema, model, Document, Types } from 'mongoose';

export type TransportType = 'bus' | 'train' | 'launch' | 'plane';

export interface ISeatLayout {
  rows: number;
  columns: number;
  aisleAfterColumn: number;
  totalSeats: number;
  labelStyle: 'numeric' | 'alpha-row';
}

export interface IVehicle extends Document {
  _id: Types.ObjectId;
  type: TransportType;
  name: string;
  operator: string;
  registrationNo: string;
  seatLayout: ISeatLayout;
  assignedVendor?: Types.ObjectId | null;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seatLayoutSchema = new Schema<ISeatLayout>(
  {
    rows: { type: Number, required: true, min: 1 },
    columns: { type: Number, required: true, min: 1 },
    aisleAfterColumn: { type: Number, default: 2 },
    totalSeats: { type: Number, required: true, min: 1 },
    labelStyle: { type: String, enum: ['numeric', 'alpha-row'], default: 'alpha-row' },
  },
  { _id: false }
);

const vehicleSchema = new Schema<IVehicle>(
  {
    type: { type: String, enum: ['bus', 'train', 'launch', 'plane'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    operator: { type: String, required: true, trim: true },
    registrationNo: { type: String, default: '' },
    seatLayout: { type: seatLayoutSchema, required: true },
    assignedVendor: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema);
