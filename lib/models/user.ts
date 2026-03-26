import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  mobile: string;
  countryCode: string;
  password?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
      default: '+1',
    },
    password: {
      type: String, // Store hashed passwords only
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times during Next.js hot reloads
const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default UserModel;
