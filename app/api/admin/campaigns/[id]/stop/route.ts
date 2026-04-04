// PATCH /api/admin/campaigns/[id]/stop
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import { requireAdminAuth } from "@/lib/api-auth"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { id } = await params
  await connectDB()

  const campaign = await CampaignModel.findById(id)
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 8E. Guard — already finished
  if (campaign.status === "completed" || campaign.status === "stopped") {
    return NextResponse.json(
      { error: "Campaign is already finished." },
      { status: 400 }
    )
  }

  await CampaignModel.findByIdAndUpdate(id, {
    status: "stopped",
    completedAt: new Date(),
  })

  return NextResponse.json({ success: true })
}
