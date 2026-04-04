import mongoose, { Schema, Document, Model, Types } from "mongoose"

export type RecipientStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"

export interface ICampaignRecipient extends Document {
  campaignId: Types.ObjectId
  customerId: Types.ObjectId
  phone: string
  customerName: string
  status: RecipientStatus
  gupshupMessageId?: string
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  errorMessage?: string
  createdAt: Date
}

const campaignRecipientSchema = new Schema<ICampaignRecipient>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    phone: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "pending",
    },
    gupshupMessageId: { type: String, trim: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    errorMessage: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Unique guard: one recipient row per campaign + customer
campaignRecipientSchema.index(
  { campaignId: 1, customerId: 1 },
  { unique: true }
)

// Fast lookup by Gupshup message ID (for webhook)
campaignRecipientSchema.index({ gupshupMessageId: 1 })

const CampaignRecipientModel: Model<ICampaignRecipient> =
  mongoose.models.CampaignRecipient ||
  mongoose.model<ICampaignRecipient>("CampaignRecipient", campaignRecipientSchema)

export default CampaignRecipientModel
