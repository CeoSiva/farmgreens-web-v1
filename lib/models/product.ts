import mongoose, { Schema, Document, Model } from "mongoose"

export interface IProduct extends Document {
  name: string
  category: "vegetable" | "batter" | "greens"
  description?: string
  price: number
  status: "active" | "draft" | "archived"
  orderQuantity: {
    type: "weight" | "count"
    unit: string
  }
  customPricing?: { districtId: mongoose.Types.ObjectId; price: number }[]
  imageUrl?: string
  showOnHomePage: boolean
  availableInAllDistricts: boolean
  unavailableDistricts: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const productSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["vegetable", "batter", "greens"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    orderQuantity: {
      type: {
        type: String,
        enum: ["weight", "count"],
        required: true,
      },
      unit: {
        type: String,
        required: true,
        trim: true,
      },
    },
    customPricing: [
      {
        districtId: {
          type: Schema.Types.ObjectId,
          ref: "District",
          required: true,
        },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    imageUrl: {
      type: String,
    },
    showOnHomePage: {
      type: Boolean,
      default: true,
    },
    availableInAllDistricts: {
      type: Boolean,
      default: true,
    },
    unavailableDistricts: [
      {
        type: Schema.Types.ObjectId,
        ref: "District",
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Prevent mongoose from compiling the model multiple times during Next.js hot reloads but force custom pricing changes to compile
if (mongoose.models.Product) {
  delete mongoose.models.Product
}
const ProductModel: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema
)

export default ProductModel
