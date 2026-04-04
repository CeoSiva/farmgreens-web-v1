// GET /api/admin/campaigns/estimate — count matching customers for a filter
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CustomerModel from "@/lib/models/customer"
import OrderModel from "@/lib/models/order"
import DistrictModel from "@/lib/models/district"
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
  const customerIds = searchParams.get("customerIds")?.split(",").filter(Boolean)

  const targetFilter: TargetFilter = { type: filterType, minSpend, city, daysSinceJoined, customerIds }

  await connectDB()
  const filter = buildCustomerFilter(targetFilter) as any

  // Resolve city filter via district lookup
  if (filter._cityFilter !== undefined) {
    const cityName: string = filter._cityFilter
    delete filter._cityFilter
    const district = await DistrictModel.findOne({
      name: { $regex: new RegExp(`^${cityName}$`, "i") },
    })
    if (district) {
      filter["addresses.districtId"] = district._id
    }
  }

  // Resolve high_value via order aggregation
  if (filter._highValueFilter !== undefined) {
    const threshold: number = filter._highValueFilter
    delete filter._highValueFilter
    const ids = await OrderModel.aggregate([
      { $group: { _id: "$customer.customerId", totalSpent: { $sum: "$total" } } },
      { $match: { totalSpent: { $gte: threshold }, _id: { $ne: null } } },
      { $project: { _id: 1 } },
    ])
    filter._id = { $in: ids.map((r: any) => r._id) }
  }

  const count = await CustomerModel.countDocuments(filter)
  return NextResponse.json({ count })
}
