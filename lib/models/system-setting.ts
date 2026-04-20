import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemSetting extends Document {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema: Schema<ISystemSetting> = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

const SystemSettingModel: Model<ISystemSetting> =
  mongoose.models.SystemSetting ||
  mongoose.model<ISystemSetting>("SystemSetting", systemSettingSchema);

export default SystemSettingModel;
