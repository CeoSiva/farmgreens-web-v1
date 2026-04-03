// GET /api/admin/campaigns/[id]
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import CampaignRecipientModel from "@/lib/models/campaign-recipient"
import { requireAdminAuth } from "@/lib/api-auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { id } = await params
  await connectDB()

  const campaign = await CampaignModel.findById(id).lean()
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const c = campaign as any
  const failedRecipients = await CampaignRecipientModel.find({
    campaignId: id,
    status: "failed",
  })
    .select("phone customerName errorMessage createdAt")
    .limit(50)
    .lean()

  return NextResponse.json({
    campaign: {
      ...c,
      _id: c._id.toString(),
      deliveryRate: c.sentCount > 0 ? ((c.deliveredCount / c.sentCount) * 100).toFixed(1) : "0",
      readRate: c.sentCount > 0 ? ((c.readCount / c.sentCount) * 100).toFixed(1) : "0",
      progress: c.totalRecipients > 0 ? ((c.sentCount / c.totalRecipients) * 100).toFixed(1) : "0",
    },
    failedRecipients,
  })
}
