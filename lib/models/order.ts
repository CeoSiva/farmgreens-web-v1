import mongoose, { Schema, Document, Model, Types } from "mongoose"

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "cancelled"
  | "paid"

/** A line item representing a regular product in an order. */
export interface IOrderItem {
  itemType: "product"
  productId: Types.ObjectId
  name: string
  price: number
  qty: number
  unit: string
}

/** A line item representing a combo bundle in an order. */
export interface IOrderComboItem {
  itemType: "combo"
  comboId: Types.ObjectId
  comboName: string
  selections: Array<{
    productId: Types.ObjectId
    productName: string
    qty: number
    unitPrice: number
  }>
  price: number // total price for this combo line item (already resolved at cart add-time)
}

export interface IOrder extends Document {
  orderNumber: string
  status: OrderStatus
  paymentMethod: "cod" | "online"
  razorpayPaymentId?: string
  razorpayOrderId?: string
  customer: {
    customerId?: Types.ObjectId
    name: string
    mobile: string
    countryCode: string
    whatsappOptIn: boolean
  }
  shippingAddress: {
    door: string
    street: string
    districtId?: Types.ObjectId
    areaId?: Types.ObjectId
    districtName: string
    areaName?: string
    lat?: number
    lng?: number
  }
  items: (IOrderItem | IOrderComboItem)[]
  subtotal: number
  deliveryFee: number
  total: number
  createdAt: Date
  updatedAt: Date
}

/** Merged order item schema — both "product" and "combo" shapes coexist. */
const mergedOrderItemSchema = new Schema(
  {
    itemType: { type: String, enum: ["product", "combo"], required: true },
    // "product" fields
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, trim: true },
    price: { type: Number, min: 0 },
    qty: { type: Number, min: 0.25 },
    unit: { type: String, trim: true },
    // "combo" fields
    comboId: { type: Schema.Types.ObjectId, ref: "Combo" },
    comboName: { type: String, trim: true },
    selections: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true, trim: true },
        qty: { type: Number, required: true, min: 0.25 },
        unitPrice: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { _id: false }
)

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ["placed", "confirmed", "dispatched", "delivered", "cancelled", "paid"],
      default: "placed",
    },
    paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
    razorpayPaymentId: { type: String, trim: true },
    razorpayOrderId: { type: String, trim: true },
    customer: {
      customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
      name: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      countryCode: { type: String, required: true, trim: true },
      whatsappOptIn: { type: Boolean, default: true },
    },
    shippingAddress: {
      door: { type: String, required: true, trim: true },
      street: { type: String, required: true, trim: true },
      districtId: { type: Schema.Types.ObjectId, ref: "District" },
      areaId: { type: Schema.Types.ObjectId, ref: "Area" },
      districtName: { type: String, required: true, trim: true },
      areaName: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    items: {
      type: [mergedOrderItemSchema],
      required: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

if (mongoose.models.Order) {
  delete mongoose.models.Order
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrderModel = mongoose.model<IOrder>("Order", orderSchema) as Model<IOrder>

export default OrderModel
