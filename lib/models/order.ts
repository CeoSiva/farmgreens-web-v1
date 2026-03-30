import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type OrderStatus = "placed" | "confirmed" | "dispatched" | "delivered" | "cancelled";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  unit: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "cod";
  customer: {
    customerId?: Types.ObjectId;
    name: string;
    mobile: string;
    countryCode: string;
  };
  shippingAddress: {
    door: string;
    street: string;
    districtId?: Types.ObjectId;
    areaId?: Types.ObjectId;
    districtName: string;
    areaName: string;
  };
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 0.25 },
    unit: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema: Schema<IOrder> = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["placed", "confirmed", "dispatched", "delivered", "cancelled"],
      default: "placed",
    },
    paymentMethod: { type: String, enum: ["cod"], default: "cod" },
    customer: {
      customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
      name: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      countryCode: { type: String, required: true, trim: true },
    },
    shippingAddress: {
      door: { type: String, required: true, trim: true },
      street: { type: String, required: true, trim: true },
      districtId: { type: Schema.Types.ObjectId, ref: "District" },
      areaId: { type: Schema.Types.ObjectId, ref: "Area" },
      districtName: { type: String, required: true, trim: true },
      areaName: { type: String, required: true, trim: true },
    },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;
