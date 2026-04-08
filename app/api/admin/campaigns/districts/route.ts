import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/api-auth"
import { connectDB } from "@/lib/db"
import DistrictModel from "@/lib/models/district"

export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  await connectDB()
  const districts = await DistrictModel.find({})
    .select("_id name")
    .sort({ name: 1 })
    .lean()

  return NextResponse.json({
    districts: districts.map((d) => ({
      _id: d._id.toString(),
      name: String(d.name ?? ""),
    })),
  })
}
