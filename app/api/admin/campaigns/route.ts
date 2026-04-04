// GET /api/admin/campaigns — list all campaigns
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import { requireAdminAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  await connectDB()
  const campaigns = await CampaignModel.find().sort({ createdAt: -1 }).lean()

  const enriched = campaigns.map((c: any) => ({
    ...c,
    _id: c._id.toString(),
    deliveryRate: c.sentCount > 0 ? ((c.deliveredCount / c.sentCount) * 100).toFixed(1) : "0",
    readRate: c.sentCount > 0 ? ((c.readCount / c.sentCount) * 100).toFixed(1) : "0",
    progress: c.totalRecipients > 0 ? ((c.sentCount / c.totalRecipients) * 100).toFixed(1) : "0",
  }))

  return NextResponse.json({ campaigns: enriched })
}
