// PATCH /api/admin/campaigns/[id]/resume
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import { requireAdminAuth } from "@/lib/api-auth"
import { executeCampaign } from "@/lib/campaign-engine"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { id } = await params
  await connectDB()

  const campaign = await CampaignModel.findByIdAndUpdate(
    id,
    { status: "running" },
    { new: true }
  )
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Resume — pending recipients still exist so engine picks up from where it left off
  executeCampaign(id).catch((err) =>
    console.error("[API] executeCampaign resume error:", err)
  )

  return NextResponse.json({ success: true })
}
