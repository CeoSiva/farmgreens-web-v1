// PATCH /api/admin/campaigns/[id]/pause
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

  const campaign = await CampaignModel.findByIdAndUpdate(
    id,
    { status: "paused" },
    { new: true }
  )
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ success: true })
}
