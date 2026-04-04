// POST /api/admin/campaigns/[id]/send — fire campaign immediately
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import { requireAdminAuth } from "@/lib/api-auth"
import { executeCampaign } from "@/lib/campaign-engine"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { id } = await params
  await connectDB()

  const campaign = await CampaignModel.findById(id)
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!["draft", "scheduled"].includes(campaign.status)) {
    return NextResponse.json(
      { error: `Campaign is already ${campaign.status}.` },
      { status: 400 }
    )
  }

  campaign.status = "running"
  await campaign.save()

  // Fire and forget
  executeCampaign(id).catch((err) =>
    console.error("[API] executeCampaign error:", err)
  )

  return NextResponse.json({ success: true, message: "Campaign started" })
}
