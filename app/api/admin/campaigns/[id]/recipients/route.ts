// GET /api/admin/campaigns/[id]/recipients — paginated recipients
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignRecipientModel from "@/lib/models/campaign-recipient"
import { requireAdminAuth } from "@/lib/api-auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)))
  const status = searchParams.get("status") ?? undefined
  const skip = (page - 1) * limit

  await connectDB()

  const filter: any = { campaignId: id }
  if (status && status !== "all") filter.status = status

  const [recipients, total] = await Promise.all([
    CampaignRecipientModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CampaignRecipientModel.countDocuments(filter),
  ])

  return NextResponse.json({
    recipients,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
