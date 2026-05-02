import mongoose, { Schema, Document, Model } from "mongoose"

export interface IDistrict extends Document {
  name: string
  isCodEnabled: boolean
  isEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const districtSchema: Schema<IDistrict> = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isCodEnabled: { type: Boolean, default: true },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
)

const DistrictModel: Model<IDistrict> =
  mongoose.models.District ||
  mongoose.model<IDistrict>("District", districtSchema)

export default DistrictModel
