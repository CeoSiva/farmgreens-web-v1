// GET /api/admin/campaigns/estimate — count matching customers for a filter
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CustomerModel from "@/lib/models/customer"
import { requireAdminAuth } from "@/lib/api-auth"
import { buildCustomerFilter, TargetFilter } from "@/lib/gupshup-campaign"

export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const filterType = (searchParams.get("filterType") ?? "all") as TargetFilter["type"]
  const minSpend = searchParams.get("minSpend") ? Number(searchParams.get("minSpend")) : undefined
  const city = searchParams.get("city") ?? undefined
  const daysSinceJoined = searchParams.get("daysSinceJoined")
    ? Number(searchParams.get("daysSinceJoined"))
    : undefined

  const targetFilter: TargetFilter = { type: filterType, minSpend, city, daysSinceJoined }

  await connectDB()
  const filter = buildCustomerFilter(targetFilter) as any
  if (filter._cityFilter) delete filter._cityFilter

  const count = await CustomerModel.countDocuments(filter)
  return NextResponse.json({ count })
}
