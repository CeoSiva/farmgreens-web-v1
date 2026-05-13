import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IApartment extends Document {
  districtId: Types.ObjectId;
  name: string;
  deliveryDays: number[];
  isCodEnabled: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const apartmentSchema: Schema<IApartment> = new Schema(
  {
    districtId: { type: Schema.Types.ObjectId, ref: "District", required: true },
    name: { type: String, required: true, trim: true },
    deliveryDays: { type: [Number], default: [] },
    isCodEnabled: { type: Boolean, default: true },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

apartmentSchema.index({ districtId: 1, name: 1 }, { unique: true });

const ApartmentModel: Model<IApartment> =
  mongoose.models.Apartment || mongoose.model<IApartment>("Apartment", apartmentSchema);

export default ApartmentModel;
