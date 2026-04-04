import mongoose, { Schema, Document, Model } from "mongoose"

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "stopped"

export interface ICampaign extends Document {
  name: string
  templateId: string
  templateName: string
  templateParams: string[] // ordered array of param values
  status: CampaignStatus
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  targetFilter: Record<string, unknown>
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    templateId: { type: String, required: true, trim: true },
    templateName: { type: String, required: true, trim: true },
    templateParams: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "scheduled", "running", "paused", "completed", "stopped"],
      default: "draft",
    },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    targetFilter: { type: Schema.Types.Mixed, required: true },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
)

const CampaignModel: Model<ICampaign> =
  mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", campaignSchema)

export default CampaignModel
