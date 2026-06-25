import { Schema, model, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  booking: Types.ObjectId;
  trip: Types.ObjectId;
  transactionId: string;
  stripeSessionId: string;
  stripeProductId: string;
  amount: number;
  currency: string;
  ticketTitle: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    transactionId: { type: String, required: true },
    stripeSessionId: { type: String, required: true },
    stripeProductId: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'bdt' },
    ticketTitle: { type: String, required: true },
    paymentDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
