import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDistrict extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const districtSchema: Schema<IDistrict> = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

const DistrictModel: Model<IDistrict> =
  mongoose.models.District || mongoose.model<IDistrict>("District", districtSchema);

export default DistrictModel;
