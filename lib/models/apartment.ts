import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IApartment extends Document {
  districtId: Types.ObjectId;
  name: string;
  deliveryDay?: number;
  createdAt: Date;
  updatedAt: Date;
}

const apartmentSchema: Schema<IApartment> = new Schema(
  {
    districtId: { type: Schema.Types.ObjectId, ref: "District", required: true },
    name: { type: String, required: true, trim: true },
    deliveryDay: { type: Number, min: 0, max: 6 },
  },
  { timestamps: true }
);

apartmentSchema.index({ districtId: 1, name: 1 }, { unique: true });

const ApartmentModel: Model<IApartment> =
  mongoose.models.Apartment || mongoose.model<IApartment>("Apartment", apartmentSchema);

export default ApartmentModel;
