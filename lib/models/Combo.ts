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

// Plain-object version for .lean() results — no Document instance methods
export interface IComboPlain {
  _id: Types.ObjectId
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

/**
 * Merged slot schema — both "fixed" and "choice" fields coexist on the same
 * subdocument. Custom per-slot validators enforce the discriminated union rules
 * so that a "fixed" slot always has productId/qty and a "choice" slot always
 * has candidateProductIds/pickCount.
 */
const comboSlotSchema = new Schema(
  {
    type: { type: String, enum: ["fixed", "choice"], required: true },
    // "fixed" fields
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    qty: { type: Number, min: 0.25 },
    customPrice: { type: Number, min: 0 },
    // "choice" fields
    pickCount: { type: Number, min: 1 },
    candidateProductIds: { type: [Schema.Types.ObjectId], ref: "Product" },
    label: { type: String, trim: true },
  },
  {
    _id: false,
    validate: {
      validator: function (this: mongoose.Types.Subdocument, v: unknown) {
        const t = this.get("type")
        if (t === "fixed") {
          return this.get("productId") != null && this.get("qty") != null
        }
        if (t === "choice") {
          const ids = this.get("candidateProductIds")
          return (
            Array.isArray(ids) &&
            ids.length > 0 &&
            this.get("pickCount") != null
          )
        }
        return false
      },
      message:
        "Slot validation failed: 'fixed' slots require productId and qty; 'choice' slots require candidateProductIds (min 1) and pickCount.",
    },
  }
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
      type: [comboSlotSchema],
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
