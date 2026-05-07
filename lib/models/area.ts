import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IArea extends Document {
  districtId: Types.ObjectId;
  name: string;
  pincode?: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const areaSchema: Schema<IArea> = new Schema(
  {
    districtId: { type: Schema.Types.ObjectId, ref: "District", required: true },
    name: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

areaSchema.index({ districtId: 1, pincode: 1 });

areaSchema.index({ districtId: 1, name: 1 }, { unique: true });

const AreaModel: Model<IArea> =
  mongoose.models.Area || mongoose.model<IArea>("Area", areaSchema);

export default AreaModel;
