import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'user' | 'vendor' | 'admin';
export type AuthProvider = 'local' | 'google';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  provider: AuthProvider;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isFraud: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    role: { type: String, enum: ['user', 'vendor', 'admin'], default: 'user', index: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    isFraud: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).passwordHash;
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
