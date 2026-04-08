import mongoose, { Schema, Document, Model, Types } from "mongoose"

// ─── Slot Types ────────────────────────────────────────────────────────────────

/** A slot where the customer receives a fixed product at a specific quantity (and optional override price). */
export interface ComboSlotFixed {
  type: "fixed"
  productId: Types.ObjectId
  qty: number
  customPrice?: number
}

/** A slot where the customer chooses from a set of candidate products. */
export interface ComboSlotChoice {
  type: "choice"
  pickCount: number
  candidateProductIds: Types.ObjectId[]
  label?: string
}

/** Discriminated union of all slot types. */
export type ComboSlot = ComboSlotFixed | ComboSlotChoice

// ─── Document Interface ────────────────────────────────────────────────────────

export interface ICombo extends Document {
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  pricingMode: "fixed" | "percent_discount" | "per_item"
  fixedPrice?: number
  discountPercent?: number
  displayOrder: number
  availableInAllDistricts: boolean
  unavailableDistricts: Types.ObjectId[]
  slots: ComboSlot[]
  createdAt: Date
  updatedAt: Date
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const comboSlotFixedSchema = new Schema(
  {
    type: { type: String, enum: ["fixed"], required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 0.25 },
    customPrice: { type: Number, min: 0 },
  },
  { _id: false }
)

const comboSlotChoiceSchema = new Schema(
  {
    type: { type: String, enum: ["choice"], required: true },
    pickCount: { type: Number, required: true, min: 1 },
    candidateProductIds: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      required: true,
      validate: [
        {
          validator: (v: Types.ObjectId[]) => v.length > 0,
          msg: "choice slot must have at least one candidate product",
        },
      ],
    },
    label: { type: String, trim: true },
  },
  { _id: false }
)

const comboSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pricingMode: {
      type: String,
      enum: ["fixed", "percent_discount", "per_item"],
      required: true,
    },
    fixedPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    displayOrder: {
      type: Number,
      default: 0,
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
    slots: {
      type: [comboSlotFixedSchema, comboSlotChoiceSchema],
      required: true,
      validate: [
        {
          validator: (v: unknown[]) => Array.isArray(v) && v.length > 0,
          msg: "combo must have at least one slot",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
)

// Prevent mongoose from compiling the model multiple times during Next.js hot reloads
if (mongoose.models.Combo) {
  delete mongoose.models.Combo
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComboModel = mongoose.model<ICombo>("Combo", comboSchema) as Model<ICombo>

export default ComboModel
