import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISetting extends Document {
  storeName: string;
  supportPhone?: string;
  supportWhatsapp?: string;
  storeAddress?: string;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema: Schema<ISetting> = new Schema(
  {
    storeName: { type: String, required: true, trim: true, default: "FarmGreens" },
    supportPhone: { type: String, trim: true },
    supportWhatsapp: { type: String, trim: true },
    storeAddress: { type: String, trim: true },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

const SettingModel: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>("Setting", settingSchema);

export default SettingModel;
