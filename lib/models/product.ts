import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category: 'vegetable' | 'batter' | 'greens';
  description?: string;
  price: number;
  status: 'active' | 'draft' | 'archived';
  orderQuantity: {
    type: 'weight' | 'count';
    unit: string;
  };
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
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
      enum: ['vegetable', 'batter', 'greens'],
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
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    orderQuantity: {
      type: {
        type: String,
        enum: ['weight', 'count'],
        required: true,
      },
      unit: {
        type: String,
        required: true,
        trim: true,
      },
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times during Next.js hot reloads
const ProductModel: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default ProductModel;
