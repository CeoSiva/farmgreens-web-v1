import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ICustomerAddress {
  label?: string
  door: string
  street: string
  districtId: Types.ObjectId
  areaId?: Types.ObjectId
  isDefault?: boolean
}

export interface ICustomer extends Document {
  mobile: string
  countryCode: string
  name: string
  addresses: ICustomerAddress[]
  whatsappOptIn: boolean
  optedInAt?: Date
  optedOutAt?: Date
  createdAt: Date
  updatedAt: Date
}

const customerAddressSchema = new Schema(
  {
    label: { type: String, trim: true },
    door: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    districtId: {
      type: Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
    areaId: {
      type: Schema.Types.ObjectId,
      ref: "Area",
    },
    isDefault: { type: Boolean, default: false },
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },
  { _id: false }
)

const customerSchema: Schema<ICustomer> = new Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
    countryCode: { type: String, required: true, trim: true, default: "+91" },
    name: { type: String, required: true, trim: true },
    addresses: { type: [customerAddressSchema], default: [] },
    whatsappOptIn: { type: Boolean, default: true },
    optedInAt: { type: Date },
    optedOutAt: { type: Date },
  },
  { timestamps: true }
)

const CustomerModel: Model<ICustomer> =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", customerSchema)

export default CustomerModel
