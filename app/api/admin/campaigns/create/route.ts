// POST /api/admin/campaigns/create — create a new campaign
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import CustomerModel from "@/lib/models/customer"
import { requireAdminAuth } from "@/lib/api-auth"
import { buildCustomerFilter, TargetFilter } from "@/lib/gupshup-campaign"

export async function POST(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { name, templateId, templateName, templateParams, targetFilter, scheduledAt } = body

    if (!name || !templateId || !templateName || !templateParams || !targetFilter) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    // Count matching opted-in customers
    const filter = buildCustomerFilter(targetFilter as TargetFilter) as any
    if (filter._cityFilter) delete filter._cityFilter
    const count = await CustomerModel.countDocuments(filter)

    // 8B. Reject if no recipients
    if (count === 0) {
      return NextResponse.json(
        { error: "No opted-in customers match this filter." },
        { status: 400 }
      )
    }

    const campaign = await CampaignModel.create({
      name,
      templateId,
      templateName,
      templateParams,
      targetFilter,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdBy: "admin",
    })

    return NextResponse.json({ campaign: campaign.toObject() }, { status: 201 })
  } catch (err: any) {
    console.error("[API] Create campaign error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
